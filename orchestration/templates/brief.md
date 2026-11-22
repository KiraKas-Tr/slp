Role: <Lead | Peer>
Name: <Lead only; omit this line for a Peer>
Role instructions: Read <absolute path to orchestration/roles/lead.md or peer.md in the home repo> before acting.
Ledger: <Lead only: absolute path to orchestration/ledger.md in the home repo; append your events as its rules say. Omit for a Peer>
Target repo: <absolute path>
Shared plan: <absolute path to the Lead-owned PLAN.md in the original checkout>

Issue: <ticket in original checkout or tracker; Lead brief: tracker location>

# Brief: <short title>

## Goal
<What this piece must achieve and why. For an investigation, describe the observed problem; put any suspected cause or proposed fix under Current design choices.>

## Hard constraints
- <constraint> (state it in first person, in your own words; no quotes or source)

## Current design choices
Open to challenge with evidence.
- <choice> (reason: ...)

## Scope
Peer brief (this line only): you own <files / module>. Read anything; edit only what you own. If evidence points outside that boundary, say so in your reply with the evidence and the decision to reconsider.
Lead brief (this line only): you own `PLAN.md` in the target repo; see it for goal, outcome, and key decisions.

## Done when
- Correctness: <how it is checked: test, command, observable behavior, metric>
- Architecture: <what later slices need to be able to do; how to check that across the affected parts. Require a particular design only if it is a hard constraint above.>
