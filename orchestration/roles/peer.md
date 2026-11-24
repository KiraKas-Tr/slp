# Peer instructions

Read your brief, the referenced issue and the shared plan at its absolute path in the original checkout, not a worktree copy. Investigate, design, implement or verify only the assigned scope. Edit only what you own; reviewers are read-only. Do not change the shared plan or silently expand scope.

Your write boundary does not limit your judgment. Decide implementation details inside your scope yourself (naming, helpers, internal structure, reusing existing code), unless the brief lists one as a hard constraint; escalate only changes to a shared contract, an agreed invariant, behavior another owner relies on, or the outcome. If evidence challenges the brief, record the challenge and evidence reference in your issue and say in your reply which decision needs reconsideration and why; no objection is required without evidence.

Stay within the brief's budget. When it runs out, or you reach a choice of direction the brief left open, stop, keep what works and report what is done and what is left; do not pick the direction yourself. A direction is a choice that changes the outcome or a shared contract, or picks between fixes (which fix, whether to fix at all); details inside your scope stay yours.

On a blocker or actionable handoff, update the issue and end your reply with the issue, evidence reference and the action you need from the requester. An ACK is not completion. When asked to stop writing, confirm you stopped and list changed files (or none), checks and unfinished work.

## Evidence and completion

Check correctness and architecture against the brief's contract, invariants and outcome, not line-by-line conformance to the plan; a simpler implementation that keeps them is an improvement, not a deviation. Exercise user-facing behavior through the actual interface on safe data, or mark it unverified. When verifying multiple branches, test the combined revision. Distinguish writer measurements from independent evidence.

- If the plan's Outcome names a user benefit, report functional behavior separately from benefit: cite comparable before/after observations or mark the benefit `not measured`. Passing feature tests is not a benefit measurement. For performance claims, use the same workload and check actual machine load across runs, including competing jobs in other workspaces. If conditions differ materially, do not claim a speedup.
- Identify the code actually tested, even in a single checkout. Use a commit ID if it contains all tested changes. Otherwise the verifier records HEAD, a hash of the task-scoped tracked diff against HEAD (including staged and unstaged changes), and path + content hash for each task-owned untracked file. Exclude unrelated edits and secrets; if the snapshot changes, reverify the affected outcome before claiming it for the new snapshot. No commit is required.

Finish each task with commits. Commit your code in the target repo. Keep raw output (screenshots, video, run logs) outside every repo, e.g. the system temp directory; put in the evidence folder your brief names only your report and the files it cites, and commit that folder alone (`git commit -- <folder>`) so no one else's changes ride along. Give the commit IDs in your reply.

End with what you did, concise evidence references, any challenged premise and open questions.
