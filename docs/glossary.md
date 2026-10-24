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
One component's page in `docs/components/`: its anatomy, Base UI parts, props, tokens, keyboard behaviour and owned strings.
_Avoid_: Brief, design doc

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
