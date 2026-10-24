# Contract

The rules every Perron component follows: its files, props, events, styling, words, stories and checks. Components are built on Base UI (`@base-ui/react`), take props shaped like MUI's, and are styled in plain CSS with Perron's tokens. The reasons are in `docs/adr/0001-base-ui-with-mui-shaped-apis.md`, `docs/adr/0006-component-strings-from-locale-dictionaries.md` and `docs/adr/0007-patterns-layer.md`.

Every component starts as a spec, `docs/components/<name>.md`, copied from the [Spec template](TEMPLATE.md). Read the [brand](../foundations/README.md) and [content design](../content-design.md) before writing one.

A rule marked **Checked by `<rule>`** fails `npm run check` when broken; the [Checks](#checks) table lists them. A rule with no mark is checked by the self-gate of the build and by the reviewer.

## Files

`<Name>` is the component's name in PascalCase, `<name>` the same in kebab-case.

| File                                                       | Holds                                                                       |
| ---------------------------------------------------------- | --------------------------------------------------------------------------- |
| `packages/perron/src/components/<Name>/<Name>.tsx`         | The component, and its props type `<Name>Props`, both exported              |
| `packages/perron/src/components/<Name>/<Name>.css`         | Its styles, which the TSX imports: `import './<Name>.css'`                  |
| `packages/perron/src/components/<Name>/<Name>.stories.tsx` | Its stories and `play` tests                                                |
| `packages/perron/src/components/<Name>/<Name>.mdx`         | Its Storybook docs page, written by the `component-docs` skill after review |
| `docs/components/<name>.md`                                | Its spec                                                                    |

- One component per folder. A child the caller writes many times, such as a menu's item, is a component of its own, in its own folder.
- A component joins `packages/perron/components.json`, and `npm run registry` writes the barrel and the package exports from it.
- A component composes shared parts from `packages/perron/src/parts/<Part>/<Part>.tsx`, and other components from their own folders.

**Checked by `docs`:** every registered component has its `<Name>.mdx`.

## Props

Base UI underneath, MUI's shape on top. Base UI comes from its public entry points, `@base-ui/react/<component>`; lint stops `@mui/*`, `@base-ui-components/*` and `@base-ui/react/internals/*`.

These names mean one thing in every component. A prop outside the list is the component's own: its spec names it, and the reviewer holds it to its siblings.

| Prop                                       | Type                                                                               | Rule                                                                                                                 |
| ------------------------------------------ | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `variant`                                  | A union of string literals                                                         | The Penpot `variant` property, its values spelled as Penpot spells them. The default is the first.                   |
| `color`                                    | A subset of `'neutral' \| 'brand' \| 'success' \| 'warning' \| 'danger' \| 'info'` | An [intent](#intents). Default `'neutral'`.                                                                          |
| `size`                                     | A subset of `'small' \| 'medium' \| 'large'`                                       | Default `'medium'`.                                                                                                  |
| `disabled`, `fullWidth`, other booleans    | `boolean`                                                                          | An adjective, default `false`: `disabled`, `fullWidth`, `required`, `readOnly`. No `is`, `has` or `should` in front. |
| `startIcon`, `endIcon`                     | `ReactNode`                                                                        | An icon before or after the label, in reading order, so they swap sides in right-to-left text.                       |
| `value`, `defaultValue`, `onChange`        | See [State and events](#state-and-events)                                          |                                                                                                                      |
| `open`, `defaultOpen`, `onOpen`, `onClose` | See [State and events](#state-and-events)                                          |                                                                                                                      |
| `name`                                     | `string`                                                                           | On every control whose value a form submits.                                                                         |
| `render`                                   | Base UI's `render`                                                                 | Swaps the root element. See [Customising](#customising).                                                             |
| `slotProps`                                | One key per inner Base UI part                                                     | The only way inside. See [Customising](#customising).                                                                |
| `<key>Label`                               | `string`                                                                           | Overrides one owned string on one instance: `closeLabel`, `previousPageLabel`. See [Words](#words).                  |
| `children`, `className`, `style`, `ref`    | React's                                                                            | Reach the root. See [Root](#root).                                                                                   |

- `sx`, `classes`, `component`, `as`, `styled`, `theme`, `state`, `onValueChange`, `onOpenChange`, `leftIcon` and `rightIcon` are not props of any component.
- Every member the props type declares itself has a JSDoc comment. Members it inherits from Base UI or the HTML element keep theirs.

**Checked by `props`**, which reads each `<Name>Props` with the TypeScript compiler: the types above, the names that are not props, the boolean prefixes, and a JSDoc comment on every member.

### Intents

A `color` value is an intent: what the colour means. Each has its tokens; a component offers only the intents its spec gives tokens for. A new intent starts as tokens, through the `design-tokens` skill.

| Intent    | Text                 | Tinted surface               | Mark (icons, dots, meters) | Solid fill, with its text                              |
| --------- | -------------------- | ---------------------------- | -------------------------- | ------------------------------------------------------ |
| `neutral` | `color.text.primary` | `color.surface.inset`        | `color.text.primary`       | `color.surface.inverse`, with `color.text.inverse`     |
| `brand`   | `color.text.brand`   | `color.surface.brand-subtle` | none                       | `color.surface.brand`, with `color.text.on-color.dark` |
| `success` | `color.text.success` | `color.surface.success`      | `color.status.success`     | none                                                   |
| `warning` | `color.text.warning` | `color.surface.warning`      | `color.status.warning`     | none                                                   |
| `danger`  | `color.text.danger`  | `color.surface.danger`       | `color.status.danger`      | none                                                   |
| `info`    | `color.text.info`    | `color.surface.info`         | `color.status.info`        | none                                                   |

`brand` belongs to the hero page, and `color.text.brand` is never a link or a button's text. The status intents have no solid fill, because no text colour is measured on `color.status.*`.

## State and events

MUI's names, with Base UI's details passed through as the last argument.

- **Value:** `value`, `defaultValue` and `onChange(event, value, details)`. `details` is Base UI's event details for the change, unchanged: its `reason`, `cancel()` and the rest. `event` is `details.event`.
- **Native text:** a component whose value lives in a native `<input>` or `<textarea>` renders that element as its root and passes React's own `onChange(event)`, `value` and `defaultValue`. React Hook Form's `register()` and Formik's `handleChange` then work unchanged.
- **Open:** `open`, `defaultOpen`, `onOpen(event, details)` and `onClose(event, reason, details)`, where `reason` is `details.reason`.
- **Adapt once:** each component turns Base UI's `onValueChange(value, details)` and `onOpenChange(open, details)` into these, inside itself, and exposes neither.
- **Forms:** a composite control (Select, Checkbox, Radio group, Switch, Slider, Combobox) takes `name` and gives it to Base UI's root, so Base UI's hidden input reaches a native `<form>` and `FormData`. Form libraries connect through their controller: `Controller` in React Hook Form, `useField` in Formik.

## Root

- `ref` and the rest props reach the root element. React 19 passes `ref` as a prop, so the props type declares it.
- `{...rest}` comes before the component's own attributes, so the component's own win: `<BaseButton {...rest} ref={ref} data-variant={variant} className={…}>`.
- `className` is merged, not replaced: `pn-<Name>` first, then the caller's.
- Every prop the props type declares is taken out of `rest` before the spread, so a prop that is invalid on the element never reaches the DOM.

The contract story of 2.6 renders every component with a `ref` and a `data-testid`, and fails unless both land on one element.

## Customising

- **`render`** is Base UI's: it swaps the root element and keeps the behaviour, class and data attributes. `<Button render={<a href="/map" />}>`.
- **`slotProps`** is keyed by the Base UI part, its name in camelCase: `Select.Positioner` is `positioner`, `Select.Popup` is `popup`. Each value is that part's props, merged with Base UI's `mergeProps` (`@base-ui/react/merge-props`), the component's own props last. The root has no key; it takes the component's own props.
- A caller restyles through `className`, on the root or in `slotProps`. Styling comes from the tokens, so there is no `sx`, `classes`, `component`, `styled` or theme object.

## Change

Deprecate, never remove. An old prop or value keeps working: the component maps it to its replacement, and its JSDoc says `@deprecated Use <replacement> instead.`

**Checked by `api-compatibility`:** the generated props API of every `stable` component may only grow against the last release tag. A deliberate break is listed in the table the check reads.

## Styling

- **Classes:** `pn-<Name>` on the root, `pn-<Name>-<part>` on each inner part, with the part named as in `slotProps`: `pn-Button-icon`, `pn-Select-popup`.
- **Data attributes:** the root always carries `data-variant`, `data-color` and `data-size` with the prop's value, defaults included, if the component has the prop. A boolean that changes the look sets a bare attribute named after it: `fullWidth` sets `data-full-width`. Base UI adds its own states: `data-disabled`, `data-pressed`, `data-checked`, `data-highlighted`, `data-open`, `data-popup-open`.
- **Selectors:** one class, then attributes: `.pn-Button[data-variant='outlined'][data-size='small']`.
- **Tokens stay on `:root`.** Popups render in a portal outside the component, so component CSS never redefines a token. The one `--perron-*` property a component sets is `--perron-icon-size`.

## Design states

Hover, focus, pressed, disabled, open and selected are CSS states, read from pseudo-classes and Base UI's attributes. Penpot's `State` property maps to these, never to a prop.

| State       | Selector                                                   |
| ----------- | ---------------------------------------------------------- |
| Hover       | `:hover`, inside `@media (hover: hover)`                   |
| Highlighted | `[data-highlighted]`, a row under the pointer or the keys  |
| Focus       | `:focus-visible`, with the ring `perron.css` already draws |
| Pressed     | `:active`, `[data-pressed]`                                |
| Disabled    | `[data-disabled]`, `:disabled`                             |
| Open        | `[data-popup-open]` on a trigger, `[data-open]` on a popup |
| Selected    | `[data-selected]`, `[data-checked]`                        |
| Invalid     | `[data-invalid]`                                           |

A component that draws its own focus ring uses `focus.width`, `focus.offset` and `color.border.focus`, as [Semantic spacing](../foundations/semantic-spacing.md#focus-ring) says.

## CSS

Tokens only. **Checked by `component-css`.**

- Every colour, length, duration, shadow and font is `var(--perron-…)` or a `calc()` over them. The literals allowed are `0`, percentages, unitless numbers and keywords such as `auto`, `none`, `inherit`, `transparent` and `currentColor`.
- `var()` has no fallback: `var(--perron-space-200)`.
- Every `--perron-*` name read is a token in `packages/perron/tokens/`. A typography role brings its `-tracking` twin: `font: var(--perron-typography-label)` with `letter-spacing: var(--perron-typography-label-tracking)`.
- Component CSS reads these families: `color.text.*`, `color.surface.*`, `color.border.*`, `color.status.*`, `color.scrim`, `typography.*`, `font.*`, `space.*`, `size.*`, `radius.*`, `border.width.*`, `focus.*`, `icon.size.*`, `shadow.*`, `effect.*`, `duration.*`, `easing.*` and `z-index.*`. `palette.*` stays behind the semantic tokens. The map, transit, data-state and chart tokens are for [patterns](#patterns).
- **Icons** are sized by setting `--perron-icon-size` to an `icon.size.*` token on the element that holds them. See [Icons](../foundations/icons.md#sizes).
- **Motion** takes `duration.*` and `easing.*`. A state with no fitting duration changes at once; a new one goes through the `design-tokens` skill. A loop stops inside `@media (prefers-reduced-motion: reduce)`. See [Motion](../foundations/motion.md).
- **Stacking:** everything that renders in a portal (popups, tooltips, dialogs) takes `z-index.dialog`, so the one opened last paints on top. The other `z-index.*` tokens order the map screen's panels, for patterns.
- **Themes:** the semantic tokens carry both, so component CSS has no `[data-theme]` selector and no `prefers-color-scheme` query.
- **Media queries:** `(hover: hover)`, `(prefers-reduced-motion: reduce)` and `(forced-colors: active)` only. A component sizes to its container. Inside `(forced-colors: active)`, CSS system colours (`Canvas`, `CanvasText`, `Highlight`, `HighlightText`, `ButtonText`, `GrayText`) are allowed.
- Disabled is a colour, `color.text.tertiary`, never an opacity.

### Families

Members of a family share one treatment, in Penpot and in CSS. A new member joins its family's row; it never gets a surface of its own.

| Family   | Members                                                  | Fill                                                                                                          | Border                                                                           | Radius                                                      | Hover                                                                             | Selected                                          |
| -------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------- |
| Rows     | Options, menu items, list rows, table rows               | None                                                                                                          | None. Where the design divides rows: `border.width.025` in `color.border.subtle` | `radius.md` inside a popup; none in a table                 | `color.surface.hover`, on hover and on `[data-highlighted]`                       | `color.surface.selected`, with the `SelectedMark` |
| Fields   | Text inputs, select and combobox triggers, number fields | `color.surface.raised`                                                                                        | `border.width.025` in `color.border.control`; `color.status.danger` when invalid | `radius.md`                                                 | `color.surface.hover` laid over the fill, as a `linear-gradient` background-image | None: an open trigger keeps its rest look         |
| Popups   | Menus, select and combobox lists, popovers               | `color.surface.overlay`, `backdrop-filter` of `effect.glass-blur` and `effect.glass-saturate`, `shadow.panel` | `border.width.025` in `color.border.subtle`                                      | `radius.lg`, padded `space.100`, so rows' `radius.md` nests | None                                                                              | None                                              |
| Panels   | Dialogs, drawers                                         | As popups. A modal one sits over `color.scrim`                                                                | `border.width.025` in `color.border.subtle`                                      | `radius.xl`                                                 | None                                                                              | None                                              |
| Tooltips | Tooltips                                                 | `color.surface.inverse`, text `color.text.inverse`, no shadow                                                 | None                                                                             | `radius.md`                                                 | None                                                                              | None                                              |

- Text: rows and buttons in `typography.label`, a row's second line in `typography.caption` with `color.text.secondary`, fields in `typography.body`, tooltips in `typography.label-sm`. A placeholder and anything disabled is `color.text.tertiary`.
- Height: a field is `size.input` tall. A row is at least `size.target-min`.

## Shared parts

Each of these is drawn once, in its own folder, `packages/perron/src/parts/<Part>/` (`<Part>.tsx` and `<Part>.css`). A component composes the part; it never draws its own. Parts are internal: not registered, not exported. A new shared part joins this table first.

| Part                | Draws                                       | Composed in                                                                 | Only its folder holds                                       |
| ------------------- | ------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `VisuallyHidden`    | Text for screen readers only                | Any component with a word the eye gets from an icon or a shape              | `pn-VisuallyHidden`, and `clip-path: inset(50%)` or `clip:` |
| `CheckboxIndicator` | A checkbox's box, with its tick or dash     | `Checkbox.Indicator`, `Menu.CheckboxItemIndicator`                          | `pn-CheckboxIndicator`, and the tick icon                   |
| `SelectedMark`      | The tick beside a chosen option             | `Select.ItemIndicator`, `Combobox.ItemIndicator`, `Menu.RadioItemIndicator` | `pn-SelectedMark`, and the tick icon                        |
| `CloseButton`       | The icon button that closes what it sits in | `Dialog.Close`, `Popover.Close`, `Drawer.Close`, `Toast.Close`              | `pn-CloseButton`, and the `close` icon                      |

- `CloseButton`'s label is the owned string for "Close", overridden by the component's `closeLabel`.
- The tick is not in `packages/perron/icons/` yet. The first part that needs it adds it, following [Icons](../foundations/icons.md).

**Checked by `shared-parts`:** a part's class, its icon and, for `VisuallyHidden`, the hiding declarations appear only in that part's folder.

## What axe won't catch

Every spec copies this checklist, and the build's self-gate and the reviewer tick it against the accessibility tree of every story.

- [ ] Everything the eye is told, the ear is told: an `aria-hidden` mark has a text equivalent, for every shape the prop accepts.
- [ ] Every landmark and named region has an accessible name, from the component's own heading through `aria-labelledby` where it has one.
- [ ] Every default label can be overridden, by its `*Label` prop.
- [ ] Every shape the type accepts renders, in every variant: a `ReactNode` prop shows a string, an element and a list alike.
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`.
- [ ] Native semantics first: `<button>`, `<a href>`, `<input>` and Base UI's roles, with ARIA only for what no element says.
- [ ] Focus moves in reading order, and closing anything returns it to where it came from.
- [ ] Every target is at least `size.target-min` square.
- [ ] Loops stop when the system asks for less motion.

The rest of the WCAG 2.2 AA target is on [Accessibility](../foundations/accessibility.md).

## Words

- Visible content comes from the caller, as `children` or a prop: a button's text, a dialog's title.
- A string the component owns, such as a pagination button's "Previous page" or a dialog's "Close", comes from the locale dictionaries in `packages/perron/src/locale/` (`en.ts`, `da.ts`, `sv.ts`, `nb.ts`), in the locale `PerronProvider` sets. A new one is a key in `en.ts` and in each of the others.
- Each owned string has a `<key>Label` prop that overrides it on one instance: `close` is `closeLabel`. The component reads its strings with the overrides laid over them: `const strings = useOwnedStrings({ close: closeLabel })`, from `packages/perron/src/PerronProvider.tsx`.
- Owned strings follow [content design](../content-design.md): sentence case, the fixed data-state words, no exclamation marks. The spec gives the English; agents write the Danish, Swedish and Norwegian.

## Stories

- The default export is `satisfies Meta<typeof <Name>>`, with `component` set and `title: 'Components/<Name>'`.
- One story per variant and state the Penpot design shows, named as Penpot names it, so the visual check pairs each story with its export.
- A `play` test for every behaviour the component promises (dismissal, focus, keyboard), ending in the resting state: popups closed and focus back where it started.
- Stories run in Chromium with axe in `error` mode, so an axe violation fails CI.

## Patterns

A pattern is a piece of a Mylder screen, such as a departure row. It follows this contract, with three differences:

- Its files are in `packages/perron/src/patterns/<Name>/`, in the same four shapes, and its stories are titled `Patterns/<Name>`.
- It imports only Perron components and parts, never `@base-ui/react`. **Checked by `patterns`.**
- It takes Mylder's domain props, such as a departure or a line, and its CSS may also read `color.transit.*`, `color.data-state.*`, `color.chart.*`, `opacity.*` and `prik.*`.

It is exported from `@mylder/perron/patterns`.

## Checks

Each rule is one script, `scripts/checks/<rule>.ts`, run by `npm run check`. A deliberate exception is written in place, on the line it excuses or the line above it, with one rule and a reason:

```css
/* perron-allow(component-css): the map canvas reads this length in script */
```

| Rule                | Fails on                                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------- |
| `component-css`     | A raw colour, length or duration, a `var()` fallback, or a `--perron-*` name no token defines |
| `props`             | A prop outside the vocabulary's types, a name that is not a prop, or a prop without JSDoc     |
| `patterns`          | A pattern importing anything but Perron components and parts                                  |
| `shared-parts`      | A shared part's class, icon or declarations outside its folder                                |
| `docs`              | A registered component without its `<Name>.mdx` docs page                                     |
| `api-compatibility` | A `stable` component's props API shrinking against the last release tag                       |
| `paths`             | A path named in a doc or skill that does not exist                                            |
