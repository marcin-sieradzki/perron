# SeverityLabel

The kind of a disruption on a line, as its icon and its name in its colour, such as a warning triangle and "Delays", heading a disruption card or a row in a list of disruptions.

## Anatomy

Penpot page `Components/SeverityLabel`, not drawn yet: the design is deferred (`docs/adr/0010-unattended-runs-with-design-deferred.md`), so this spec decides the drawing. Family: none. Shared parts: none.

SeverityLabel has no Base UI part: it is a label with no behaviour, and the registry gives it no `baseUiParts`. Its root renders through Base UI's `useRender` hook (`@base-ui/react/use-render`), which gives it the `render` prop, and its inner parts are plain elements.

| Part (Penpot layer) | What it is                                                                                                                              | Base UI part                                   | Class                    | `slotProps` key |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------ | --------------- |
| `root`              | The whole label, one inline run: a `<span>` laid out as an inline flex row, in the kind's colour                                        | none: a `<span>` rendered by `useRender`       | `pn-SeverityLabel`       | none            |
| `icon`              | The kind's icon from `packages/perron/icons/`, an inline `<svg>` drawn in `currentColor` at `icon.size.325`, hidden from screen readers | none: a plain `<svg>`, no behaviour to borrow  | `pn-SeverityLabel-icon`  | none            |
| `label`             | The kind's name, "Delays", "Diversions", "Planned works" or "Data feed problems", the words the eye and the ear both get                | none: a plain `<span>`, no behaviour to borrow | `pn-SeverityLabel-label` | none            |

The icon for each kind is the one `packages/perron/icons/icons.json` lists for it under Disruptions: `warning` for delays, `diversion` for diversions, `calendar` for planned works and `signal-off` for data feed problems. Each colour is the `color.transit.severity.*` token of the same name, which [Data states](../foundations/data-states.md#kinds-of-disruption) says always comes "with its icon and its name".

SeverityLabel's one Penpot variant property is `severity`, with the values `delay`, `data`, `diversion` and `planned`, the names of the `color.transit.severity.*` tokens. It maps to the `severity` prop with the same values. The variants are `Delay`, `Data`, `Diversion` and `Planned`, and the stories carry those names. There is no `State` property: the label is not interactive.

## Base UI parts

SeverityLabel imports no Base UI component. It uses two Base UI utilities, at the version pinned in `package.json`: `useRender` (`@base-ui/react/use-render`) for the root and `mergeProps` (`@base-ui/react/merge-props`) to merge the caller's props with its own.

| Base UI part                     | Renders  | Perron sets                                                                                                                                                                                             | Passed through                                        |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `useRender` (a hook, not a part) | `<span>` | `defaultTagName: 'span'`, `state: { severity }` (which `useRender` writes as `data-severity`), `className` (`pn-SeverityLabel` first, then the caller's), the children: `icon` and `label` (CR-2, CR-3) | `render`, `ref`, `className`, `style`, the rest props |

Base UI already does: swapping the root element for the one `render` gives, keeping the class, the data attribute and the children; turning each `state` property into a `data-*` attribute; merging the caller's `ref` with the element's; and joining `className` and `style` and chaining event handlers through `mergeProps`.

## Props

In MUI's layout. Every prop here gets this description as its JSDoc. SeverityLabel takes no `children`: it writes its own icon and words (CR-4). It has no `slotProps`, because the contract keys `slotProps` by inner Base UI part and SeverityLabel has none; a caller restyles it through `className` on the root. `className` and `style` are React's, inherited and so not rows of the table below: both reach the root through `mergeProps`, and `className` is merged after `pn-SeverityLabel`.

The kind is `severity`, as MUI's Alert names the same idea, rather than `variant`: the contract's `variant` is a look with a default, and the kind is what the label says, so it has none.

The kind is required, with no default, and typed `'delay' | 'data' | 'diversion' | 'planned'` after the `color.transit.severity.*` tokens: a label with no kind says nothing true, and a default of `delay` would claim a delay the caller never gave.

| Name                    | Type                                            | Default      | Base UI prop        | Description                                                                                                                                                                               |
| ----------------------- | ----------------------------------------------- | ------------ | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `severity`              | `'delay' \| 'data' \| 'diversion' \| 'planned'` | (required)   | none                | The kind of disruption: `delay` for vehicles running late, `diversion` for a changed route, `planned` for planned works, `data` for a problem with the real-time data feed.               |
| `render`                | Base UI's `render`                              |              | inherited           | Allows you to replace the component's HTML element with a different tag, or compose it with another component. Accepts a `ReactElement` or a function that returns the element to render. |
| `delaysLabel`           | `string`                                        | The locale's | none                | Overrides "Delays", the name shown for `severity='delay'`                                                                                                                                 |
| `diversionsLabel`       | `string`                                        | The locale's | none                | Overrides "Diversions", the name shown for `severity='diversion'`                                                                                                                         |
| `plannedWorksLabel`     | `string`                                        | The locale's | none                | Overrides "Planned works", the name shown for `severity='planned'`                                                                                                                        |
| `dataFeedProblemsLabel` | `string`                                        | The locale's | none                | Overrides "Data feed problems", the name shown for `severity='data'`                                                                                                                      |
| `ref`                   | `Ref<HTMLSpanElement>`                          |              | `useRender`'s `ref` | Reaches the root element                                                                                                                                                                  |

## Tokens

SeverityLabel is not interactive, so its one design state is rest; each row's state names the `data-severity` value it applies to. It is not one of the contract's families, and the `color.transit.severity.*` tokens colour an "icon and label" with no tinted surface of their own, so it draws no fill, border or radius.

SeverityLabel comes in one size, with no `size` prop: set in `typography.label-sm`, with a `space.100` gap between the icon and the name and the icon at `icon.size.325`, the disruption icons' size "inline with label and caption text". `typography.label-sm` (12 px, 500) keeps the label below a card's `typography.heading-sm` title rather than competing with it; a second size can join later as a `size` prop without a break.

| Part    | State                             | Property                    | Token                                                                     |
| ------- | --------------------------------- | --------------------------- | ------------------------------------------------------------------------- |
| `root`  | rest, every `data-severity`       | `display`                   | none: the keyword `inline-flex`                                           |
| `root`  | rest, every `data-severity`       | `align-items`               | none: the keyword `center`, so the icon sits on the text's middle         |
| `root`  | rest, every `data-severity`       | `gap`                       | `space.100`                                                               |
| `root`  | rest, every `data-severity`       | `font`                      | `typography.label-sm`                                                     |
| `root`  | rest, every `data-severity`       | `letter-spacing`            | `typography.label-sm-tracking`                                            |
| `root`  | rest, every `data-severity`       | `--perron-icon-size`        | `icon.size.325`                                                           |
| `root`  | rest, `data-severity='delay'`     | `color`                     | `color.transit.severity.delay`                                            |
| `root`  | rest, `data-severity='data'`      | `color`                     | `color.transit.severity.data`                                             |
| `root`  | rest, `data-severity='diversion'` | `color`                     | `color.transit.severity.diversion`                                        |
| `root`  | rest, `data-severity='planned'`   | `color`                     | `color.transit.severity.planned`                                          |
| `icon`  | rest, every `data-severity`       | `inline-size`, `block-size` | `--perron-icon-size`, through the `.perron-icon` class `perron.css` gives |
| `icon`  | rest, every `data-severity`       | `stroke`, `fill`            | none: `currentColor`, the root's colour                                   |
| `label` | rest, every `data-severity`       | `color`                     | none: inherits the root's                                                 |

Every `color.transit.severity.*` token reaches 4.5:1 on `color.surface.default`, `raised` and `inset` in both themes ([Accessibility](../foundations/accessibility.md#text-on-surfaces)), so the name reads as text and the icon as a mark wherever the label sits.

## Keyboard and ARIA

SeverityLabel is text: it takes no focus, and no key does anything. A caller who makes it a link or button through `render` brings that element's own keys and must give it a target of `size.target-min`.

| Key  | Does                                       | From   |
| ---- | ------------------------------------------ | ------ |
| none | SeverityLabel is not focusable or operable | Perron |

| Element | Role                         | Accessible name from                                                                         | States announced |
| ------- | ---------------------------- | -------------------------------------------------------------------------------------------- | ---------------- |
| `root`  | none: a generic `<span>`     | Not named; its text is read in place, as part of the card or row it heads                    | none             |
| `icon`  | hidden, `aria-hidden="true"` | Not read: the `label` beside it says the same                                                | none             |
| `label` | text                         | The owned string for the kind: "Delays", "Diversions", "Planned works", "Data feed problems" | none             |

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: the colour and the icon say the kind, and the `label` says it in words for every `severity`; the icon is `aria-hidden` because the word beside it carries the same meaning. In forced colours the colour goes, and the icon and the word still carry it.
- [ ] Every landmark and named region has an accessible name: none here; SeverityLabel is inline text.
- [ ] Every default label can be overridden: `delaysLabel`, `diversionsLabel`, `plannedWorksLabel` and `dataFeedProblemsLabel`.
- [ ] Every shape the type accepts renders, in every variant: `severity` is one of four strings, and each has its story; a `*Label` string replaces only its own kind's word, and an undefined one keeps the locale's (CR-5).
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here; SeverityLabel does not animate. The icon is `aria-hidden` because the word speaks for it, not for animation.
- [ ] Native semantics first: a `<span>` with a `<span>` of text and an `<svg>`, no role, and no ARIA beyond `aria-hidden` and `focusable="false"` on the icon.
- [ ] Focus moves in reading order and returns on close: SeverityLabel takes no focus.
- [ ] Every target is at least `size.target-min` square: no target; SeverityLabel is not pressed.
- [ ] Loops stop when the system asks for less motion: none here; SeverityLabel has no motion.

## Owned strings

Every word SeverityLabel shows is its own; the caller gives only `severity`. The names are the kinds of disruption as `packages/perron/icons/icons.json` and [Data states](../foundations/data-states.md#kinds-of-disruption) name them, set in sentence case.

The four names are "Delays", "Diversions", "Planned works" and "Data feed problems": the names the icons and the tokens already give, plural as names of a kind rather than of one event. They reuse the existing `delays` key, its JSDoc widened to "A line's delays: a heading, and the name of the delay kind of disruption", and add `diversions`, `plannedWorks` and `dataFeedProblems`. All four join the data-state and delay words table of `docs/content-design.md`, so every screen names a disruption the same way in all four languages.

| Key                | English              | Override                | Seen or heard where                                                          |
| ------------------ | -------------------- | ----------------------- | ---------------------------------------------------------------------------- |
| `delays`           | "Delays"             | `delaysLabel`           | `label` when `severity='delay'`, seen and read as shown; the key `en.ts` has |
| `diversions`       | "Diversions"         | `diversionsLabel`       | `label` when `severity='diversion'`, seen and read as shown; new             |
| `plannedWorks`     | "Planned works"      | `plannedWorksLabel`     | `label` when `severity='planned'`, seen and read as shown; new               |
| `dataFeedProblems` | "Data feed problems" | `dataFeedProblemsLabel` | `label` when `severity='data'`, seen and read as shown; new                  |

Each new key gets a JSDoc line like its neighbours in `packages/perron/src/locale/en.ts`, and its Danish, Swedish and Norwegian in `da.ts`, `sv.ts` and `nb.ts`.

## Component rules

- **CR-1.** Each `severity` has one icon, one colour and one word, never mixed: `delay` is `warning`, `color.transit.severity.delay` and `delays`; `diversion` is `diversion`, `color.transit.severity.diversion` and `diversions`; `planned` is `calendar`, `color.transit.severity.planned` and `plannedWorks`; `data` is `signal-off`, `color.transit.severity.data` and `dataFeedProblems`.
- **CR-2.** The root always carries `data-severity` with the `severity` value, written by `useRender` from `state: { severity }`, and the CSS reads the colour from it, as [Tokens](#tokens) gives. The colour is set once, on the root; the icon and the word take it through `currentColor` and inheritance, as [Icons](../foundations/icons.md#style) says: "Set the colour on the text, never on the icon."
- **CR-3.** The `icon` is the icon file's own drawing, inlined as JSX: the file's `viewBox`, `fill`, `stroke`, `stroke-width`, `stroke-linecap` and `stroke-linejoin` and its child elements, unchanged, with no `width` or `height`, the classes `perron-icon` and `pn-SeverityLabel-icon`, `aria-hidden="true"` and `focusable="false"`. The package builds with `tsc` and has no SVG loader, and an icon redrawn by hand would drift from `packages/perron/icons/`, which the icon check holds to its grid and stroke. The `icon` comes before the `label` in reading order, so it sits on the start side in right-to-left text.
- **CR-4.** SeverityLabel takes no `children`, and its props type leaves them out: the name of each kind is the owned string, overridden on one instance by its `*Label` prop, so the words stay those of content design. A caller's own sentence about the disruption goes beside the label, not in it.
- **CR-5.** SeverityLabel reads its words with `useOwnedStrings({ delays: delaysLabel, diversions: diversionsLabel, plannedWorks: plannedWorksLabel, dataFeedProblems: dataFeedProblemsLabel })` from `packages/perron/src/PerronProvider.tsx`, and shows only the one its `severity` names.
- **CR-6.** The root renders through `useRender` with `mergeProps`: SeverityLabel's own props (`className` starting with `pn-SeverityLabel`, `data-severity`, the children) win over the caller's rest props, and `severity` and every `*Label` prop are taken out of the rest before the merge, so none reaches the DOM.
- **CR-7.** SeverityLabel is not a live region. A screen that adds or changes a disruption announces it in its own polite live region, as [Accessibility](../foundations/accessibility.md#what-a-person-checks) asks.
- **CR-8.** The `label` never wraps between the icon and the word: the root is `inline-flex`, so a long translated name wraps inside `label` and the icon stays beside its first line.

## Stories

One per variant the deferred design will draw, named as the `severity` values in PascalCase. Each `play` test reads the accessibility tree and the DOM, not the pixels.

| Story       | Shows                                                             | `play` test                                                                                                                                       |
| ----------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Delay`     | `severity='delay'`: the `warning` icon and "Delays"               | `data-severity` is `delay`; the accessible text is "Delays"; the icon is `aria-hidden`; `delaysLabel="Late trains"` shows and reads "Late trains" |
| `Data`      | `severity='data'`: the `signal-off` icon and "Data feed problems" | `data-severity` is `data`; the accessible text is "Data feed problems"; the icon is `aria-hidden`                                                 |
| `Diversion` | `severity='diversion'`: the `diversion` icon and "Diversions"     | `data-severity` is `diversion`; the accessible text is "Diversions"; the icon is `aria-hidden`                                                    |
| `Planned`   | `severity='planned'`: the `calendar` icon and "Planned works"     | `data-severity` is `planned`; the accessible text is "Planned works"; the icon is `aria-hidden`                                                   |

## Do and don't

For a caller using the component, with the reason.

| Do                                                                                                                      | Don't                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Head a disruption with SeverityLabel, then say what is happening in a plain sentence beside it, as content design asks. | Let the label stand for the disruption: "Delays" says the kind, not where, why or how long.                                            |
| Use SeverityLabel wherever a kind of disruption is named, so its icon, colour and word always come together.            | Set your own text in a `color.transit.severity.*` colour, or show a disruption icon alone: colour and icons never carry meaning alone. |
| Use Delay for how late one vehicle or departure runs.                                                                   | Use SeverityLabel with `severity='delay'` for one late vehicle: it names a disruption on a line.                                       |
| Use `severity='data'` for a problem with the real-time feed across a line or the network.                               | Use it for one silent vehicle: that is the Prik's "No signal" state, said with its own word.                                           |
| Show a line running normally with the "Running normally" word, and no SeverityLabel.                                    | Invent a fifth kind, such as a neutral or success severity, for good news: the four kinds are disruptions.                             |
| Make the whole disruption card the link or button, with the label inside it.                                            | Make SeverityLabel itself a filter control through `render`: it is a label, smaller than `size.target-min`, and has no pressed state.  |
