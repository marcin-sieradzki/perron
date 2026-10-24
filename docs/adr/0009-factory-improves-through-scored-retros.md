# The factory improves itself through scored retros that the maintainer merges

The factory gets better the way a component does: through a PR the maintainer merges. Every run records a scorecard in `pipeline.yaml`, counted from its gates, its review and its transcript. After every fifth merged component, a retro scores those runs with a few rubric scorers, picks the failures that repeat or that cost the maintainer a touch, and opens one PR that rewrites the instruction behind each, citing the runs and predicting what the next batch will show. The next retro checks those predictions first, and reverts a change that didn't hold. What a run learns reaches later runs only through a merged file, in the one place that fact belongs, so the factory keeps no memory of its own.

## Considered options

- **A memory store that runs read and write.** Rejected: each fact already has one home in the repo (the contract, the Penpot notes, a skill), and a store that runs write to would skip the merge gate and stay out of reach of the cloud fallback.
- **Judging every run as it ends.** Deferred: the counts on the scorecard cost nothing and catch most failures. The judged scorers run once per retro, over the whole batch, so the building runs keep the subscription's limits.
- **Instruction changes merged without review, or a loop that runs until a score is reached.** Rejected: the factory would grade its own work, and a score chased directly stops measuring anything. For the same reason, stage skills never read the scorers.
- **A judge from another model vendor.** Rejected: the factory runs on the Claude subscription only. A smaller Claude model judges, and the counts carry most of the signal.
- **Signals from Mylder and the library audits as a ticket source.** Deferred until the factory has a fix task. Today it only builds new components.

## Consequences

The retro PRs are the record of how the factory changed and why. A fix goes on the highest rung that prevents the failure: a check in `npm run check` comes before a contract rule, and a contract rule before a longer skill. A scorer changes only in a PR of its own, so a trend never moves because the ruler did.
