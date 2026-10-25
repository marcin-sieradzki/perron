# NormalService

The good news about a line: a mark and the words "Running normally" in the success colour, set where a line's disruptions would be listed, such as a line's detail panel or a row in a list of lines, when the line has none.

## Anatomy

Penpot page `Components/NormalService`, not drawn yet: the design is deferred (`docs/adr/0010-unattended-runs-with-design-deferred.md`), so this spec decides the drawing. Its sources are the [contract](README.md), [Content design](../content-design.md), which names the state "Running normally" among the data-state, delay and disruption words, [Semantic colours](../foundations/semantic-colours.md#text), whose `color.text.success` is "Text in the success colour: on time, running normally", [Icons](../foundations/icons.md) and the [SeverityLabel](severity-label.md) spec, whose Do and don't sends a line running normally here: "Show a line running normally with the "Running normally" word, and no SeverityLabel." The registry gives NormalService no `baseUiParts` and no `dependsOn`. Family: none. Shared parts: none.

NormalService is SeverityLabel's twin for good news: one inline label, an icon beside the owned words "Running normally", both in `color.text.success`, in SeverityLabel's own geometry (`typography.label-sm`, the icon at `icon.size.325`, a `space.100` gap, the inline grid that keeps the icon beside the first line), with no fill, border, `size` or `variant`, so a list of lines reads the same whether a line is disrupted or not. A card or a tinted success surface would give good news more weight than a disruption's card, against the brand's calm, and one look with SeverityLabel lets the two swap in one place.

The icon is a new one, `check-circle`, a circle with a tick inside it drawn on the disruption icons' 14 px grid with their 1.6 px stroke, round caps and joins, joining `packages/perron/icons/icons.json` under `Disruptions` at `icon.size.325` with the use "Running normally". No icon in the set says "all is well", a tick alone is the `tick` icon the contract keeps for the `SelectedMark` and `CheckboxIndicator` shared parts (which the `shared-parts` check holds to their folders), and the circle sets it apart from a selection mark at a glance.

NormalService has no Base UI part: it is a label with no behaviour. Its root renders through Base UI's `useRender` hook (`@base-ui/react/use-render`), which gives it the `render` prop, and its inner parts are plain elements.

| Part (Penpot layer) | What it is                                                                                                                       | Base UI part                                   | Class                    | `slotProps` key |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------ | --------------- |
| `root`              | The whole label, one inline run: a `<span>` laid out as an inline grid, the icon beside the words, in `color.text.success`       | none: a `<span>` rendered by `useRender`       | `pn-NormalService`       | none            |
| `icon`              | The `check-circle` icon, an inline `<svg>` drawn in `currentColor` at `icon.size.325`, hidden from screen readers                | none: a plain `<svg>`, no behaviour to borrow  | `pn-NormalService-icon`  | none            |
| `label`             | The words "Running normally", the owned string `runningNormally` or the caller's `runningNormallyLabel`, for the eye and the ear | none: a plain `<span>`, no behaviour to borrow | `pn-NormalService-label` | none            |

The Penpot component has no variant property and no `State` property: it has one look and is not interactive. Its one variant is `Default`, and the story carries that name.

## Base UI parts

NormalService imports no Base UI component. It uses two Base UI utilities, at the version pinned in `package.json`: `useRender` (`@base-ui/react/use-render`) for the root and `mergeProps` (`@base-ui/react/merge-props`) to merge the caller's props with its own.

| Base UI part                     | Renders  | Perron sets                                                                                                                        | Passed through                                        |
| -------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `useRender` (a hook, not a part) | `<span>` | `defaultTagName: 'span'`, `className` (`pn-NormalService` first, then the caller's), the children: `icon` and `label` (CR-2, CR-4) | `render`, `ref`, `className`, `style`, the rest props |

Base UI already does: swapping the root element for the one `render` gives, keeping the class and the children; merging the caller's `ref` with the element's; and joining `className` and `style` and chaining event handlers through `mergeProps`.

## Props

In MUI's layout. Every prop here gets this description as its JSDoc. NormalService takes no `children`: it writes its own icon and words (CR-3). It has no `slotProps`, because the contract keys `slotProps` by inner Base UI part and NormalService has none; a caller restyles it through `className` on the root. It has no `variant`, `color` or `size`: it has one look, and its colour is what it says.

| Name                   | Type                   | Default      | Base UI prop        | Description                                                                                                                                                                               |
| ---------------------- | ---------------------- | ------------ | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `render`               | Base UI's `render`     |              | inherited           | Allows you to replace the component's HTML element with a different tag, or compose it with another component. Accepts a `ReactElement` or a function that returns the element to render. |
| `runningNormallyLabel` | `string`               | The locale's | none                | Overrides "Running normally", the words shown and read                                                                                                                                    |
| `ref`                  | `Ref<HTMLSpanElement>` |              | `useRender`'s `ref` | Reaches the root element                                                                                                                                                                  |
| `className`            | `string`               |              | none                | Joined after `pn-NormalService` on the root                                                                                                                                               |
| `style`                | `CSSProperties`        |              | none                | Reaches the root                                                                                                                                                                          |

## Tokens

NormalService is not interactive, so its one design state is rest. It is not one of the contract's families and draws no fill, border or radius. Its geometry is SeverityLabel's, so the two sit on one line height and one icon column wherever they replace each other.

| Part           | State | Property                    | Token                                                                                                                                                             |
| -------------- | ----- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `root`         | rest  | `display`                   | none: the keyword `inline-grid`                                                                                                                                   |
| `root`         | rest  | `grid-template-columns`     | none: `auto 1fr`, the icon's column and the words'                                                                                                                |
| `root`         | rest  | `grid-template-rows`        | none: `auto 1fr`, the words' first line and the rest of their lines (CR-5)                                                                                        |
| `root`         | rest  | `align-items`               | none: the keyword `center`, so the icon sits on the middle of the first row, the words' first line (CR-5)                                                         |
| `root`         | rest  | `column-gap`                | `space.100`                                                                                                                                                       |
| `root`         | rest  | `font`                      | `typography.label-sm`                                                                                                                                             |
| `root`         | rest  | `letter-spacing`            | `typography.label-sm-tracking`                                                                                                                                    |
| `root`         | rest  | `overflow-wrap`             | none: the keyword `anywhere`, so a translated word longer than its line breaks inside `label` (CR-5)                                                              |
| `root`         | rest  | `color`                     | `color.text.success`                                                                                                                                              |
| `root`         | rest  | `--perron-icon-size`        | `icon.size.325`                                                                                                                                                   |
| `root::before` | rest  | `content`                   | none: `'\200b' / ''`, a zero-width space screen readers skip, as a strut one line of `typography.label-sm` tall, so the first row is the words' first line (CR-5) |
| `root::before` | rest  | `grid-row`, `grid-column`   | none: `1` and `1`, the icon's cell (CR-5)                                                                                                                         |
| `icon`         | rest  | `inline-size`, `block-size` | `--perron-icon-size`, through the `.perron-icon` class `perron.css` gives                                                                                         |
| `icon`         | rest  | `stroke`, `fill`            | none: `currentColor`, the root's colour                                                                                                                           |
| `icon`         | rest  | `grid-row`, `grid-column`   | none: `1` and `1`, the strut's cell, the words' first line (CR-5)                                                                                                 |
| `label`        | rest  | `color`                     | none: inherits the root's                                                                                                                                         |
| `label`        | rest  | `grid-row`, `grid-column`   | none: `1 / span 2` and `2`, both rows of the second column (CR-5)                                                                                                 |

`color.text.success` reaches 4.5:1 on `color.surface.default`, `raised` and `inset` in both themes, 4.74:1 at its lowest, on light `inset` ([Accessibility](../foundations/accessibility.md#text-on-surfaces)), so the words read as text and the icon as a mark wherever the label sits. The icon takes the text colour rather than the `color.status.success` mark colour, so the label is one colour, as [Icons](../foundations/icons.md#style) asks: "Set the colour on the text, never on the icon."

## Keyboard and ARIA

NormalService is text: it takes no focus, and no key does anything. It is not a control: a caller who needs a link or button puts NormalService inside their own, and that element brings its own keys and a target of at least `size.target-min`.

| Key  | Does                                       | From   |
| ---- | ------------------------------------------ | ------ |
| none | NormalService is not focusable or operable | Perron |

| Element | Role                         | Accessible name from                                                                           | States announced |
| ------- | ---------------------------- | ---------------------------------------------------------------------------------------------- | ---------------- |
| `root`  | none: a generic `<span>`     | Not named; its text is read in place, as part of the panel or row it sits in                   | none             |
| `icon`  | hidden, `aria-hidden="true"` | Not read: the `label` beside it says the same                                                  | none             |
| `label` | text                         | The owned string `runningNormally`, "Running normally", or the caller's `runningNormallyLabel` | none             |

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: the colour and the icon say the line is well, and the `label` says it in words; the icon is `aria-hidden` because the words beside it carry the same meaning. In forced colours the colour goes, and the icon and the words still carry it.
- [ ] Every landmark and named region has an accessible name: none here; NormalService is inline text.
- [ ] Every default label can be overridden: `runningNormallyLabel`.
- [ ] Every shape the type accepts renders, in every variant: the one prop of its own is a string; an undefined `runningNormallyLabel` keeps the locale's words, and an empty string is the caller's to avoid (CR-4).
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here; NormalService does not animate. The icon is `aria-hidden` because the words speak for it, not for animation.
- [ ] Native semantics first: a `<span>` with a `<span>` of text and an `<svg>`, no role, and no ARIA beyond `aria-hidden` and `focusable="false"` on the icon.
- [ ] Focus moves in reading order and returns on close: NormalService takes no focus.
- [ ] Every target is at least `size.target-min` square: no target; NormalService is not pressed.
- [ ] Loops stop when the system asks for less motion: none here; NormalService has no motion.

## Owned strings

Every word NormalService shows is its own. It reuses the key `en.ts` already has, `runningNormally`, whose JSDoc is "A line with no delays or disruptions.", and which [Content design](../content-design.md#data-state-delay-and-disruption-words) already gives in the other three languages: "Kører normalt", "Går som vanligt" and "Går som normalt".

| Key               | English            | Override               | Seen or heard where                                  |
| ----------------- | ------------------ | ---------------------- | ---------------------------------------------------- |
| `runningNormally` | "Running normally" | `runningNormallyLabel` | `label`, seen and read as shown; the key `en.ts` has |

## Component rules

- **CR-1.** NormalService has one icon, one colour and one word, never mixed: `check-circle`, `color.text.success` and `runningNormally`. The colour is set once, on the root; the icon and the words take it through `currentColor` and inheritance.
- **CR-2.** The `icon` is the `check-circle` file's own drawing, inlined as JSX: the file's `viewBox`, `fill`, `stroke`, `stroke-width`, `stroke-linecap` and `stroke-linejoin` and its child elements, unchanged, with no `width` or `height`, the classes `perron-icon` and `pn-NormalService-icon`, `aria-hidden="true"` and `focusable="false"`, as SeverityLabel's CR-3 does. The build adds the file to `packages/perron/icons/` following [Icons](../foundations/icons.md), joins it to `icons.json`, and runs `npm run tokens` to rebuild the set's table. The `icon` comes before the `label` in reading order, so it sits on the start side in right-to-left text.
- **CR-3.** NormalService takes no `children`, and its props type leaves them out: the words are the owned string, overridden on one instance by `runningNormallyLabel`, so every screen says it with the content-design word. A caller's own sentence, such as when the line was last checked, goes beside the label, not in it.
- **CR-4.** NormalService reads its words with `useOwnedStrings({ runningNormally: runningNormallyLabel })` from `packages/perron/src/PerronProvider.tsx`.
- **CR-5.** The `label` never wraps between the icon and the words: the root is an `inline-grid` whose first row is one line of the words' typography, so a long translated label wraps inside `label` and the icon stays centred beside its first line, as SeverityLabel's CR-8 does.
- **CR-6.** The root renders through `useRender` with `mergeProps`: NormalService's own props (`className` starting with `pn-NormalService`, the children) win over the caller's rest props, and `runningNormallyLabel` is taken out of the rest before the merge, so it never reaches the DOM.
- **CR-7.** NormalService is not a live region. A screen whose line goes from disrupted to running normally announces the change in its own polite live region, as [Accessibility](../foundations/accessibility.md#what-a-person-checks) asks.
- **CR-8.** NormalService says only that a line has no delays or disruptions, and the caller shows it only while the line's real-time data is current: while a data feed problem covers the line, the screen shows that SeverityLabel, `severity='data'`, instead, since "Running normally" would claim more than the data knows.

## Stories

One per variant the deferred design will draw: the one, `Default`. Its `play` test reads the accessibility tree and the DOM, not the pixels.

| Story     | Shows                                                                                                              | `play` test                                                                                                                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Default` | The `check-circle` icon and "Running normally" in `color.text.success`, with no args; the contract story's subject | The accessible text is "Running normally"; the icon is `aria-hidden`; the root has `pn-NormalService`. A test beside the stories renders it with `runningNormallyLabel="Normal service"` and finds "Normal service" shown and read |

## Do and don't

For a caller using the component, with the reason.

| Do                                                                                                                  | Don't                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Show NormalService where a line's disruptions would be, when it has none, so a rider sees the answer and not a gap. | Show an empty list, or EmptyState's "No data to show": no disruptions is news about the line, not missing data.                              |
| Name the line beside it, in a heading, a LineBadge or a row, so "Running normally" says which line.                 | Pass the line's name through `runningNormallyLabel` ("M2 running normally"): the label overrides the content-design words, not adds to them. |
| Use SeverityLabel for each kind of disruption, and NormalService only when there are none.                          | Show NormalService beside a SeverityLabel on the same line: a line is either disrupted or running normally.                                  |
| Use Delay's "On time" for one vehicle or departure keeping to the timetable.                                        | Use NormalService for one vehicle: it says a whole line has no delays or disruptions.                                                        |
| Make the whole row or panel the link, with the label inside it.                                                     | Make NormalService itself a control through `render`: it is a label, smaller than `size.target-min`, and has no pressed state.               |
