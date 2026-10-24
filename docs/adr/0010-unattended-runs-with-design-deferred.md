# The factory can run unattended, with the design deferred

The maintainer can defer a component's design, and the factory then runs it from the spec alone: brief, build, review and docs, without the Penpot design stage and without the visual check, which needs the design's exports. The brief writes the spec from the contract, the foundations, the tokens, the Base UI reference and the extracted prototype component, and its [PENDING] questions take their recommended answers, each listed in the PR as a decision to confirm. In an unattended run, the factory merges a component's PR itself once CI is green and the `code-review` skill finds no hard Standards violation and no missing or wrong Spec requirement, so the next component that depends on it can start. A deferred design is drawn later: its design run ends the deferral, and the stages after it run again against the approved drawing.

The design stage takes most of a run's time, and its approval needs the maintainer awake. Deferring it lets the backlog move overnight, at the cost of components whose look the maintainer has not approved.

## Considered options

- **Keep the design gate and run nothing overnight.** Rejected for now: one component a day is slower than the maintainer wants the backlog to move.
- **Draw the design without the approval.** Rejected: the design stage is what is slow, and an unapproved drawing would still need a second look before it binds the build.
- **Leave the merge to the maintainer.** Rejected for unattended runs: a component's dependents can't start until it is merged, so a batch would stop at the first PR.

## Consequences

Every deferred component carries `deferred` in its `pipeline.yaml`, so the backlog of designs to draw is a search. Its spec, code and stories follow the spec's decisions rather than a drawing, so a later design run can change them; the PR lists every decision the brief took on its own. An unattended batch runs up to three components side by side, each whose dependencies are merged, in a worktree and on a Storybook port of its own, and merges them one at a time, regenerating the registry's barrels and the API report after each rebase. This replaces ROADMAP 5.4's throttle of one in flight for unattended batches; the GitHub App and tracing it ties to the throttle stay deferred.
