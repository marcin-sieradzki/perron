# Spec template

The page every component's spec starts from. The `component-brief` skill copies it to `docs/components/<name>.md` and fills it from the read-back (`penpot/<name>.json`), the code map (`penpot/<name>.code-map.json`) and `get_reference` for each Base UI part, by the rules of the [contract](../components/README.md).

How to fill it:

- Replace this heading with the component's name, `# Button`, and this paragraph and list with one sentence on what the component is for. The docs page opens with it. Write how the spec was made (the design deferred under ADR 0010, its sources, what the prototype or the ROADMAP gave) below it, after a `<!-- run notes -->` line: the docs page's intro stops above that line, and the spec page shows both.
- Fill every `<…>` placeholder, and replace the example rows with the component's own.
- Write a question the sources can't answer in place, as `[PENDING] <the question>`, and put it to the maintainer. Its answer replaces the whole line with the decision, a statement with its reason, and no "Answered" label. The spec is done when every section is filled and no `[PENDING]` is left.
- Link only a page the docs site serves: the foundations, the guidelines, the contract and the other specs. Write any other repo path, such as an ADR (`docs/adr/0010-unattended-runs-with-design-deferred.md`), `penpot/README.md` or the read-back, as a code span, as the contract does; `scripts/lib/site.test.ts` fails on a link the site can't follow.
- Keep every section, in this order. A section that doesn't apply says why in one line: "No owned strings: every word comes from the caller."
- Write for people. For agents, the last section, is the one place for what an agent needs and a person doesn't.

## When to use

The first section, right after the intro and its run notes: the docs page shows it with the intro. A sentence or two on when to reach for the component, then one row per registered entry a caller might reach for in its place, its name linked to its spec page (`[LinkButton](link-button.md)`, or `../patterns/<name>.md` for a pattern), and when that one fits instead. With no entry close to it, write "Nothing else in Perron does this." in place of the table.

Use `<Name>` for `<the job it does, and where>`.

| Use instead                      | When                                      |
| -------------------------------- | ----------------------------------------- |
| `<an entry, linked to its spec>` | `<when that entry fits and this doesn't>` |

## Anatomy

Penpot page `Components/<Name>`. Family: `<Rows | Fields | Popups | Panels | Tooltips | none>`. Shared parts: `<VisuallyHidden, CheckboxIndicator, SelectedMark, CloseButton, or none>`.

| Part (Penpot layer) | What it is                      | Base UI part         | Class              | `slotProps` key |
| ------------------- | ------------------------------- | -------------------- | ------------------ | --------------- |
| `root`              | `<what the root is>`            | `<Component>.Root`   | `pn-<Name>`        | none            |
| `<part>`            | `<what this part is and holds>` | `<Component>.<Part>` | `pn-<Name>-<part>` | `<part>`        |

## Base UI parts

Imported from `@base-ui/react/<component>`, at the version pinned in `package.json`.

| Base UI part         | Renders     | Perron sets                                 | Passed through               |
| -------------------- | ----------- | ------------------------------------------- | ---------------------------- |
| `<Component>.Root`   | `<element>` | `<props the component sets, and from what>` | `<props the caller reaches>` |
| `<Component>.<Part>` | `<element>` | `<…>`                                       | `slotProps.<part>`           |

Base UI already does: `<behaviour Base UI handles, such as typeahead or focus return>`.

## Props

In MUI's layout, one row per prop the docs page shows, slots last: each prop the component declares, its description becoming the JSDoc, and each it inherits from Base UI, such as `render`, which reads `inherited` under Base UI prop and gives Base UI's type, default and description while the code inherits it as it is (the contract's [Props](../components/README.md#props)).

| Name                        | Type                              | Default      | Base UI prop         | Description                                           |
| --------------------------- | --------------------------------- | ------------ | -------------------- | ----------------------------------------------------- |
| `variant`                   | `'<value>' \| '<value>'`          | `'<value>'`  | none                 | `<what each value is for>`                            |
| `size`                      | `'small' \| 'medium' \| 'large'`  | `'medium'`   | none                 | `<…>`                                                 |
| `disabled`                  | `boolean`                         | `false`      | `disabled`           | `<…>`                                                 |
| `onChange`                  | `(event, value, details) => void` |              | `onValueChange`      | `<when it fires>`                                     |
| `render`                    | Base UI's `render`                |              | inherited            | `<Base UI's description>`                             |
| `className`, `style`, `ref` | React's                           |              | none                 | Reaches the root; `className` joins after `pn-<Name>` |
| `<key>Label`                | `string`                          | The locale's | none                 | Overrides "`<English text>`"                          |
| `slotProps.<part>`          | `<Component>.<Part>.Props`        |              | `<Component>.<Part>` | Props for the `<part>` part                           |

## Tokens

One row per part, state and property. States are the contract's design states: rest, hover, highlighted, focus, pressed, disabled, open, selected, invalid. A part a pointer presses has a hover row, a pressed row a step past it, and its cursor at rest and disabled ([Pointer feedback](README.md#pointer-feedback)). A value no token gives is `[PENDING] needs a token for <what>`, answered through the `design-tokens` skill.

| Part     | State    | Property           | Token                       |
| -------- | -------- | ------------------ | --------------------------- |
| `root`   | rest     | `background`       | `<color.surface.raised>`    |
| `root`   | hover    | `background-image` | `<color.surface.hover>`     |
| `root`   | pressed  | `background-image` | `<color.surface.selected>`  |
| `root`   | rest     | `cursor`           | none: the keyword `pointer` |
| `root`   | disabled | `cursor`           | none: the keyword `default` |
| `<part>` | rest     | `<property>`       | `<token>`                   |

## Keyboard and ARIA

From the Base UI reference for each part. "From" says who does it: Base UI, or Perron.

| Key       | Does                                                                              | From        |
| --------- | --------------------------------------------------------------------------------- | ----------- |
| `<Enter>` | `<what>`                                                                          | `<Base UI>` |
| `<Tab>`   | `<what no play test can reproduce>`. Untested: `<why user-event cannot drive it>` | `<Base UI>` |

| Element  | Role     | Accessible name from                           | States announced     |
| -------- | -------- | ---------------------------------------------- | -------------------- |
| `<part>` | `<role>` | `<children, aria-labelledby, an owned string>` | `<aria-expanded, …>` |

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: `<how>`
- [ ] Every landmark and named region has an accessible name: `<how, or none here>`
- [ ] Every default label can be overridden: `<the *Label props>`
- [ ] Every shape the type accepts renders, in every variant: `<how>`
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: `<how, or none here>`
- [ ] Native semantics first: `<the native elements and Base UI roles used>`
- [ ] Focus moves in reading order and returns on close: `<how>`
- [ ] Every target is at least `size.target-min` square: `<the smallest target>`
- [ ] Loops stop when the system asks for less motion: `<how, or none here>`

## Owned strings

Every word the component shows or announces on its own. Reuse a key `packages/perron/src/locale/en.ts` already has; a new key gets its English here, and agents write the Danish, Swedish and Norwegian in the locale files.

| Key     | English           | Override     | Seen or heard where                   |
| ------- | ----------------- | ------------ | ------------------------------------- |
| `<key>` | `<Sentence case>` | `<key>Label` | `<the part, and how it is announced>` |

## Component rules

Rules for this component alone, numbered so the build and the review can cite them.

- **CR-1.** `<rule>`. Example: Base UI's Select already handles typeahead, so the component doesn't rebuild it.

## Stories

A few generic stories, by the contract's [Stories](README.md#stories): `Default`, the component alone with every prop a control; a showcase per axis a reader compares (`Variants`, `Sizes`, `States`), every value side by side in one story; and a story per feature a grid cannot show. Hover, pressed and focus are `play` steps, never stories. A behaviour test no reader needs to see is a test-only story, tagged `['!dev', '!autodocs']`, and its Shows cell starts "Test only". One row per story the stories file exports, under its export name (the `docs` gate holds the two to each other). The contract story renders the [subject story](README.md#root) with axe on, so its Shows cell says it is the subject and its args pass every rule alone.

| Story      | Shows                                         | `play` test                          |
| ---------- | --------------------------------------------- | ------------------------------------ |
| `Default`  | `<the component alone; the subject story>`    | `<the behaviour it proves, or none>` |
| `Variants` | `<each value of the axis, side by side>`      | `<what it checks in every cell>`     |
| `<Name>`   | `<a feature, or "Test only: " and behaviour>` | `<the behaviour it proves>`          |

## Do and don't

For a caller using the component, with the reason. Each row is a rule: a `must` row's Don't is never right, a `should` row's needs a reason, and Checked by says what catches the Don't in a caller's code.

One row per rule, weighed by the contract's [Words](README.md#words), which says when a rule is `must` and when its Don't is `types`. Rule is DD- and the rule's number, counted from 1 in this table and never reused, since a review cites it. Level is `must` or `should`, and Checked by is `types` when `<Name>Props` rejects the Don't, proven by a line in the component's tests or stories under `// @ts-expect-error DD-<n>: <what it breaks>`, or `review` when only a review of the caller's code catches it; write the three as plain words. A row that names WCAG names its success criterion by number, such as 2.5.8.

| Rule | Level  | Do                         | Don't                      | Checked by |
| ---- | ------ | -------------------------- | -------------------------- | ---------- |
| DD-1 | must   | `<the right use, and why>` | `<the misuse it replaces>` | review     |
| DD-2 | should | `<…>`                      | `<…>`                      | types      |

## For agents

The last section, for agents alone: no docs page shows it. One bullet per mistake an agent has made with the component, the mistake and then its fix, added by a retro or a review finding. A new spec writes the line below.

None known yet.
