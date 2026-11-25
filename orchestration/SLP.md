# SLP workflow — Supervisor only

Use this workflow with [your Supervisor instructions](roles/supervisor.md).

SLP is for larger work: work with vertical dependencies, where later slices
depend on the design earlier slices produce, and large work that splits into
independent pieces Peers can do in parallel (e.g. translating dozens of batches).
Small tasks and work that needs my constant feedback (feel, UI/UX) do not use
SLP: the Supervisor does them itself, without a Lead. When a task is not clearly
small, say whether you will use SLP and why before starting.

I usually keep one long-lived Supervisor thread over every Lead across projects;
how many Supervisors, if any, is my call per situation. I talk to the Supervisor;
it relays settled decisions to the Lead. It does not bypass a Lead or decide the
project.

```
Kira ⇄ Supervisor ⇄ Lead ⇄ Peers
```

## Start

Any thread I open without a role line is a Supervisor thread; `Role: Supervisor` as the first line also works.

Spawn and message SLP threads only with `bb slp` (the `slp` plugin; install once with `bb plugin install <home repo>/plugins/slp`). It sets parent, provider, notifications and environment and checks the brief header; ownership of scopes stays in `PLAN.md`.

## Delegate

For each task, create `PLAN.md` in the target repo using [the plan template](templates/PLAN.md). Plan files are not committed: make sure the target repo's `.gitignore` lists `/PLAN*.md`. Confirm goal, observable outcome and key decisions with Kira before handing the plan to one Lead.

Use [the brief template](templates/brief.md). Start with `Role: Lead`, then `Name: <name>`. Include the absolute path to the Lead instructions in the home repo, the absolute path to [the ledger](ledger.md), target repo, original plan and tracker. Under `Skills:`, give the absolute paths of the skills in the home repo's `.agents/skills` that this task needs, and say which ones the Lead passes to which Peers (e.g. `tdd` for Peers that write code; the Lead always has `to-tickets`); omit the line if none. The Lead does not know about the Supervisor: write the brief as its requester, in your own words. Carry every goal, decision and constraint we settled faithfully, but do not paste my messages verbatim or quote or attribute them ("Kira said").

- Spawn one Lead per task in the target repo: `bb slp lead --model <model id> --brief <brief file> --env <target directory>`. BB wakes you after every Lead turn with its reply; the Lead asks, escalates and reports in those replies, and your `bb slp tell` messages reach it as its requester's. The Lead thread ends when the task ends.

- **Lead only:** start on `openai-codex/gpt-6.2-sol`, `anthropic/claude-sonnet-5-5` or `mistral/deepseek-v4-1-flash-1017` (all on provider pi) unless I choose the Lead model. Only the Supervisor changes the Lead model at my direction. A Lead model choice never applies to Peers.

## During delegated work

Record each Lead's thread ID in `PLAN.md` Ownership. After any interruption, resume as [the ledger](ledger.md) says before anything else.

The Lead owns the plan after handoff. Read it on a wake-up; respond to escalations within your authority or take them to Kira. Do not wait or poll.

## Close

The Lead's final reply carries the result with Peer evidence. Report verified outcomes, limitations and rejected or open premise challenges to Kira and ask whether to keep or delete the plan. Stop any heartbeat you started for the task (`bb slp heartbeat off`).
