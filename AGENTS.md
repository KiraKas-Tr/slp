# SLP

## Skills

Skills live in `.agents/skills/<name>/SKILL.md`. When a skill is named, read its `SKILL.md` there.

- `better-slp`: observe how SLP performed on real tasks from outside and propose the smallest improvement, preferring removal.
- `to-tickets`: break a plan into actionable tickets.
- `tdd`: build features or fix bugs by writing a failing test first.

## Orchestration (Supervisor-Lead-Peer)

Route by the first line of the incoming brief:

- `Role: Lead` → read only `orchestration/roles/lead.md` for role instructions, then the brief and original plan.
- `Role: Peer` → read only `orchestration/roles/peer.md` for role instructions, then the brief, issue and original plan.
- `Role: Supervisor` → read `orchestration/SLP.md` and `orchestration/roles/supervisor.md`.
- No role line → an ordinary thread: do the task yourself, without SLP. If Kira asks for SLP here, act as Supervisor and read the two files above.

In another repo or worktree, use the absolute role-instructions path supplied in the brief.
