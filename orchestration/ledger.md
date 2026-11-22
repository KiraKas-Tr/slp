# SLP ledger

Log for the main agent (Supervisor), with two uses: recovery after an interruption (machine restart, crashed or stopped thread, lost context) shows each agent's last checkpoint and where to resume; `lesson` lines record what Better-SLP (`.agents/skills/better-slp`) found when observing SLP on real tasks. Goals, decisions and live issue status stay in `PLAN.md` and issues; the ledger only points at them.

## Rules for the Supervisor and Leads
Peers do not write here; their Lead logs their checkpoints.
- Append one line at the end of this file; never edit or delete existing lines. No secrets, no pasted logs.
- Who is running, where, on which model and whether they finished lives in BB (`bb thread list --parent-thread <id>`, `bb thread show <id>`) and `PLAN.md` Ownership; do not copy it here.
- Log these events for yourself:
  - `checkpoint`: after a step whose loss would cost real rework (decision made, files changed, test run): what is done and the next step.
  - `blocked`: who must act next.
  - `lesson` (Better-SLP only): one line per finding, in the state field as `<label>: <what happened> / change: <SLP change made, or none>`.

Format:
`- <ISO time with offset> | <role> <name> <thread id> | <project> | <event> | <state: done so far / next step / who acts> | ref: <PLAN.md, issue, file, commit>`

## Resume after an interruption
The Supervisor resumes Leads; a Lead resumes its own Peers.
1. List your child threads with `bb thread list --parent-thread <your thread id>` (or take them from `PLAN.md` Ownership); take each one's last `checkpoint`/`blocked` line here.
2. Check each with `bb thread show <id>`. If its workspace is gone, `bb thread restore-environment <id>`; if its last turn failed, `bb thread retry <id>`.
3. If the thread is alive, `bb slp tell <id> --file <message>` with its last checkpoint and next step. If it cannot be revived, spawn a replacement with the original brief plus that checkpoint, and confirm the old writer stopped before giving write access (see Lead instructions).
4. Append a `checkpoint` line: what was revived or replaced, and from which checkpoint.

## Better-SLP labels
With evidence; no finding, no line. Do not count messages or reviews.
- `asked-status`: Kira had to ask for status or a result.
- `decision-lost`: Kira had to restate a decision already made.
- `mechanism-rejected`: Kira rejected something an SLP mechanism produced (a notification, a report, a step).
- `challenge`: an escalation or premise challenge changed the outcome, or went nowhere.
- `review`: a review caught a defect that changed what could be reported, or cost a round and caught nothing.
- `rework`: work redone because of a stale decision or failed handoff.
- `pattern`: something that worked and is worth repeating.
- `mechanism`: verdict on one SLP mechanism (keep, simplify or remove) and why.

## Entries
