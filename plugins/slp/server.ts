// bb-plugin-slp — `bb slp` spawns SLP Leads and Peers as child threads of the
// calling thread and messages them, so agents never hand-assemble the flags in
// orchestration/SLP.md and orchestration/roles/lead.md.
import { readFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import type { BbPluginApi, PluginCliContext } from "@get-bb/plugin-sdk";

// orchestration/roles/lead.md "Peers": no third model, no fallback.
// Peer model flag -> provider and that provider's model id. Leads always run on pi.
const PEER_MODELS: Record<string, { providerId: string; model: string }> = {
  "mistral/zai-glm-5-3-flash": { providerId: "pi", model: "mistral/zai-glm-5-3-flash" },
  "mistral/deepseek-v4-1-flash-1017": { providerId: "pi", model: "mistral/deepseek-v4-1-flash-1017" },
  "devin/swe-2-flash-medium": { providerId: "devin", model: "swe-2-flash-medium" },
};

const HEARTBEAT_DEFAULT_HOURS = 8;
const HEARTBEAT_KEY = "heartbeat:";
type Heartbeat = { everyMinutes: number; nextAt: number; until: number };

// orchestration/roles/lead.md "Heartbeat" and supervisor.md "Watch mode".
const HEARTBEAT_PROMPT: Record<"Lead" | "Supervisor", string> = {
  Lead: "[SLP heartbeat] Read the latest output and issue of every running Peer and redirect any drift now. If all is on track, end this turn without a reply. Run `bb slp heartbeat off` when no Peer is running.",
  Supervisor:
    "[SLP heartbeat] Watch tick: follow the watch mode steps in your Supervisor instructions. If nothing is found, end this turn without a reply.",
};

const USAGE = `Usage:
  bb slp lead --model <id> --brief <file> [--env <env-id|dir>]
  bb slp peer --model <id> --brief <file> --title <title> [--env <env-id|dir> | --worktree --project <id>]
  bb slp tell <thread-id> (--file <path> | <message...>) [--steer]
  bb slp heartbeat (--every <minutes> [--hours <n>] | off)

The brief must start with "Role: Lead" + "Name: <name>", or "Role: Peer".
Leads run on pi, Peers on their model's provider, as children of the calling thread; they wake you
after every turn. Without --env the child uses your
environment. tell queues behind an active turn; --steer joins it instead.
Only a Lead spawns Peers; Leads and Peers do not spawn Leads.
heartbeat wakes the calling Supervisor or Lead every <minutes> while it is idle, for
<n> hours (default ${HEARTBEAT_DEFAULT_HOURS}) or until off or the thread is archived.`;

class UsageError extends Error {}

type Command = "lead" | "peer" | "tell" | "heartbeat";
type Flags = { positional: string[]; values: Map<string, string>; switches: Set<string> };

const ALLOWED: Record<Command, { values: string[]; switches: string[] }> = {
  lead: { values: ["model", "brief", "env"], switches: ["help"] },
  peer: { values: ["model", "brief", "title", "env", "project"], switches: ["worktree", "help"] },
  tell: { values: ["file"], switches: ["steer", "help"] },
  heartbeat: { values: ["every", "hours"], switches: ["help"] },
};

function positiveNumber(flags: Flags, name: string, fallback?: number): number {
  const raw = flags.values.get(name);
  if (raw === undefined && fallback !== undefined) return fallback;
  const value = Number(raw);
  if (raw === undefined || !Number.isFinite(value) || value <= 0) throw new UsageError(`--${name} needs a positive number.`);
  return value;
}

function parseArgs(command: Command, argv: string[]): Flags {
  const allowed = ALLOWED[command];
  const flags: Flags = { positional: [], values: new Map(), switches: new Set() };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (!arg.startsWith("--")) {
      flags.positional.push(arg);
      continue;
    }
    const name = arg.slice(2);
    if (allowed.switches.includes(name)) {
      flags.switches.add(name);
    } else if (allowed.values.includes(name)) {
      const value = argv[++i];
      if (value === undefined || value.trim() === "" || value.startsWith("--")) {
        throw new UsageError(`--${name} needs a value.`);
      }
      flags.values.set(name, value);
    } else {
      throw new UsageError(`Unknown flag for ${command}: ${arg}`);
    }
  }
  return flags;
}

function required(flags: Flags, name: string): string {
  const value = flags.values.get(name);
  if (value === undefined || value.trim() === "") throw new UsageError(`--${name} is required.`);
  return value;
}

function callerThread(ctx: PluginCliContext): string {
  if (!ctx.threadId) throw new UsageError("Run bb slp from an agent thread: the child is parented to it.");
  return ctx.threadId;
}

/** Resolves a path the way the caller's shell would. */
function callerPath(path: string, ctx: PluginCliContext): string {
  if (ctx.cwd) return resolve(ctx.cwd, path);
  if (!isAbsolute(path)) throw new UsageError(`Pass an absolute path: ${path}`);
  return path;
}

function samePath(a: string, b: string): boolean {
  const norm = (p: string) => {
    const r = resolve(p).replace(/[\\/]+$/, "");
    return process.platform === "win32" ? r.toLowerCase() : r;
  };
  return norm(a) === norm(b);
}

async function readText(path: string, ctx: PluginCliContext): Promise<string> {
  const full = callerPath(path, ctx);
  let text: string;
  try {
    text = await readFile(full, "utf8");
  } catch (error) {
    throw new UsageError(`Cannot read ${full}: ${(error as NodeJS.ErrnoException).code ?? error}`);
  }
  text = text.replace(/^\uFEFF/, "");
  if (text.trim() === "") throw new UsageError(`${full} is empty.`);
  return text;
}

/** Checks the brief's header (templates/brief.md) and returns the Lead name, if any. */
function checkBrief(brief: string, role: "Lead" | "Peer"): string | null {
  const lines = brief.split(/\r?\n/).map((line) => line.trim());
  if (lines[0] !== `Role: ${role}`) {
    throw new UsageError(`The brief's first line must be "Role: ${role}".`);
  }
  if (role === "Peer") return null;
  const name = /^Name:\s*(\S.*)$/.exec(lines[1] ?? "")?.[1]?.trim();
  if (!name || name.startsWith("<")) throw new UsageError('A Lead brief\'s second line must be "Name: <name>".');
  return name;
}

export default async function plugin(bb: BbPluginApi) {
  async function environmentFor(flags: Flags, callerId: string, ctx: PluginCliContext) {
    const env = flags.values.get("env");
    const project = flags.values.get("project");
    if (flags.switches.has("worktree") && env !== undefined) throw new UsageError("Use --env or --worktree, not both.");
    if (flags.switches.has("worktree") && project === undefined) {
      throw new UsageError("--worktree needs --project <target repo's BB project id>.");
    }
    if (!flags.switches.has("worktree") && project !== undefined) throw new UsageError("--project is only for --worktree.");
    if (env !== undefined && /^env_[^\\/]+$/.test(env)) {
      const found = await bb.sdk.environments.get({ environmentId: env });
      return { projectId: found.projectId, environment: { type: "reuse" as const, environmentId: env } };
    }

    const caller = await bb.sdk.threads.get({ threadId: callerId });
    if (!caller.environmentId) throw new UsageError("Your thread has no environment; pass --env <env-id>.");
    if (env === undefined && project === undefined) {
      return {
        projectId: caller.projectId,
        environment: { type: "reuse" as const, environmentId: caller.environmentId },
      };
    }
    // New workspaces run on the caller's machine.
    const { hostId } = await bb.sdk.environments.get({ environmentId: caller.environmentId });
    if (project !== undefined) {
      const workspace = { type: "managed-worktree" as const, baseBranch: { kind: "default" as const } };
      return { projectId: project, environment: { type: "host" as const, hostId, workspace } };
    }
    const path = callerPath(env!, ctx);
    // File the child under the project that owns this directory, e.g. a Lead for Clipper-Studio
    // spawned from home belongs to Clipper-Studio; other directories stay in the caller's project.
    const owner = (await bb.sdk.projects.list()).find((p) =>
      p.sources.some((s) => s.hostId === hostId && samePath(s.path, path)),
    );
    const workspace = { type: "unmanaged" as const, path };
    return { projectId: owner?.id ?? caller.projectId, environment: { type: "host" as const, hostId, workspace } };
  }

  async function spawn(role: "Lead" | "Peer", flags: Flags, ctx: PluginCliContext) {
    if (flags.positional.length > 0) throw new UsageError(`Unexpected argument: ${flags.positional[0]}`);
    const parentThreadId = callerThread(ctx);
    // One owner per scope: Peers hang off a Lead, Leads off the Supervisor (SLP.md, lead.md).
    const callerRole = (await bb.sdk.threads.getPluginMetadata({ threadId: parentThreadId })).role;
    if (role === "Peer" && callerRole !== "Lead") throw new UsageError("Only a Lead spawns Peers.");
    if (role === "Lead" && (callerRole === "Lead" || callerRole === "Peer")) {
      throw new UsageError("Leads and Peers do not spawn Leads.");
    }
    const requested = required(flags, "model");
    const target = role === "Lead" ? { providerId: "pi", model: requested } : PEER_MODELS[requested];
    if (target === undefined) {
      throw new UsageError(`Peer model must be one of: ${Object.keys(PEER_MODELS).join(", ")}. If none works, report blocked.`);
    }
    const brief = await readText(required(flags, "brief"), ctx);
    const name = checkBrief(brief, role);
    const title = role === "Lead" ? `Lead ${name}` : required(flags, "title");
    const { projectId, environment } = await environmentFor(flags, parentThreadId, ctx);

    const child = await bb.sdk.threads.spawn({
      projectId,
      environment,
      providerId: target.providerId,
      model: target.model,
      title,
      prompt: brief,
      parentThreadId,
      parentNotifications: "auto",
      senderThreadId: parentThreadId,
      pluginMetadata: { role, ...(name ? { name } : {}) },
    });
    return `Spawned ${title}: ${child.id} (${target.providerId}, requested ${target.model}).`;
  }

  async function tell(flags: Flags, ctx: PluginCliContext) {
    const [threadId, ...words] = flags.positional;
    if (!threadId) throw new UsageError("tell needs a thread id.");
    const file = flags.values.get("file");
    if (file !== undefined && words.length > 0) throw new UsageError("Pass --file or a message, not both.");
    const text = file !== undefined ? await readText(file, ctx) : words.join(" ");
    // `bb thread tell <id> -` once delivered a literal "-" and lost every message (ledger.md).
    if (text.trim() === "" || text.trim() === "-") {
      throw new UsageError("No message. Write it to a file and pass --file <path>; stdin is not read.");
    }
    const sender = callerThread(ctx);
    // Leads and Peers read messages as coming from their requester, not from another agent.
    const targetRole = (await bb.sdk.threads.getPluginMetadata({ threadId })).role;
    const fromRequester = targetRole === "Lead" || targetRole === "Peer";
    const result = await bb.sdk.threads.send({
      threadId,
      input: [{ type: "text", text, mentions: [] }],
      mode: flags.switches.has("steer") ? "steer-if-active" : "queue-if-active",
      ...(fromRequester ? {} : { senderThreadId: sender }),
    });
    return `Message ${result.delivery} to ${threadId}.`;
  }

  async function heartbeat(flags: Flags, ctx: PluginCliContext) {
    const threadId = callerThread(ctx);
    const key = HEARTBEAT_KEY + threadId;
    const [word, ...extra] = flags.positional;
    if (word === "off" && extra.length === 0 && flags.values.size === 0) {
      await bb.storage.kv.delete(key);
      return "Heartbeat off.";
    }
    if (word !== undefined) throw new UsageError(`Unexpected argument: ${word}`);
    const { role } = await bb.sdk.threads.getPluginMetadata({ threadId });
    if (role === "Peer") throw new UsageError("Peers do not run a heartbeat.");
    const everyMinutes = Math.round(positiveNumber(flags, "every"));
    if (everyMinutes < 1) throw new UsageError("--every needs at least 1 minute.");
    const hours = positiveNumber(flags, "hours", HEARTBEAT_DEFAULT_HOURS);
    const now = Date.now();
    const row: Heartbeat = { everyMinutes, nextAt: now + everyMinutes * 60_000, until: now + hours * 3_600_000 };
    await bb.storage.kv.set(key, row);
    return `Heartbeat every ${everyMinutes} min for ${hours} h. Stop it with: bb slp heartbeat off`;
  }

  // A tick only wakes an idle thread: a busy one is already awake, and queueing would stack ticks.
  bb.background.schedule("slp-heartbeat", "* * * * *", async () => {
    for (const key of await bb.storage.kv.list(HEARTBEAT_KEY)) {
      const row = await bb.storage.kv.get<Heartbeat>(key);
      const threadId = key.slice(HEARTBEAT_KEY.length);
      const now = Date.now();
      const thread = await bb.sdk.threads.get({ threadId }).catch(() => null);
      if (!row || !thread || thread.archivedAt || thread.deletedAt || now >= row.until) {
        await bb.storage.kv.delete(key);
        continue;
      }
      if (now < row.nextAt) continue;
      await bb.storage.kv.set(key, { ...row, nextAt: now + row.everyMinutes * 60_000 });
      if (thread.status !== "idle") continue;
      const { role } = await bb.sdk.threads.getPluginMetadata({ threadId });
      const text = HEARTBEAT_PROMPT[role === "Lead" ? "Lead" : "Supervisor"];
      await bb.sdk.threads.send({ threadId, input: [{ type: "text", text, mentions: [] }], mode: "queue-if-active" });
    }
  });

  bb.cli.register({
    name: "slp",
    summary: "Spawn SLP Leads/Peers and message them",
    commands: [
      {
        name: "lead",
        summary: "Spawn a Lead as your child thread (not from a Lead or Peer)",
        usage: "bb slp lead --model <id> --brief <file> [--env <env-id|dir>]",
      },
      {
        name: "peer",
        summary: "Spawn a Peer as your child thread (Lead only)",
        usage: "bb slp peer --model <id> --brief <file> --title <title> [--env <env-id|dir> | --worktree --project <id>]",
      },
      {
        name: "tell",
        summary: "Message an SLP thread (Supervisor, Lead or Peer)",
        usage: "bb slp tell <thread-id> (--file <path> | <message...>) [--steer]",
      },
      {
        name: "heartbeat",
        summary: "Wake yourself on a cadence while idle (Supervisor or Lead)",
        usage: "bb slp heartbeat (--every <minutes> [--hours <n>] | off)",
      },
    ],
    async run(argv, ctx) {
      const [command, ...rest] = argv;
      try {
        if (command !== "lead" && command !== "peer" && command !== "tell" && command !== "heartbeat") {
          if (command === undefined || command === "help" || command === "--help") return { exitCode: 0, stdout: USAGE };
          return { exitCode: 1, stderr: `Unknown command: ${command}\n\n${USAGE}` };
        }
        const flags = parseArgs(command, rest);
        if (flags.switches.has("help")) return { exitCode: 0, stdout: USAGE };
        const stdout =
          command === "tell"
            ? await tell(flags, ctx)
            : command === "heartbeat"
              ? await heartbeat(flags, ctx)
              : await spawn(command === "lead" ? "Lead" : "Peer", flags, ctx);
        return { exitCode: 0, stdout };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { exitCode: 1, stderr: error instanceof UsageError ? `${message}\n\n${USAGE}` : message };
      }
    },
  });
}
