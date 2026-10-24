# Glossary

The words used to talk about Perron, Mylder's design system. The words Mylder shows its riders are in [content-design.md](content-design.md).

## Layers

**Component**:
A reusable piece of interface built on Base UI, with MUI-shaped props and no knowledge of transit.
_Avoid_: Widget, primitive

**Pattern**:
A piece of a Mylder screen built only from components, which takes Mylder's domain data as props, such as a departure row.
_Avoid_: Composition, template, organism

## Building a component

**Contract**:
The rules every component follows: its props, events, styling, files and checks.
_Avoid_: Guidelines, conventions

**Spec**:
What a piece of work must do, written before it is built. A component's spec is its page in `docs/components/`: its anatomy, Base UI parts, props, tokens, keyboard behaviour and owned strings. Any other spec, such as one for a roadmap phase, is a GitHub issue.
_Avoid_: Brief, design doc

**Ticket**:
One sub-issue of a spec's issue: a slice of the work that can be built and checked on its own, naming the tickets that block it.
_Avoid_: Task, story

**Read-back**:
The machine-readable copy of a component's Penpot design, `penpot/<name>.json`, that code and checks are compared against.
_Avoid_: Export, snapshot

**Code map**:
The file that pairs each Penpot variant property and layer of a component with a React prop or CSS state.
_Avoid_: Mapping, Code Connect

**Gate**:
A point a component may not pass until a check or a person says yes.
_Avoid_: Step, checkpoint

**Pre-flight**:
The files a skill must read before it may write anything.
_Avoid_: Setup, context

**Owned string**:
A word a component shows or announces on its own, rather than one the caller passes, such as "Close". It comes from the locale dictionaries.
_Avoid_: Internal label, default text

**Intent**:
A value of a component's `color` prop, backed by tokens: what the colour means, not which colour it is.
_Avoid_: Tone, colour name

## The factory

**Factory**:
The local system of Claude Code runs that moves each component through the loop, from its issue to a ready PR.
_Avoid_: Pipeline, bot

**Run**:
One start of the factory on one component, from the moment it claims the issue to the next gate, cap or ready PR. It remembers only what the issue, the PR and `pipeline.yaml` hold.
_Avoid_: Session, job

**Scorecard**:
What one stage run records about itself in `pipeline.yaml`: its attempts, the checks that failed, its pre-flight reads, its review findings, its questions and its cost.
_Avoid_: Metrics, report

**Scorer**:
A rubric that a fresh-context agent applies to the transcripts of runs, giving each a pass, a fail or insufficient evidence, with a reason.
_Avoid_: Judge, eval, grader

**Touch**:
Anything the maintainer does for a component beyond the two gates: answering a `[PENDING]` question, clearing `needs-human`, sending a design back, asking for changes on the PR or pushing a commit to it.
_Avoid_: Steer, intervention

**Retro**:
The run that improves the factory itself. After every fifth merged component, it scores those runs and opens one PR to the instructions behind their failures.
_Avoid_: Self-improvement agent, outer loop

**Replay**:
One stage run again on a merged component's frozen inputs, to compare a proposed change with what it replaces.
_Avoid_: Shadow run, benchmark
