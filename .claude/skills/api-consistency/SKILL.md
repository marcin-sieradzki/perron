---
name: api-consistency
description: "API consistency of props, names, defaults, events, slotProps and data attributes across a component's family or the library. Use in a build's self-gate or a review, or to audit the library's API."
---

Siblings that do the same thing say it the same way. This compares the public surface of every component in scope, column by column, and returns findings. `npm run gates -- props` already holds each props type to the contract's types and names on its own; this holds components to each other.

## Scope

One argument:

- `<Name>`: that component and its family. The family is every entry in its Families row (the spec's Anatomy line, "Family:") and every entry sharing its `category` in `packages/perron/components.json`. The build's self-gate and the reviewer run this form.
- A family from the contract's Families table, or a `category`: its members.
- `all`: every entry. The default when run by hand.

Only entries past `designing` have code. A scope with one member compares it with the contract alone. A scope with none is the empty scope of [`format.md`](../design-qa/format.md).

## Pre-flight

Read these before comparing anything:

- The contract, `docs/components/README.md`: Props, Names from other libraries, State and events, Root, Customising, Styling and Families.
- `packages/perron/components.json`, and each member's spec (`docs/components/<name>.md` or `docs/patterns/<name>.md`): its Props and Anatomy tables.
- Each member's code: `<Name>Props` and its defaults in `packages/perron/src/components/<Name>/<Name>.tsx`, its classes and data attributes in `<Name>.css`; a pattern's are in `packages/perron/src/patterns/<Name>/`. `packages/perron/api.json` holds the props of the `stable` ones.
- [`format.md`](../design-qa/format.md), how to report.

## Steps

1. **Resolve the scope** to its members. Done when you can list them by name, or the scope is empty.
2. **Run** `npm run gates -- props`. Done when it passes, or each failure in scope is a Defect, cited as the gate words it.
3. **Tabulate** each member's surface: every prop with its type, default and JSDoc's first line; each event with its arguments; each `slotProps` key and the Base UI part it reaches; each data attribute the root sets; each `*Label` prop and its locale key; each `pn-<Name>-<part>` class. Done when every member has a value, or "none", in every column.
4. **Compare** each column across the members, by the rules below. Done when every column has been read across every member, and each difference is a finding or has a reason in a spec.
5. **Report** in [`format.md`](../design-qa/format.md). A difference that breaks a contract rule is a Defect. A difference from a form most siblings share is Polish, naming that form. Two forms equally established, or a new prop name the next siblings will copy, is Direction, with MUI's name for it as one option: ask the Perron MCP's `get_reference`. Done when every finding names both members and the rule or the sibling form.

Return the report to the caller.

## Rules to compare by

- **One idea, one name.** The same job has the same prop name everywhere: never `size` beside `scale`, `onClose` beside `onDismiss`, `startIcon` beside `icon`.
- **One name, one type and default.** `size` is a subset of the same three values with `'medium'` first, to which only a pattern adds `'responsive'`; `variant`'s default is its first value; a boolean is an adjective, default `false`.
- **Events** have the contract's shapes: `onChange(event, value, details)`, `onOpen(event, details)`, `onClose(event, reason, details)`, and never Base UI's own `onValueChange` or `onOpenChange`. A native text control passes React's `onChange(event)`.
- **`slotProps` keys** are the Base UI part's name in camelCase, and one part has one key in every member: `popup`, `positioner`.
- **Data attributes:** `data-variant`, `data-color` and `data-size` with defaults included, and a bare attribute named after a boolean that changes the look, such as `data-full-width`.
- **Owned strings:** one locale key has one override prop everywhere, `close` as `closeLabel`.
- **Classes** follow `slotProps`: the part `popup` is `pn-<Name>-popup`.
- **JSDoc:** one prop is described the same way in every member that has it.
