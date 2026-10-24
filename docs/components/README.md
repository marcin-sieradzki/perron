# Contract

The rules every Perron component follows: its files, props, events, styling, words, stories and checks. Components are built on Base UI (`@base-ui/react`), take props shaped like MUI's, and are styled in plain CSS with Perron's tokens. The reasons are in `docs/adr/0001-base-ui-with-mui-shaped-apis.md`, `docs/adr/0006-component-strings-from-locale-dictionaries.md` and `docs/adr/0007-patterns-layer.md`.

Every component starts as a spec, `docs/components/<name>.md`, and every pattern as one in `docs/patterns/<name>.md`, copied from the [Spec template](TEMPLATE.md). Read the [brand](../foundations/README.md) and [content design](../content-design.md) before writing one.

The rules the [Checks](#checks) table names fail `npm run check` when broken. The rest are held by the build's self-gate (the `component-build` skill's own pass over the stories, looped until clean before review) and by the reviewer.

## Files

`<Name>` is the component's name in PascalCase, `<name>` the same in kebab-case.

| File                                                       | Holds                                                                                                                        |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `packages/perron/src/components/<Name>/<Name>.tsx`         | The component, and its props type `<Name>Props`, both exported                                                               |
| `packages/perron/src/components/<Name>/<Name>.css`         | Its styles, which the TSX imports: `import './<Name>.css'`                                                                   |
| `packages/perron/src/components/<Name>/<Name>.stories.tsx` | Its stories and `play` tests                                                                                                 |
| `packages/perron/src/components/<Name>/<Name>.mdx`         | Its Storybook docs page, written by the `component-docs` skill after review                                                  |
| `docs/components/<name>.md`                                | Its spec; a pattern's is `docs/patterns/<name>.md`                                                                           |
| `storybook/pages/<name>.mdx`                               | Its spec's Storybook page: `storybook/pages/contract.mdx` with the spec's path, titled `Specs/<Name>`                        |
| `components/<name>/`                                       | Its place in the loop: `pipeline.yaml`, which `npm run factory` alone writes, `review.md` and the visual report in `visual/` |

- One component per folder. A child the caller writes many times, such as a menu's item, is a component of its own, in its own folder.
- A component joins `packages/perron/components.json`, and `npm run registry` writes the barrel and the package exports from it.
- A component composes shared parts from `packages/perron/src/parts/<Part>/<Part>.tsx`, and other components from their own folders.

An entry's `status` in `packages/perron/components.json` says how far it has come, and what it has by then:

| Status       | Set when                                          | It has                                                                        |
| ------------ | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `designing`  | It joins the registry                             | Nothing yet: it is not exported, listed or checked                            |
| `building`   | The build stage starts                            | Its code and its spec; it joins the barrels and the sidebar                   |
| `stable`     | Its docs stage is done, in the component's own PR | Its `<Name>.mdx` too, and a props API that only grows (see [Change](#change)) |
| `deprecated` | Its replacement is `stable`                       | Everything a stable entry has; it keeps working                               |

## Props

Base UI underneath, MUI's shape on top. Base UI comes from its public entry points, `@base-ui/react/<component>`; lint stops `@mui/*`, `@base-ui-components/*` and `@base-ui/react/internals/*`.

These names mean one thing in every component. A prop outside the list is the component's own: its spec names it, and the reviewer holds it to its siblings.

| Prop                                       | Type                                         | Rule                                                                                                                 |
| ------------------------------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `variant`                                  | A union of string literals                   | The Penpot `variant` property, its values spelled as Penpot spells them. The default is the first.                   |
| `color`                                    | A subset of the [intents](#intents)          | Default `'neutral'`.                                                                                                 |
| `size`                                     | A subset of `'small' \| 'medium' \| 'large'` | Default `'medium'`.                                                                                                  |
| `disabled`, `fullWidth`, other booleans    | `boolean`                                    | An adjective, default `false`: `disabled`, `fullWidth`, `required`, `readOnly`. No `is`, `has` or `should` in front. |
| `startIcon`, `endIcon`                     | `ReactNode`                                  | An icon before or after the label, in reading order, so they swap sides in right-to-left text.                       |
| `value`, `defaultValue`, `onChange`        | See [State and events](#state-and-events)    |                                                                                                                      |
| `open`, `defaultOpen`, `onOpen`, `onClose` | See [State and events](#state-and-events)    |                                                                                                                      |
| `name`                                     | `string`                                     | On every control whose value a form submits.                                                                         |
| `render`                                   | Base UI's `render`                           | Swaps the root element. See [Customising](#customising).                                                             |
| `slotProps`                                | One key per inner Base UI part               | The only way inside. See [Customising](#customising).                                                                |
| `<key>Label`                               | `string`                                     | Overrides one owned string on one instance: `closeLabel`, `previousPageLabel`. See [Words](#words).                  |
| `children`, `className`, `style`, `ref`    | React's                                      | Reach the root. See [Root](#root).                                                                                   |

Every member the props type declares itself has a JSDoc comment. Members it inherits from Base UI or the HTML element keep theirs. The docs page's props table lists every member the props type declares and every one it inherits from Base UI, with Base UI's JSDoc and `@default`; the HTML element's attributes reach the root and get no row, as in MUI's tables. Its Default column shows each prop's destructuring default, or, where the component has none to write, the member's `@default`: an owned-string prop says `@default The locale's`, as the spec's Props table gives it.

The spec's Props table has the docs page's rows: one per member the props type declares, and one per member it inherits from Base UI, such as `render`. An inherited row reads `inherited` in its Base UI prop column and gives Base UI's type, `@default` and description. The row documents the member and asks nothing of the code: the props type inherits it and declares only its own members, so Base UI's JSDoc reaches the docs page unchanged. The `docs` check holds the two tables to each other (see [Checks](#checks)).

### Names from other libraries

Where another library takes a prop on the right, a Perron component takes what is on the left:

| Use                                                            | In place of               |
| -------------------------------------------------------------- | ------------------------- |
| `className`, the data attributes and the tokens                | `sx`, `classes`, `styled` |
| `render`                                                       | `component`, `as`         |
| The tokens, which carry both themes                            | `theme`                   |
| CSS states: pseudo-classes and Base UI's data attributes       | `state`                   |
| `onChange(event, value, details)`                              | `onValueChange`           |
| `onOpen(event, details)` and `onClose(event, reason, details)` | `onOpenChange`            |
| `startIcon`                                                    | `leftIcon`                |
| `endIcon`                                                      | `rightIcon`               |

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

`brand` is the primary colour: a brand button marks the main action, with `color.surface.brand-hover` on hover and a `color.border.brand` edge, and `color.text.brand` labels its outline. It is never a link. Each action component (Button, IconButton, a Toolbar's buttons) offers `brand` beside `neutral`; the default stays `neutral`, so a screen has one brand action at most. The status intents have no solid fill, because no text colour is measured on `color.status.*`.

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

The contract story, `storybook/contract/Contract.stories.tsx`, renders every registered component and pattern past designing with a `ref` and a `data-testid`, and fails unless both land on one element. It renders each with the args of its `Default` story over its meta's, or, with no `Default`, of its alphabetically first story (a module namespace lists exports alphabetically, not in the file's order), so those args must render it alone, and a new component needs no edit to the contract story.

## Customising

- **`render`** is Base UI's: it swaps the root element and keeps the behaviour, class and data attributes. `<Button render={<a href="/map" />}>`.
- **`slotProps`** is keyed by the Base UI part, its name in camelCase: `Select.Positioner` is `positioner`, `Select.Popup` is `popup`. Each value is that part's props, merged with Base UI's `mergeProps` (`@base-ui/react/merge-props`), the component's own props last. The root has no key; it takes the component's own props.
- A caller restyles through `className`, on the root or in `slotProps`, with the tokens.

## Change

Deprecate, never remove. An old prop or value keeps working: the component maps it to its replacement, and its JSDoc says `@deprecated Use <replacement> instead.`

`packages/perron/api.json` is the props API of every `stable` or `deprecated` component: each member its props type declares, whether it is optional, its type, and what the type extends. `npm run api` writes it from the code, and `npm run check` fails while it is stale.

Against `api.json` at the last release tag, `@mylder/perron@<version>`, the API only grows: a new optional prop, a prop made optional, a wider union, a new base. A prop removed, narrowed or made required, a new required prop, a base dropped or a component removed is a break.

### Breaking changes

A deliberate break is a row of this table, which the check reads: the component, the prop (`extends` for a base the props type dropped, `*` for the whole component) and the reason. Take the row out once the release that ships the break is out.

| Component | Prop | Reason |
| --------- | ---- | ------ |

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

Tokens only.

- Every colour, length, duration, shadow and font is `var(--perron-…)` or a `calc()` over them. The literals allowed are `0`, percentages, unitless numbers and keywords such as `auto`, `none`, `inherit`, `transparent` and `currentColor`.
- `var()` has no fallback: `var(--perron-space-200)`.
- Every `--perron-*` name read is a token in `packages/perron/tokens/`. A typography role brings its `-tracking` twin: `font: var(--perron-typography-label)` with `letter-spacing: var(--perron-typography-label-tracking)`.
- Each layer reads the tokens of its row in [Token families](#token-families).
- **Icons** are sized by setting `--perron-icon-size` to an `icon.size.*` token on the element that holds them. See [Icons](../foundations/icons.md#sizes).
- **Motion** takes `duration.*` and `easing.*`. A state with no fitting duration changes at once; a new one goes through the `design-tokens` skill. A loop (`infinite`) stops inside `@media (prefers-reduced-motion: reduce)`, in a rule with the loop's own selector that sets its `animation`. See [Motion](../foundations/motion.md).
- **Stacking:** everything that renders in a portal (popups, tooltips, dialogs) takes `z-index.dialog`, so the one opened last paints on top. The other `z-index.*` tokens order the map screen's panels, for patterns.
- **Themes:** the semantic tokens carry both, so component CSS has no `[data-theme]` selector and no `prefers-color-scheme` query.
- **Media queries:** the three in [Media queries](#media-queries). A component sizes to its container.
- Disabled is a colour, `color.text.tertiary`, never an opacity.

### Token families

The tokens each layer's CSS reads. `palette.*` stays behind the semantic tokens.

| Layer                     | Reads                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Component and shared part | `color.text.*`, `color.surface.*`, `color.border.*`, `color.status.*`, `color.scrim`, `typography.*`, `font.*`, `space.*`, `size.*`, `radius.*`, `border.width.*`, `focus.*`, `icon.size.*`, `shadow.*`, `effect.*`, `duration.*`, `easing.*`, `z-index.dialog`, and for Mylder's vocabulary (line badges, delays, Prik) `color.transit.*`, `color.data-state.*` and `prik.*` |
| Pattern                   | A component's, and `color.map.*`, `map.*`, `color.chart.*`, `opacity.*` and every `z-index.*`                                                                                                                                                                                                                                                                                 |

### Media queries

| Query                              | For                                                                                                                                          |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `(hover: hover)`                   | Hover, as [Design states](#design-states) says                                                                                               |
| `(prefers-reduced-motion: reduce)` | Stopping a loop                                                                                                                              |
| `(forced-colors: active)`          | Forced colours, the one place CSS system colours are allowed: `Canvas`, `CanvasText`, `Highlight`, `HighlightText`, `ButtonText`, `GrayText` |

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
- `expectOwnedStrings(markup, locale, callerStrings)`, from `packages/perron/src/testing/owned-strings.ts`, fails a render that shows or announces a word neither the locale's dictionary nor the caller gave. The contract story runs it over every component (see [Stories](#stories)); a component with more words in another state, such as an open dialog's close label, calls it in its own test on that render: `expectOwnedStrings(renderToStaticMarkup(<PerronProvider locale="da">…</PerronProvider>), 'da', ['Departures'])`.

## Stories

- The default export is `satisfies Meta<typeof <Name>>`, with `component` set and `title: 'Components/<Name>'`.
- One story per variant and state the Penpot design shows, named as Penpot names it, so the visual check pairs each story with its export.
- A `play` test for every behaviour the component promises (dismissal, focus, keyboard), ending in the resting state: popups closed and focus back where it started.
- Stories run in Chromium with axe in `error` mode (`npm run test:stories`, part of `npm run check`), so an axe violation fails CI. The contract story's `Keyboard` story is the `play` pattern to copy: Tab to the element, expect focus, Shift+Tab back.
- The contract story's `OwnedStrings` story renders every component and pattern with the args its `Root` story takes (see [Root](#root)), in `en`, `da`, `sv` and `nb`, and runs `expectOwnedStrings` on each render, with the strings in those args as the caller's words. So those args hold every word the caller gives.

## Patterns

A pattern is a piece of a Mylder screen, such as a departure row. It follows this contract, with three differences:

- Its files are in `packages/perron/src/patterns/<Name>/`, in the same four shapes, its stories are titled `Patterns/<Name>`, and its spec is `docs/patterns/<name>.md`.
- Its code imports only Perron's components and parts, `PerronProvider`, React and the files of its own folder, never `@base-ui/react`. A type-only import from another package is fine, and its stories and tests are not its code.
- It takes Mylder's domain props, such as a departure or a line, and its CSS reads the pattern row of [Token families](#token-families).

It is exported from `@mylder/perron/patterns`.

## Checks

Each rule is one script, `scripts/checks/<rule>.ts`. `npm run gates` runs them all, as part of `npm run check`, and `npm run gates -- <rule>` runs one. A deliberate exception is written in place, on the line it excuses or the line above it, with one rule and a reason:

```css
/* perron-allow(component-css): the map canvas reads this length in script */
```

In Markdown it is an HTML comment holding `perron-allow(paths): reason`, at the end of the line it excuses: prettier sets a comment on its own line apart from the text below it. A rule whose breach has no line, `docs` and `api-compatibility`, takes no allowance, and nor does `penpot`, whose files are JSON. Every run of the gates also fails an allowance that names no rule or gives no reason, wherever it is.

| Rule                | Fails on                                                                                                                                                                                                                                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `component-css`     | A [CSS](#css) rule broken: a raw value, a `var()` fallback, a `--perron-*` name no token defines, a token outside its layer's [families](#token-families), a query outside [Media queries](#media-queries), a loop that never stops                                                                 |
| `props`             | A `<Name>Props`, read with the TypeScript compiler, outside the [Props](#props) table's types, with a [name from other libraries](#names-from-other-libraries), an `is`, `has` or `should` boolean, a member without JSDoc, or a `render` it declares itself rather than inherits from Base UI      |
| `patterns`          | A [pattern](#patterns) importing anything but Perron components and parts                                                                                                                                                                                                                           |
| `shared-parts`      | A [shared part](#shared-parts)'s class, icon or declarations outside its folder                                                                                                                                                                                                                     |
| `docs`              | A registered entry without its spec from `building` on, its `<Name>.mdx` from `stable` on (see [Files](#files)), code from which the docs page's docgen reads no props, a member without a spec Props row or a row without a member, or a prop whose default it reads otherwise than the spec gives |
| `api-compatibility` | A `stable` or `deprecated` entry's props API shrinking against the last release tag (see [Change](#change))                                                                                                                                                                                         |
| `paths`             | A path a doc or skill names, in a link or a code span, that does not exist                                                                                                                                                                                                                          |
| `penpot`            | A design read back with an unknown token, an unbound value, or an unmapped variant or layer                                                                                                                                                                                                         |
