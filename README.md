# SLP (Supervisor–Lead–Peer)

Multi-agent orchestration on BB: a Supervisor oversees Leads, each Lead coordinates Peers on one task.

- `orchestration/`: the method. `SLP.md` (workflow), `roles/` (one instruction file per role), `templates/` (PLAN, brief), `ledger.md` (append-only log; rules only, no entries).
- `plugins/slp/`: the `bb slp lead|peer|tell` plugin. It only spawns and messages threads with the right flags and checks who spawns whom.
- `.agents/skills/`: `better-slp` (improve SLP from real runs), `to-tickets` (Leads) and `tdd` (Peers that write code).
- `AGENTS.md`: routes a thread to its role file by the brief's first line.

## Setup

1. Clone this repo and start agent threads in it (or copy the Orchestration section of `AGENTS.md` into your own home repo's `AGENTS.md`; keep this folder layout).
2. Install the plugin: `cd plugins/slp && npm ci`, then `bb plugin install <absolute path to plugins/slp>`.
3. Open a thread whose first line is `Role: Supervisor`.

Peer models are fixed in `plugins/slp/server.ts` (`PEER_MODELS`) and `orchestration/roles/lead.md`; change both together.
