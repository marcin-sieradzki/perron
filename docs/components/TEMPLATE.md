# Spec template

The page every component's spec starts from. The `component-brief` skill copies it to `docs/components/<name>.md` and fills it from the read-back (`penpot/<name>.json`), the code map (`penpot/<name>.code-map.json`) and `get_reference` for each Base UI part, by the rules of the [contract](../components/README.md).

How to fill it:

- Replace this heading with the component's name, `# Button`, and this paragraph and list with one sentence on what the component is for.
- Fill every `<…>` placeholder, and replace the example rows with the component's own.
- Write a question the sources can't answer in place, as `[PENDING] <the question>`, and put it to the maintainer. The spec is done when every section is filled and no `[PENDING]` is left.
- Keep every section, in this order. A section that doesn't apply says why in one line: "No owned strings: every word comes from the caller."

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

In MUI's layout. Every prop here gets this description as its JSDoc. Slots come last.

| Name               | Type                              | Default      | Base UI prop         | Description                  |
| ------------------ | --------------------------------- | ------------ | -------------------- | ---------------------------- |
| `variant`          | `'<value>' \| '<value>'`          | `'<value>'`  | none                 | `<what each value is for>`   |
| `size`             | `'small' \| 'medium' \| 'large'`  | `'medium'`   | none                 | `<…>`                        |
| `disabled`         | `boolean`                         | `false`      | `disabled`           | `<…>`                        |
| `onChange`         | `(event, value, details) => void` |              | `onValueChange`      | `<when it fires>`            |
| `<string>Label`    | `string`                          | The locale's | none                 | Overrides "`<English text>`" |
| `slotProps.<part>` | `<Component>.<Part>.Props`        |              | `<Component>.<Part>` | Props for the `<part>` part  |

## Tokens

One row per part, state and property. States are the contract's design states: rest, hover, highlighted, focus, pressed, disabled, open, selected, invalid. A value no token gives is `[PENDING] needs a token for <what>`, answered through the `design-tokens` skill.

| Part     | State | Property           | Token                    |
| -------- | ----- | ------------------ | ------------------------ |
| `root`   | rest  | `background`       | `<color.surface.raised>` |
| `root`   | hover | `background-image` | `<color.surface.hover>`  |
| `<part>` | rest  | `<property>`       | `<token>`                |

## Keyboard and ARIA

From the Base UI reference for each part. "From" says who does it: Base UI, or Perron.

| Key       | Does     | From        |
| --------- | -------- | ----------- |
| `<Enter>` | `<what>` | `<Base UI>` |

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

Every word the component shows or announces on its own. The English is here; agents write the Danish, Swedish and Norwegian in the locale files.

| String     | English           | Override        | Seen or heard where                   |
| ---------- | ----------------- | --------------- | ------------------------------------- |
| `<string>` | `<Sentence case>` | `<string>Label` | `<the part, and how it is announced>` |

## Component rules

Rules for this component alone, numbered so the build and the review can cite them.

- **CR-1.** `<rule>`. Example: Base UI's Select already handles typeahead, so the component doesn't rebuild it.

## Stories

One per variant and state the Penpot design shows, named as Penpot names it.

| Story           | Shows                       | `play` test                          |
| --------------- | --------------------------- | ------------------------------------ |
| `<Penpot name>` | `<variant, size and state>` | `<the behaviour it proves, or none>` |

## Do and don't

For a caller using the component, with the reason.

| Do                         | Don't                      |
| -------------------------- | -------------------------- |
| `<the right use, and why>` | `<the misuse it replaces>` |
