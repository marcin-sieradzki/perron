---
name: factory
description: 'Run one component or pattern through the loop, design to visual check, stopping only at a gate, a question or a cap.'
disable-model-invocation: true
argument-hint: '<Name> | batch'
---

`/factory <Name>` drives one component or pattern through the six stages of the loop: design, brief, build, review, docs and visual ([ROADMAP](../../../ROADMAP.md), "Phase 4: The agent loop"; [ADR 0003](../../../docs/adr/0003-three-agent-component-loop.md)). You are the **orchestrator**: each stage but visual runs in a fresh context of its own, and you start it, record what it returned, and talk to the maintainer. `<Name>` is the argument, in PascalCase; `<name>` is the same in kebab-case. `/factory batch` is an unattended batch over the whole registry: see [Unattended runs](#unattended-runs).

The loop's state is `components/<name>/pipeline.yaml`, and `npm run factory`, which only you run, is its only writer. The command also holds every rule: which stage comes next, what a stage needs before it may begin, each stage's gate, the caps. You follow what it prints; when it refuses, its reason is the next thing to fix or to tell the maintainer.

## The command

`npm run factory -- <command> <Name>`, each with `--json` for a parsed answer:

| Command                                                    | Does                                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| `next <Name>`                                              | Says the stage to run, or the gate it waits at and why. Never writes.    |
| `begin <Name> <stage>`                                     | Records the stage as running, or refuses with the reason (exit 1)        |
| `end <Name> <stage> <done\|failed\|pending> [--failing …]` | Checks the stage's gate from the files, records the result, prints next  |
| `approve <Name>`                                           | Records the maintainer's design approval, tied to the current read-back  |
| `defer <Name>`                                             | Takes design and visual out of the loop until a design run begins        |
| `unblock <Name>`                                           | Clears `needs-human` once the maintainer has fixed what stopped the loop |

## Stages

Each stage but visual runs as the Claude Code workflow `factory-stage` ([`.claude/workflows/factory-stage.js`](../../workflows/factory-stage.js)), through the Workflow tool with `name: 'factory-stage'` and `args: { stage, name: '<Name>' }`. It returns `{ outcome, summary, questions?, failing? }`, and the review stage also returns `review`. Visual is one command, which you run yourself.

| Stage  | Runs                                                                               | Where                       |
| ------ | ---------------------------------------------------------------------------------- | --------------------------- |
| design | [`component-design`](../component-design/SKILL.md)                                 | Local: needs the Penpot tab |
| brief  | [`component-brief`](../component-brief/SKILL.md)                                   | Local                       |
| build  | [`component-build`](../component-build/SKILL.md)                                   | Any                         |
| review | the [`component-reviewer`](../../agents/component-reviewer.md) agent, with `round` | Any                         |
| docs   | [`component-docs`](../component-docs/SKILL.md)                                     | Any                         |
| visual | `npm run visual -- <Name>`, run by you, which writes `components/<name>/visual/`   | Any, with the exports       |

## Steps

1. **Pre-flight.** Read ADR 0003 and [ADR 0008](../../../docs/adr/0008-local-component-factory.md). Work on a branch named `component/<name>`, made from `main` when it doesn't exist; check it out when it does. Run `npm ci` if `node_modules` is missing. Done when you are on the branch and `npm run factory -- next <Name>` answers.

2. **Ask what comes next.** Run `npm run factory -- next <Name> --json`. Done when you hold either a stage to run, with its `round` for review, or a gate.

3. **At a gate, act on it:**
   - **`design-approval`**: list the exports, `penpot/<name>/<Variant>.light.png` and `.dark.png`, and the choices and Direction findings the design run named, and ask the maintainer to look at the page in Penpot and approve it. When the maintainer says, in this session, that the design is approved, run `npm run factory -- approve <Name>` and go back to step 2. The approval is the maintainer's word alone: until it comes, the loop waits here.
   - **`pending-questions`**: the stage `next` names has questions. Put them to the maintainer with the [`grilling`](../grilling/SKILL.md) skill, each with its recommended answer. For the brief, the questions are the `[PENDING]` lines in the spec: write each answer in place of its line. For any other stage, they are in `next`'s reason: keep the answers, to pass as `answers` when that stage runs again. Done when every question has an answer; then go to step 4 for that stage, since `next` keeps saying `pending-questions` until its `begin` runs.
   - **`needs-human`**: tell the maintainer which stage stopped and the reason `next` gives, and stop the run. When the maintainer has fixed it and says so, run `npm run factory -- unblock <Name>` and go back to step 2.
   - **`done`**: go to step 6.

4. **Run the stage.**
   1. `npm run factory -- begin <Name> <stage>`. A refusal names the missing input: fix it when it is yours to fix (a file a stage forgot to commit), otherwise tell the maintainer and stop.
   2. For design, check the Penpot MCP answers (`high_level_overview`); when it doesn't, ask the maintainer to open the "Perron Design System" file and choose File → MCP Server → Connect, and wait.
   3. For visual, run `npm run visual -- <Name>` yourself. Exit 0 is `done`. Any other exit is `failed`: the failing parts `components/<name>/visual/report.md` names, or the error the command printed when it wrote no report.
   4. For every other stage, start the workflow with `{ stage, name }`, and for review the `round` that `next` gave, and `answers` when the stage runs again after its questions. Keep the run id it returns: when the run is interrupted in this session, start it again with `resumeFromRunId` and the same args, so finished agent calls are not repeated.
   5. For review, write the returned `review` to `components/<name>/review.md`, unchanged.

   Done when the command or the workflow has given its outcome.

5. **Record it.** `npm run factory -- end <Name> <stage> <outcome>`, with `--failing "<the run's failing text, or its numbered questions>"` for `failed` and `pending`. Then commit the stage's files and the pipeline file together: `<Name>: <stage> <outcome>`. Done when `end` has printed what comes next and the commit is made. Go back to step 2.

6. **Open the PR.** Push `component/<name>`, then open its PR with `gh pr create --base main --head component/<name> --title "<Name>" --body-file <file>`, ready for review. The body holds, in this order: a summary of the run, stage by stage; every Direction finding the stages reported; each P2 and P3 finding still in `components/<name>/review.md`; and the whole of `components/<name>/visual/report.md`. Tell the maintainer the PR's link; the maintainer merges it. Done when the PR is open and its link is sent.

## Unattended runs

When the maintainer asks for an unattended run, with the design deferred ([ADR 0010](../../../docs/adr/0010-unattended-runs-with-design-deferred.md)), the steps above change in four places, and nothing waits on the maintainer:

- **Pre-flight.** Run `npm run factory -- defer <Name>` after step 1, unless `next` already says the design is deferred.
- **`pending-questions`.** Answer every question with its own recommended answer, exactly as the maintainer's "all recommended" would, and keep each one, with its section, for the PR's **Decisions to confirm**.
- **`needs-human`.** Push the branch, open the PR as a draft with the reason at the top, and go on to the next component whose `dependsOn` doesn't reach this one.
- **The PR.** Step 6's body gains **Decisions to confirm** after the run summary. Then:
  1. Run the [`code-review`](../code-review/SKILL.md) skill on `component/<name>` against `main`, with the spec as its spec.
  2. Every hard Standards violation, and every missing or wrong Spec requirement, is fixed on the branch by one fresh agent given the review, until `npm run check` passes; then push and review once more. A second review that still finds one turns the PR into a draft, as `needs-human` does. Judgement-call smells and scope notes go in the PR body.
  3. `gh pr checks <n> --watch`. Done when every check passes; a red check is fixed the same way, once.
  4. `gh pr merge <n> --merge --delete-branch`, then `git checkout main && git pull`.

  Done when the PR is merged and `main` holds it.

**A batch** runs the components of `packages/perron/components.json` side by side, up to three at a time. A component is **ready** when its entry isn't `stable` on `main`, it has no open PR, and every entry in its `dependsOn` is `stable` on `main`. While fewer than three run and one is ready, take the first ready one in the registry's order and give it a slot:

1. **Worktree.** `git worktree add ../perron-worktrees/<name> -b component/<name> main` (or with the existing branch), then `npm ci` in it. Its Storybook port is 6010 plus its slot number, and every command you run for it, `npm run factory` included, runs from its worktree with `STORYBOOK_PORT` set to that port.
2. **Stages.** Start each stage's workflow with `dir`, the worktree's absolute path, and `port` in its args, besides `stage` and `name`. Run each component's stages in order; different components' stages run at the same time.
3. **Merge, one component at a time.** Before a PR's code review, rebase its branch on the latest `main`. Each conflict in a shared file keeps both sides: both registry entries, both locale keys. Then run `npm run registry` and `npm run api` and commit what they rewrite, so the barrels, exports and API report are regenerated, never hand-merged, and `npm run check` passes. Merge as above, then the next PR waiting.
4. **Free the slot.** `git worktree remove ../perron-worktrees/<name>` once the PR is merged or left as a draft, and fill the slot with the next ready component.

Done when no component is ready and none runs; then say which ones were merged and which were left as drafts, with each draft's reason.

## Resuming

A run picks up from the files. When a session ends mid-stage, `next` says the stage began and has not ended: run step 4 again, and the stage's skill builds on what the last run wrote. Nothing else carries over between sessions, so every stage ends with step 5's commit.
