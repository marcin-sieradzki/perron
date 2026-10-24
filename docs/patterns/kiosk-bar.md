# KioskBar

The bar a Mylder screen in kiosk mode shows over the map, for a display people read from across a room and never touch: the Mylder brand, a few key figures about the network, and the clock, large.

The design is deferred (ADR 0010, `docs/adr/0010-unattended-runs-with-design-deferred.md`): this spec decides what the drawing would, from the [contract](../components/README.md) and its Patterns section, the [foundations](../foundations/README.md), [content design](../content-design.md), the tokens and the specs of the two components in `dependsOn`, [Brand](../components/brand.md) and [Stat](../components/stat.md). The extracted prototype is not reachable from this branch, so nothing here rests on it. What the foundations already say of the kiosk bar is that it stacks at `z-index.sheet` with the overview sheet ([Layout](../foundations/layout.md#stacking)), that its clock is set in `typography.data-xl` ([Typography](../foundations/typography.md#roles)), and that Brand and Stat were drawn to sit in it.

## Anatomy

Penpot page `Patterns/KioskBar`. Family: Panels, since it is a panel floating over the map and takes the Panels row's glass at `radius.xl` through [Surface](../components/surface.md)'s `glass` variant. Shared parts: none of its own; the `VisuallyHidden` parts that Brand and Stat compose stay inside them.

[PENDING] Is the bar one row of three parts, the brand at the start, the key figures in the middle and the clock at the end, wrapping onto more lines when its container is narrow? Recommended: yes: the brand opens the bar as it opens the top bar, the clock at the end is where a departure board keeps it, the DOM order is the reading order, so a screen reader hears brand, figures, then time, and a wrapping row keeps a 320 px container free of sideways scrolling ([Accessibility](../foundations/accessibility.md#what-a-person-checks)).

The drawing will have a `root` board holding three layers, `brand`, `stats` and `time`, with each figure an instance of Stat inside `stats`, named `stat`. It has no variant property, so its one variant is `Default`, and no `State` property: nothing in it is interactive, so its one design state is rest.

| Part (Penpot layer) | What it is                                                                                                  | Base UI part                                                  | Class               | `slotProps` key |
| ------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------- | --------------- |
| `root`              | The bar: Perron's Surface with `variant='glass'`, a `div` laying the three parts out in a wrapping flex row | None: a pattern never imports Base UI; Perron's Surface       | `pn-KioskBar`       | none            |
| `brand`             | The Mylder brand: Perron's Brand, `variant='full'` unless the caller picks `mark`                           | None: Perron's Brand                                          | `pn-KioskBar-brand` | `brand`         |
| `stats`             | The key figures: an unordered list, rendered only when `stats` holds at least one figure (CR-4)             | None: a plain `ul`                                            | `pn-KioskBar-stats` | `stats`         |
| `stat`              | One key figure, its label over its figure: Perron's Stat rendered as a list item through its own `render`   | None: Perron's Stat, rendered as an `li`                      | `pn-KioskBar-stat`  | `stat`          |
| `time`              | The clock: the caller's 24-hour time, such as "08:14", in `typography.data-xl`, at the end of the row       | None: a plain `time` element, its `dateTime` the same `HH:MM` | `pn-KioskBar-time`  | `time`          |

[PENDING] Does the root compose Surface's `glass` variant, adding `Surface` to KioskBar's `dependsOn` in `packages/perron/components.json`? Recommended: yes: [Elevation](../foundations/elevation.md#surfaces) puts every panel floating over the map on glass, the contract's Families table gives a new member its family's treatment and never one of its own, and Surface's spec draws the Panels' glass for patterns to compose, so the bar matches the sheet and the detail panel beside it without copying their tokens; Surface is stable, so the dependency adds no wait.

## Base UI parts

No Base UI part: `baseUiParts` is empty in `packages/perron/components.json`, and the contract's Patterns section forbids a pattern to import `@base-ui/react`, so every part is a plain element or a Perron component: Surface for the root, Brand for the brand and Stat for each figure.

| Base UI part      | Renders                        | Perron sets                                                                                                                               | Passed through                                              |
| ----------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| None, for `root`  | Surface's `div`                | `variant='glass'`; the class `pn-KioskBar` then the caller's, joined after Surface's own `pn-Surface`; `ref`; the parts below as children | `className`, `style`, `ref` and the rest of the `div` props |
| None, for `brand` | Brand's `span`                 | The class `pn-KioskBar-brand`, `brandNameLabel`, and `variant` from `slotProps.brand`, `'full'` when it gives none                        | `slotProps.brand`                                           |
| None, for `stats` | `ul`                           | The class `pn-KioskBar-stats`, one `stat` per entry of `stats`, keyed by its index                                                        | `slotProps.stats`                                           |
| None, for `stat`  | Stat's `div`, rendered as `li` | The class `pn-KioskBar-stat`, `render` an `li`, `label` and the figure as `children` from the entry, `unknownLabel`                       | `slotProps.stat`, given to every Stat                       |
| None, for `time`  | `time`                         | The class `pn-KioskBar-time`, `dateTime` and the text from `time`                                                                         | `slotProps.time`                                            |

Base UI already does: nothing here. The behaviour the parts need comes from the browser (a list, a time, reading order) and from the composed components, which bring their own: Surface its glass, Brand its mark in both themes and its name for screen readers, and Stat its figure's look and its "—" and "Unknown" when a figure is unknown.

KioskBar has no `render`, on the root or in `slotProps`, as DetailHeader and StopTimeline have none: the contract's `render` is Base UI's, inherited from a Base UI props type, which a pattern cannot import, and declaring it fails the `props` check. A screen that wants the bar in a landmark wraps it in one.

## Props

In MUI's layout. Every prop here gets this description as its JSDoc. Slots come last.

| Name              | Type                                                                   | Default      | Base UI prop | Description                                                                                                                                                          |
| ----------------- | ---------------------------------------------------------------------- | ------------ | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `time`            | `string`                                                               |              | none         | The time the clock shows, 24-hour `HH:MM`, such as `'08:14'`, in Copenhagen's time. Required. The caller updates it each minute; KioskBar keeps no clock of its own. |
| `stats`           | `KioskBarStat[]`                                                       | `[]`         | none         | The key figures, in the order they show: each one's label and figure. Left out or empty, the bar shows the brand and the clock alone.                                |
| `brandNameLabel`  | `string`                                                               | The locale's | none         | Overrides "Mylder", the brand name; given to the Brand                                                                                                               |
| `unknownLabel`    | `string`                                                               | The locale's | none         | Overrides "Unknown", heard in place of "—" for a figure with no data; given to every Stat                                                                            |
| `className`       | `string`                                                               |              | none         | Joined after `pn-KioskBar` on the root                                                                                                                               |
| `style`           | `CSSProperties`                                                        |              | none         | Reaches the root                                                                                                                                                     |
| `ref`             | `Ref<HTMLDivElement>`                                                  |              | none         | Reaches the root element                                                                                                                                             |
| `slotProps.brand` | `Omit<BrandProps, 'brandNameLabel'>`                                   |              | none         | Props for the `brand` part, the Brand: its `variant`, `'mark'` where the bar is tight, and a `className`                                                             |
| `slotProps.stats` | `ComponentPropsWithRef<'ul'>`                                          |              | none         | Props for the `stats` part, the list                                                                                                                                 |
| `slotProps.stat`  | `Omit<StatProps, 'label' \| 'children' \| 'unknownLabel' \| 'render'>` |              | none         | Props for every `stat` part, each Stat: a `className`, or its own `slotProps`                                                                                        |
| `slotProps.time`  | `ComponentPropsWithRef<'time'>`                                        |              | none         | Props for the `time` part, the clock                                                                                                                                 |

`stats` is an array of `KioskBarStat`, a type the pattern exports beside `KioskBarProps`:

| Field    | Type        | Description                                                                                                                                                |
| -------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`  | `ReactNode` | What the figure counts, in a few words, as Stat's `label`: "Reporting live", "Average delay".                                                              |
| `figure` | `ReactNode` | Optional. The figure, written as content design writes numbers, as Stat's `children`: "412", "4 min", "≈ 30". Left out, Stat shows "—" and says "Unknown". |

`className`, `style`, `ref` and the other `div` props reach the root, as the contract's [Root](../components/README.md#root) says. `time`, `stats`, `brandNameLabel`, `unknownLabel` and `slotProps` are taken out of the rest props first; the props type leaves out `children`, since the bar writes its own parts. No `variant`, `color` or `size`: the bar has one look.

[PENDING] Does the caller give the clock's time as an `HH:MM` string, with KioskBar running no timer of its own? Recommended: yes: StopTimeline takes its times the same way, `HH:MM` is how content design writes a time, `PerronProvider` gives a component its strings but not its locale or time zone, so a clock inside the pattern would read the device's zone rather than Copenhagen's, and a timer would make the server's render and the first client render disagree and every story's snapshot change by the minute.

[PENDING] Does the bar take its figures as data, a `stats` array of `{ label, figure }` that it renders as Stats, rather than Stat elements the caller writes as `children`? Recommended: yes: a pattern takes Mylder's data and lays it out, as StopTimeline takes `stops`, so every kiosk lists its figures alike, as a list, with Stat's look; the field is `figure`, not `value`, which the contract keeps for controls, and an entry left without one is unknown, as a Stat without `children` is.

[PENDING] Does the bar show the brand at Brand's one size, the mark at 27 × 19 px beside the `typography.heading-md` wordmark, with no larger kiosk size? Recommended: yes: no token holds a larger mark or wordmark, Brand's spec says a larger size joins through the `design-tokens` skill when this pattern needs it, and the brand stays calm beside a 48 px clock, where the time and the figures are what a reader looks for from across the room.

[PENDING] Does the bar take no `action`, such as a button to leave kiosk mode, and no date beside the clock? Recommended: yes: a kiosk display is read, not operated, so leaving kiosk mode stays with the screen and its keys, the top bar's `monitor` button that enters it has no counterpart here, and a date the caller wants can join later as an optional prop without a break.

KioskBar takes Brand's `brandNameLabel` and Stat's `unknownLabel` and gives them on, as StopTimeline does with Delay's labels: the contract's checklist asks that every default label the pattern shows can be overridden on one instance, and the names stay the components' own, so a caller learns them once.

[PENDING] Does the bar take a `slotProps` key for each part but the root, `brand`, `stats`, `stat` and `time`, as DetailHeader and DataStatePanel do? Recommended: yes: the skill that writes this spec asks for one per part, `slotProps.brand` is how a narrow bar picks Brand's `mark`, and each composed component's key takes that component's props less the ones the pattern sets, as DataStatePanel's `slotProps.emptyState` does.

## Tokens

One row per part, state and property. KioskBar has no interactive state, so every row is rest. Its glass is Surface's: `color.surface.overlay`, the `effect.glass-blur` and `effect.glass-saturate` backdrop, a `border.width.025` edge in `color.border.subtle`, `radius.xl`, `space.400` padding and `shadow.panel`, read from [Surface](../components/surface.md#tokens) and not set again here; Brand and Stat keep their own tokens.

| Part    | State | Property               | Token                                                                         |
| ------- | ----- | ---------------------- | ----------------------------------------------------------------------------- |
| `root`  | rest  | `display`              | none: `flex`, with `flex-wrap: wrap` and `align-items: center`                |
| `root`  | rest  | `column-gap`           | `space.600`, the 24 px between blocks of a pane                               |
| `root`  | rest  | `row-gap`              | `space.300`, the 12 px between parts of a panel, when the row wraps           |
| `brand` | rest  | `flex`                 | none: `none`, so the lockup never shrinks                                     |
| `stats` | rest  | `display`              | none: `flex`, with `flex-wrap: wrap` and `align-items: flex-start`            |
| `stats` | rest  | `flex`                 | none: `1 1 auto`, so the list takes the room between the brand and the clock  |
| `stats` | rest  | `column-gap`           | `space.600`, between two figures                                              |
| `stats` | rest  | `row-gap`              | `space.300`, when the figures wrap                                            |
| `stats` | rest  | `margin`, `padding`    | none: `0`, and `list-style: none`                                             |
| `stat`  | rest  | `margin`               | none: `0`; the rest is Stat's own                                             |
| `time`  | rest  | `font`                 | `typography.data-xl`, the role for the kiosk clock                            |
| `time`  | rest  | `letter-spacing`       | `typography.data-xl-tracking`, the role's twin                                |
| `time`  | rest  | `color`                | `color.text.primary`                                                          |
| `time`  | rest  | `font-variant-numeric` | none: `tabular-nums`, so the clock keeps its width as the minutes turn        |
| `time`  | rest  | `white-space`          | none: `nowrap`                                                                |
| `time`  | rest  | `margin-inline-start`  | none: `auto`, so the clock sits at the end of the row with or without figures |
| `time`  | rest  | `flex`                 | none: `none`                                                                  |

[PENDING] Are the brand, the figures and the clock `space.600` apart, the figures `space.600` from each other, and wrapped lines `space.300` apart? Recommended: yes: [Semantic spacing](../foundations/semantic-spacing.md#space) sets blocks of a pane 24 px apart and parts of a panel 12 px apart, figures read from a distance need the wider gap to stand apart, and a wrapped line belongs to the same panel.

The root is block-level and sizes to its container, as the contract asks: KioskBar places nothing, with no `position`, `inset`, `margin` or `z-index` of its own. The screen puts it over the map, `size.panel-gap` from the edges, at `z-index.sheet` ([Layout](../foundations/layout.md#stacking)), as MapControls leaves its place to its screen.

[Typography](../foundations/typography.md#roles) steps `data-xl` down to `font.size.800` on phones, but the contract gives a pattern no viewport query. The clock keeps `typography.data-xl` at every width, as Stat keeps `typography.stat`: the step-down is the same token gap, a phone modifier for the composites on `:root` through the `design-tokens` skill, and the clock, Stat and Text step down together when it lands.

Text contrast holds on the glass because `color.surface.overlay` is `color.surface.default` at 0.9 and 0.88 alpha, as [Surface](../components/surface.md#tokens) sets out; the clock and the figures are `color.text.primary` and the labels `color.text.secondary`, which pass on every opaque surface in both themes.

## Keyboard and ARIA

KioskBar has no keys of its own and nothing in it is focusable: a kiosk is read, not operated. Tab passes the bar by.

| Key  | Does                                                 | From   |
| ---- | ---------------------------------------------------- | ------ |
| None | The bar takes no focus and no keys; Tab passes it by | Perron |

| Element | Role                                  | Accessible name from                                          | States announced |
| ------- | ------------------------------------- | ------------------------------------------------------------- | ---------------- |
| `root`  | None (generic `div`)                  | None                                                          | None             |
| `brand` | None (Brand's `span`)                 | Its text: "Mylder", from the wordmark or Brand's hidden label | None             |
| `stats` | List                                  | None; its items are counted                                   | None             |
| `stat`  | List item                             | Its text: the label, then the figure or "Unknown"             | None             |
| `time`  | Time, the role ARIA gives the element | Its text, "08:14"                                             | None             |

[PENDING] Is the root a plain `div`, not a landmark or named region, so KioskBar owns no string of its own? Recommended: yes: a pattern can't swap its element without `render`, a landmark's name would be a new owned string in four locales for a display no one browses, and the screen that shows kiosk mode wraps the bar in the landmark its page needs, as DetailHeader leaves the region to DetailPanel.

The clock is not a live region and the figures are not either: the time turns every minute and the figures update often, which would flood a screen reader, and [Accessibility](../foundations/accessibility.md#what-a-person-checks) asks that only changes of state be announced, in the screen's own polite live region.

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: the brand is heard as "Mylder" in both of Brand's variants; each figure is heard after its label, and an unknown one as "Unknown" in place of the hidden "—", both from Stat; the clock is its own text. No colour carries meaning.
- [ ] Every landmark and named region has an accessible name: none here; the root is not a landmark, and the screen that wraps it in one names it.
- [ ] Every default label can be overridden: `brandNameLabel` for the brand name and `unknownLabel` for every unknown figure.
- [ ] Every shape the type accepts renders, in every variant: each entry's `label` and `figure` render a string, a number, an element and a list alike, as Stat's do; `stats` left out, empty and with one to four entries; `slotProps.brand` with `variant='mark'`.
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here; nothing animates or collapses. Brand's mark and Stat's "—" are hidden because words beside them say them, not for animation.
- [ ] Native semantics first: a `ul` of `li` for the figures, a `time` element for the clock, plain `div` and `span` for the rest, and no ARIA of the pattern's own.
- [ ] Focus moves in reading order and returns on close: nothing takes focus or opens; the DOM order, brand, figures, clock, is the order on screen.
- [ ] Every target is at least `size.target-min` square: no target; nothing in the bar is pressed.
- [ ] Loops stop when the system asks for less motion: none here; nothing moves, and the clock changes its text without a transition.

## Owned strings

KioskBar owns no new string: every word comes from the caller, through `time` and `stats`, or from the components it composes, whose keys it reuses from `packages/perron/src/locale/en.ts`.

| Key         | English   | Override         | Seen or heard where                                                                            |
| ----------- | --------- | ---------------- | ---------------------------------------------------------------------------------------------- |
| `brandName` | "Mylder"  | `brandNameLabel` | The `brand` part: Brand's wordmark, shown lowercase, or its hidden label with `variant='mark'` |
| `unknown`   | "Unknown" | `unknownLabel`   | A `stat` part whose entry has no `figure`: heard in place of Stat's hidden "—"                 |

## Component rules

Rules for this pattern alone, numbered so the build and the review can cite them.

- **CR-1.** The pattern imports only `Surface`, `Brand`, `Stat`, `PerronProvider` if it needs it, and React, as the contract's Patterns section says; never `@base-ui/react`. A type-only import of `BrandProps` and `StatProps` is fine. `Surface` joins KioskBar's `dependsOn` beside `Brand` and `Stat`.
- **CR-2.** The root is `<Surface variant="glass">`, its class `pn-KioskBar` then the caller's joined after Surface's own, and the caller's `ref`, `style` and other `div` props on it. The pattern never sets the glass itself.
- **CR-3.** The parts are in one order, in the DOM and on screen: `brand`, then `stats`, then `time`. The row wraps; the clock keeps `margin-inline-start: auto`, so it ends the row, or the line it wraps to.
- **CR-4.** The `stats` list renders only when `stats` has at least one entry, so no empty list is announced. Each entry renders `<Stat render={<li />} label={entry.label} unknownLabel={unknownLabel}>{entry.figure}</Stat>`, keyed by its index, with `slotProps.stat` laid under the pattern's own props and its class joined after `pn-KioskBar-stat`.
- **CR-5.** The clock is `<time dateTime={time}>{time}</time>`, the caller's `HH:MM` as it is: KioskBar runs no timer, reads no clock and formats nothing.
- **CR-6.** The brand is `<Brand variant="full" brandNameLabel={brandNameLabel} />`, `slotProps.brand` laid under, so its `variant` wins over the default `'full'` and its class joins after `pn-KioskBar-brand`.
- **CR-7.** Each inner part's props are its `slotProps` value with the pattern's own laid over it: the class joins the part's own first, then the caller's, and the children, `render` on each Stat, `dateTime` on the clock and `brandNameLabel` and `unknownLabel` are the pattern's. A pattern cannot import Base UI's `mergeProps`, so the merge is written in its own folder.
- **CR-8.** Neither the root nor any part is a live region, and nothing moves focus: a screen that must announce a change of state does it in its own polite live region.
- **CR-9.** KioskBar places nothing: no `position`, `inset`, `margin` or `z-index` on the root. It sizes to its container, and its screen places it at `z-index.sheet`, `size.panel-gap` from the edges.
- **CR-10.** No fill, border, radius, padding or shadow beyond Surface's glass, and no colour on any part but the clock's `color.text.primary`; Brand and Stat draw their own.

## Stories

Stories are titled `Patterns/KioskBar`. No Penpot design yet, and KioskBar has no variant property, so its drawing's one variant is `Default` (the Conventions of `penpot/README.md`), and the contract story renders it: every word in its args is a string arg, so they pass every rule alone. Each story sets the bar over a busy coloured backdrop that shows the glass, as Surface's `Glass` story does. The others show the shapes of the data.

| Story           | Shows                                                                                                                                                | `play` test                                                                                                                                                              |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Default`       | `time` "08:14" and three figures, "Vehicles on the map" "1 204", "Reporting live" "1 046" and "Average delay" "2 min"; the contract story renders it | A list of three items, each its label then its figure; the `time` element has `dateTime="08:14"`; the root carries `pn-Surface` and `pn-KioskBar`; Tab passes the bar by |
| `UnknownFigure` | `Default`'s args with "Average delay" given no `figure`                                                                                              | The third item reads "Average delay" then "Unknown", and its "—" is `aria-hidden`                                                                                        |
| `NoStats`       | `time` "23:59" and no `stats`: the brand and the clock alone                                                                                         | No list is in the tree; the clock is still the last part, at the end of the row                                                                                          |
| `Narrow`        | `Default`'s args with `slotProps.brand` `variant='mark'`, in a 320 px wide container                                                                 | The row wraps and nothing overflows: the root is no wider than its container; the brand is still named "Mylder"                                                          |
| `Labels`        | `Default`'s args with an unknown figure, `brandNameLabel` "Perron" and `unknownLabel` "No data yet"                                                  | The brand reads "Perron" and the unknown figure "No data yet"; neither "Mylder" nor "Unknown" is in the tree                                                             |

## Do and don't

For a caller using the pattern, with the reason.

| Do                                                                                                                 | Don't                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Give `time` in Copenhagen's time as `HH:MM`, and update it when the minute turns                                   | Pass the device's local time or a 12-hour time: the brand keeps the 24-hour clock, and a kiosk shows the city's time   |
| Keep to about four figures, each named in a few words: "Reporting live", "Average delay"                           | Fill the bar with figures until it wraps on a wide screen: read from across a room, fewer figures read faster          |
| Leave out an entry's `figure` when no data gives it, so Stat shows "—" and says "Unknown"                          | Pass `0` or a guess for a figure the data doesn't know: the brand never claims more than the data knows                |
| Place the bar from the screen, `size.panel-gap` from the edges at `z-index.sheet`, and wrap it in a landmark there | Give it a position, a margin or a `z-index` through `className`: the pattern sizes to its container and places nothing |
| Pick `slotProps.brand.variant` `'mark'` where the bar is tight                                                     | Hide the brand or its parts with `className`, which can leave a mark no screen reader hears                            |
| Announce a change of state, such as a data feed problem, in the screen's own polite live region                    | Make the clock or the figures a live region: they change every minute and would flood a screen reader                  |
| Use the top bar's clock, in `typography.data-lg`, on a screen people operate                                       | Use KioskBar on a screen people touch or tab through: it has no controls and its clock is sized for a room, not a desk |
