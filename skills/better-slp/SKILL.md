---
name: better-slp
description: Observe how SLP itself performed on real tasks and propose the smallest improvement, preferring to remove steps. Use when Kira names better-slp.
disable-model-invocation: true
---

# Better-SLP

You observe SLP from outside; you are not a participant. SLP gets the same rule it gives agents: no mechanism is kept only because it exists. Many of the best improvements remove a step.

Run in a thread that took no part in the observed task. Stay read-only on target repos and SLP files until Kira approves a change. Do not steer running SLP threads.

## Gather
- Find the task's threads from `PLAN.md` Ownership or `bb thread list --include-archived --parent-thread <id>`.
- Read the real logs across roles, not only summaries: `bb thread log <id> --all` for Supervisor, Lead and Peers, plus `PLAN.md`, issues and ledger lines. Each role's log shows only its own side; your value is the joined view.
- Keep missing evidence explicit: if a log is gone or a step was not observable, say "not observed" instead of inferring it.

## Judge
- Pick the few events that mattered: Kira's interventions or repeated questions, escalations, premise challenges, reviews, handoffs, rework, interruptions.
- For each, trace the chain of change: what the owner knew when assigning; whether the intervention came at the right time and was right; what the Peer found; whether the evidence was enough to change the judgment; which owners received the new decision; what changed in the final result.
- For each SLP mechanism the task used (briefs, monitoring, ledger, lanes, reviews), ask whether it changed an outcome and what it cost. Verdict: keep, simplify or remove.
- Note good patterns worth repeating, not only failures.
- Judge outcomes, not activity. Do not count messages, reviews or plan changes. A few useful reviews do not justify more reviews. No rule for a one-off.

## Report
- To Kira: findings with thread references, good patterns, mechanism verdicts, and the smallest proposed change for each real problem, preferring removal. Each finding states its impact, expected outcome, the boundary of the fix, and how a later run will show it worked.
- Append one `lesson` line per finding to `orchestration/ledger.md` (see its labels).
- Edit SLP only after Kira approves. Record which signal the change should remove; on the next run, if the signal persists, propose reverting it. A passing check only shows the change ran; only a comparable later task shows SLP improved.
