# ScaleBar

The map's scale: a short bar on glass at the bottom right of the map, with the ground distance its length spans written above it, such as "300 m" or "2 km", which shortens and lengthens as the map zooms.

The design is deferred (ADR 0010, `docs/adr/0010-unattended-runs-with-design-deferred.md`): there is no read-back, code map or export, and this spec decides what the drawing would, from the [contract](../components/README.md) and its Patterns section, the [foundations](../foundations/README.md), [content design](../content-design.md), the tokens and the specs of what it composes, [Surface](../components/surface.md), and the neighbours it sits beside, [Attribution](../components/attribution.md) and [MapControls](../components/map-controls.md). `packages/perron/components.json` gives ScaleBar no `baseUiParts`, and its `dependsOn`, empty today, gains `Surface` with the build (CR-1). The extracted prototype is not reachable from this branch, so nothing here rests on it. What the foundations already say of the scale is that it sits at the bottom right with the map controls ([Layout](../foundations/layout.md#page-shell)) and stacks with them, the legend and the attribution at `z-index.map-controls` ([Layout](../foundations/layout.md#stacking)).

## Anatomy

Penpot page `Patterns/ScaleBar`. Family: none (the contract's [Families](../components/README.md#families) have no measure drawn over the map; the root takes Surface's `glass`, as every element floating over the map does). Shared parts: `VisuallyHidden`, for the word "Scale" the eye gets from the bar's shape.

The scale is a column of two parts in a glass box: the `label`, the distance in digits and a unit, over the `bar`, a bracket open at the top whose length is that distance on the map. The label comes first in the DOM and on screen, so a screen reader hears "Scale" and the distance before anything else, and the eye reads the figure and then the length it names, as a ruler's mark sits above its tick.

The drawing will have a `root` board holding two layers, `label` and `bar`. It has no variant property, so its one variant is `Default`, and no `State` property: nothing in it is interactive, so its one design state is rest.

| Part (Penpot layer) | What it is                                                                                                                                                                                                   | Base UI part                                                | Class               | `slotProps` key |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- | ------------------- | --------------- |
| `root`              | The scale: Perron's Surface with `variant='glass'`, a `div` whose content box is the bar's longest length, `calc(4 * var(--perron-space-600))`, 96 px (CR-4), laying the label over the bar in a flex column | None: a pattern never imports Base UI; Perron's Surface     | `pn-ScaleBar`       | none            |
| `label`             | The distance: a `span` holding the hidden "Scale", then the figure, a no-break space and the unit, "300 m" or "2 km", in `typography.data`; "—" heard as "Unknown" when the map gives no resolution (CR-7)   | None: a plain `span`, with Perron's `VisuallyHidden` inside | `pn-ScaleBar-label` | `label`         |
| `bar`               | The bar: an `aria-hidden` `span` drawn as a bracket, `border.width.050` on its bottom and both ends, as long as the distance is on the map, from half to the whole of the root's content box (CR-5)          | None: a plain `span`                                        | `pn-ScaleBar-bar`   | `bar`           |

The root composes Surface's `glass` variant, with `Surface` in ScaleBar's `dependsOn` in `packages/perron/components.json`, and changes only Surface's radius, to `radius.md`, and its padding, to `space.100` on the block axis and `space.200` on the inline axis, keeping Surface's `color.border.subtle` edge and `shadow.panel`. [Elevation](../foundations/elevation.md#surfaces) puts what floats over the map on glass, and the contract's Families section says a pattern floating as glass composes Surface and sets only what its spec changes, such as the radius or the padding, never the fill, the backdrop or the shadow again; keeping the edge and the shadow makes the scale the same glass as the MapControls toolbar it sits beside; `radius.md` and the tight padding fit a box about 34 px tall, the height of the controls' buttons, where Surface's `radius.xl` and `space.400` belong to panels; Surface is stable, so the dependency adds no wait.

## Base UI parts

No Base UI part: `baseUiParts` is empty in `packages/perron/components.json`, and the contract's Patterns section forbids a pattern to import `@base-ui/react`, so every part is a plain element or a Perron component: Surface for the root and the `VisuallyHidden` shared part inside the label.

| Base UI part      | Renders         | Perron sets                                                                                                                                                                                            | Passed through                                              |
| ----------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| None, for `root`  | Surface's `div` | `variant='glass'`; the class `pn-ScaleBar` then the caller's, joined after Surface's own `pn-Surface`; the caller's `ref` merged with the pattern's own, which measures the root (CR-4); the two parts | `className`, `style`, `ref` and the rest of the `div` props |
| None, for `label` | `span`          | The class `pn-ScaleBar-label`; the hidden "Scale", then the figure and the unit as separate text (CR-6), or the hidden "—" and "Unknown" (CR-7)                                                        | `slotProps.label`                                           |
| None, for `bar`   | `span`          | The class `pn-ScaleBar-bar`; `aria-hidden`; `style.inlineSize`, the distance's share of the longest length as a percentage, laid over the caller's `style` (CR-5)                                      | `slotProps.bar`                                             |

Base UI already does: nothing here. The behaviour the parts need comes from the browser (text read in place, a hidden mark) and from Surface, which brings its glass in both themes and in forced colours. The one thing ScaleBar does itself is pick the distance and the bar's length from the map's resolution (CR-3).

ScaleBar has no `render`, on the root or in `slotProps`, as KioskBar and DetailHeader have none: the contract's `render` is Base UI's, inherited from a Base UI props type, which a pattern cannot import, and declaring it fails the `props` check.

## Props

In MUI's layout. Every prop here gets this description as its JSDoc. Slots come last.

| Name                  | Type                            | Default      | Base UI prop | Description                                                                                                                                                                                                                                                                             |
| --------------------- | ------------------------------- | ------------ | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `metersPerPixel`      | `number`                        |              | none         | The ground distance one CSS pixel spans at the map's centre, in metres, as the map gives it at its current zoom and latitude. Required. ScaleBar picks a round distance from it and draws the bar that long. A value that is not a positive finite number shows "—" and says "Unknown". |
| `scaleLabel`          | `string`                        | The locale's | none         | Overrides "Scale", heard before the distance                                                                                                                                                                                                                                            |
| `metersUnitLabel`     | `string`                        | The locale's | none         | Overrides "m", the unit after a distance under a kilometre                                                                                                                                                                                                                              |
| `kilometersUnitLabel` | `string`                        | The locale's | none         | Overrides "km", the unit after a distance of a kilometre or more                                                                                                                                                                                                                        |
| `unknownLabel`        | `string`                        | The locale's | none         | Overrides "Unknown", heard in place of "—" when `metersPerPixel` gives no distance                                                                                                                                                                                                      |
| `className`           | `string`                        |              | none         | Joined after `pn-ScaleBar` on the root                                                                                                                                                                                                                                                  |
| `style`               | `CSSProperties`                 |              | none         | Reaches the root                                                                                                                                                                                                                                                                        |
| `ref`                 | `Ref<HTMLDivElement>`           |              | none         | Reaches the root element                                                                                                                                                                                                                                                                |
| `slotProps.label`     | `ComponentPropsWithRef<'span'>` |              | none         | Props for the `label` part, the distance                                                                                                                                                                                                                                                |
| `slotProps.bar`       | `ComponentPropsWithRef<'span'>` |              | none         | Props for the `bar` part, the drawn bracket                                                                                                                                                                                                                                             |

`className`, `style`, `ref` and the other `div` props reach the root, as the contract's [Root](../components/README.md#root) says. `metersPerPixel`, the four labels and `slotProps` are taken out of the rest props first; the props type leaves out `children`, since the scale writes its own parts. No `variant`, `color` or `size`: the scale has one look.

ScaleBar takes the map's resolution, `metersPerPixel`, and picks the round distance and the bar's length itself, rather than taking a `distance` and a `length` the caller works out. A pattern takes Mylder's data and lays it out, as StopTimeline takes `stops`, and the map's resolution is the one number every map library gives (MapLibre's from its zoom and the centre's latitude); the rounding to 1, 2, 3 or 5 times a power of ten and the bar's share of its longest length then live once, in Perron, where a test holds them, rather than in every screen with a map; and the longest length is ScaleBar's own CSS, which a caller could only copy. The name keeps the code's American spelling, as the `centerMap` key does, while the words shown are British.

ScaleBar shows metric units only, metres under a kilometre and kilometres from one up, with no prop for miles or feet. Mylder maps Copenhagen for readers in Denmark, Sweden and Norway, whose four locales all measure in metres; a `unit` prop would be a second look the deferred design doesn't draw, and it can join later without a break.

## Tokens

One row per part, state and property. ScaleBar has no interactive state, so every row is rest. Its glass is Surface's: `color.surface.overlay`, the `effect.glass-blur` and `effect.glass-saturate` backdrop, a `border.width.025` edge in `color.border.subtle` and `shadow.panel`, read from [Surface](../components/surface.md#tokens) and not set again here; ScaleBar changes only Surface's radius and padding.

| Part    | State | Property                       | Token                                                                                                                        |
| ------- | ----- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `root`  | rest  | `border-radius`                | `radius.md`, in place of Surface's `radius.xl`                                                                               |
| `root`  | rest  | `padding-block`                | `space.100`, in place of Surface's `space.400`                                                                               |
| `root`  | rest  | `padding-inline`               | `space.200`, in place of Surface's `space.400`                                                                               |
| `root`  | rest  | `box-sizing`                   | none: the keyword `content-box`, so `inline-size` is the bar's longest length and the padding and edge sit outside it (CR-4) |
| `root`  | rest  | `inline-size`                  | `space.600`: `calc(4 * var(--perron-space-600))`, 96 px, the bar's longest length                                            |
| `root`  | rest  | `display`                      | none: `flex`, with `flex-direction: column` and `align-items: flex-start`                                                    |
| `root`  | rest  | `row-gap`                      | `space.050`, between the label and the bar                                                                                   |
| `label` | rest  | `font`                         | `typography.data`, the role for measures in figures                                                                          |
| `label` | rest  | `letter-spacing`               | `typography.data-tracking`, the role's twin                                                                                  |
| `label` | rest  | `color`                        | `color.text.secondary`                                                                                                       |
| `label` | rest  | `white-space`                  | none: `nowrap`, so "300 m" never breaks; the longest label, "5000 km", is far narrower than 96 px                            |
| `label` | rest  | `min-block-size`               | none: `1lh`, so the box keeps its height before the first measure, when the label shows only the hidden "Scale" (CR-4)       |
| `bar`   | rest  | `display`                      | none: `block`                                                                                                                |
| `bar`   | rest  | `block-size`                   | `space.150`, the height of the bracket's ends                                                                                |
| `bar`   | rest  | `inline-size`                  | none: the distance's share of the root's content box, a percentage from 50% to 100%, set inline by the pattern (CR-5)        |
| `bar`   | rest  | `border-width`                 | `border.width.050`, on `border-block-end` and both `border-inline` sides; `border-block-start` is `none`                     |
| `bar`   | rest  | `border-style`                 | none: the keyword `solid`                                                                                                    |
| `bar`   | rest  | `border-color`                 | `color.text.secondary`, the label's ink                                                                                      |
| `bar`   | rest  | `border-color`, forced colours | none: the system's `CanvasText`, which forced colours give a border on their own; the bar is a border so it still shows      |

The bar's longest length takes no new token: ScaleBar's CSS writes it as `calc(4 * var(--perron-space-600))`, 96 px, on the root's content box. The `design-tokens` skill's placement table keeps a measure only one component's CSS reads in that CSS, and the contract's CSS rule allows a `calc()` over tokens; the script never reads the length as a value, since the pattern measures the root after layout (CR-4); and 96 px, on the 4 px grid and near MapLibre's 100 px default, keeps the bar from half to all of that, 48 to 96 px, short enough to sit beside the map controls and long enough to read. A `size.scale-bar` token joins when a second place must agree on it.

The label and the bar share one ink, `color.text.secondary`, so the scale reads as one mark and stays quieter than the controls beside it, as the brand's "calm" asks; secondary reaches 7.63:1 on `color.surface.default` in light and 7.80:1 in dark ([Accessibility](../foundations/accessibility.md#text-on-surfaces)), and the overlay is that surface at 0.9 and 0.88 over the map, so the bar, a graphical object that carries the measure, clears 3:1 with room to spare. `color.border.strong` and `color.border.subtle` would not: they are decorative and exempt from 3:1.

The label is `typography.data`, the mono role for figures in lists and tables, 12 px at 1.3: the distance is a measure, set in the same digits as a delay or a count, and mono keeps the label's width steady as the figure changes on zoom. The box is about 34 px tall: one 15.6 px line, the `space.050` gap, the 6 px bracket, `space.100` above and below and the 1 px edge, close to `size.control`, the height of the map controls' buttons beside it.

The bar's length changes at once as the map zooms, with no transition: no `duration.*` token is given to it, and a bar that eased would lag the map it measures.

ScaleBar places nothing, with no `position`, `inset`, `margin` or `z-index` of its own (CR-8): the screen puts it at the bottom right, `size.panel-gap` from the edges and beside the map controls, at `z-index.map-controls` ([Layout](../foundations/layout.md#stacking)).

## Keyboard and ARIA

ScaleBar has no keys of its own and nothing in it is focusable: a scale is read, not operated. Tab passes it by.

| Key  | Does                                                   | From   |
| ---- | ------------------------------------------------------ | ------ |
| None | The scale takes no focus and no keys; Tab passes it by | Perron |

| Element | Role                  | Accessible name from                                                            | States announced |
| ------- | --------------------- | ------------------------------------------------------------------------------- | ---------------- |
| `root`  | None (generic `div`)  | None                                                                            | None             |
| `label` | None (generic `span`) | Its text: "Scale" from `VisuallyHidden`, then "300 m"; or "Scale" and "Unknown" | None             |
| `bar`   | None: `aria-hidden`   | None; the label says the distance it draws                                      | None             |

The root is a plain `div`, not a landmark, an image or a named region: the scale is one line of text to a screen reader, "Scale 300 m", read in place, and a `role="img"` with an `aria-label` would hide the same words in an attribute that `expectOwnedStrings` and the reader both read less reliably than text.

The label is not a live region: the distance changes with every zoom step and would flood a screen reader, and [Accessibility](../foundations/accessibility.md#what-a-person-checks) asks that only changes of state be announced, in the screen's own polite live region.

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: the eye gets the distance and, from the bar's shape, that it is a scale; the ear gets "Scale" from `VisuallyHidden` and the same distance from the label's text. With no resolution, the eye gets "—" and the ear "Unknown". No colour carries meaning.
- [ ] Every landmark and named region has an accessible name: none here; the root is not a landmark.
- [ ] Every default label can be overridden: `scaleLabel`, `metersUnitLabel`, `kilometersUnitLabel` and `unknownLabel`.
- [ ] Every shape the type accepts renders, in every variant: `metersPerPixel` as a fraction of a metre, as metres and as kilometres, at each of the four round steps, and as `0`, a negative number, `NaN` and `Infinity`, which show "—". `ScaleBar.test.tsx` runs the rounding over each, and the stories render metres, kilometres, the shortest bar and the unknown.
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here; nothing animates or collapses. The bar and the "—" are hidden because the words beside them say them, not for animation.
- [ ] Native semantics first: plain `div` and `span`, text read in place, `aria-hidden` on the drawn bar and the "—", and no ARIA of the pattern's own beyond that.
- [ ] Focus moves in reading order and returns on close: nothing takes focus or opens; the DOM order, label then bar, is the order on screen.
- [ ] Every target is at least `size.target-min` square: no target; nothing in the scale is pressed.
- [ ] Loops stop when the system asks for less motion: none here; nothing moves on its own, and the bar's length changes without a transition.

## Owned strings

Every word ScaleBar shows or announces is its own: the caller gives a number, never a word. `unknown` is reused from `packages/perron/src/locale/en.ts`; the other three are new keys, which the build adds to all four locale files, with the Danish, Swedish and Norwegian below.

The new keys read `scale` "Scale", `metersUnit` "m" and `kilometersUnit` "km", with the units written as the SI symbols in every locale. Content design writes a space before units, "4 min", "45 km/h", so the distance reads "300 m" and "2 km", the symbols every Nordic locale writes the same; the keys follow `minutesUnit`, Delay's unit after a figure; "Scale" names what the distance measures for a reader who can't see the bar, and is "Målestok", "Skala" and "Målestokk" in the others; symbols, unlike "metres" and "kilometres", need no singular and plural for "1 km" and "2 km".

| Key              | English   | Override              | Seen or heard where                                                                 |
| ---------------- | --------- | --------------------- | ----------------------------------------------------------------------------------- |
| `scale`          | "Scale"   | `scaleLabel`          | The `label` part, heard first, through `VisuallyHidden`; never seen                 |
| `metersUnit`     | "m"       | `metersUnitLabel`     | The `label` part, seen and heard after a figure under 1000, "300 m"                 |
| `kilometersUnit` | "km"      | `kilometersUnitLabel` | The `label` part, seen and heard after a figure in kilometres, "2 km"               |
| `unknown`        | "Unknown" | `unknownLabel`        | The `label` part when `metersPerPixel` gives no distance: heard in place of the "—" |

## Component rules

Rules for this pattern alone, numbered so the build and the review can cite them.

- **CR-1.** The pattern imports only `Surface`, the `VisuallyHidden` part, `useOwnedStrings` from `PerronProvider`, the helpers of `packages/perron/src/internal/nodes.ts`, React and the files of its own folder, as the contract's Patterns section says; never `@base-ui/react`. `Surface` joins ScaleBar's `dependsOn`.
- **CR-2.** The root is `<Surface variant="glass">`, its class `pn-ScaleBar` then the caller's joined after Surface's own, and the caller's `ref`, `style` and other `div` props on it. The pattern sets only the radius and padding of the glass, never its fill, backdrop, edge or shadow.
- **CR-3.** The distance is picked in one function of the pattern's folder, from `metersPerPixel` and the longest length in pixels: the longest distance is their product, and the distance shown is the largest of 1, 2, 3 and 5 times a power of ten that is no longer, and never less than 1 m. The bar's share is the distance over the longest distance, held at 100%, so from 50% to 100%, and at 100% where the 1 m floor holds. `ScaleBar.test.tsx` holds the function to a table of cases: each round step, the boundary just under each, metres, kilometres and the 1 m floor.
- **CR-4.** The longest length is the root's content box, `calc(4 * var(--perron-space-600))` under `box-sizing: content-box`, read once after the first layout from the root's computed `inline-size` in a layout effect, through the pattern's own ref merged with the caller's; a pattern cannot import Base UI's ref merging or `tokenValue`, so the merge is written in its own folder. Until it is read, as in a server render, a resolution that gives a distance shows only the hidden "Scale" in the label, which keeps one line's height, and the bar is left out.
- **CR-5.** The bar's length is its `style.inlineSize`, the share from CR-3 as a percentage, laid over `slotProps.bar.style`; it is the only inline style the pattern writes, a value of the data, as no token can hold it.
- **CR-6.** A distance under 1000 m reads as the figure in metres and `metersUnit`; one of 1000 m or more as the figure in kilometres, a whole number, and `kilometersUnit`. The figure is digits with no grouping, a no-break space follows it, and the figure and the unit are separate text, so the unit is exactly the owned string and the two never wrap apart.
- **CR-7.** A `metersPerPixel` that is not a positive finite number gives no distance: from the first render, a server render included, the label shows "—", `aria-hidden`, with `unknownLabel` or "Unknown" in `VisuallyHidden` after "Scale", and the bar is left out. The brand never claims more than the data knows.
- **CR-8.** ScaleBar places nothing: no `position`, `inset`, `margin` or `z-index` on the root. Its screen places it at the bottom right, `size.panel-gap` from the edges, at `z-index.map-controls`.
- **CR-9.** Neither the root nor any part is a live region, and nothing moves focus. The bar's length and the label change at once, with no transition.
- **CR-10.** Each inner part's props are its `slotProps` value with the pattern's own laid over it: the class joins the part's own first, then the caller's, and the children, `aria-hidden` and the bar's `inlineSize` are the pattern's.

## Stories

Stories are titled `Patterns/ScaleBar`. No Penpot design yet, and ScaleBar has no variant property, so its drawing's one variant is `Default` (the Conventions of `penpot/README.md`), and the contract story renders it: its one arg is a number, so it passes every rule alone. Each story sets the scale over a backdrop in `color.map.land` with a `color.map.street` stripe, which shows the glass, as Surface's `Glass` story does. The others show the shapes of the data.

| Story        | Shows                                                                                                                                                                                                      | `play` test                                                                                                                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Default`    | `metersPerPixel` 4.2, a city street at close zoom: the longest distance is 403 m, so "300 m" over a bar about three quarters long. The subject story: its arg renders ScaleBar alone and passes every rule | The label is heard as "Scale 300 m"; the bar is `aria-hidden` and narrower than the root's content box but more than half of it; the root carries `pn-Surface` and `pn-ScaleBar`; Tab passes the scale by |
| `Kilometres` | `metersPerPixel` 40, the whole city: "3 km"                                                                                                                                                                | The label is heard as "Scale 3 km"; "m" alone is not in the tree                                                                                                                                          |
| `HalfLength` | `metersPerPixel` 20.82, a longest distance just under 2 km: "1 km" over the shortest bar, half the longest                                                                                                 | The bar is at least half the root's content box and less than three fifths of it                                                                                                                          |
| `Unknown`    | `metersPerPixel` `NaN`, a map that has not given its resolution yet                                                                                                                                        | The label shows "—", `aria-hidden`, and is heard as "Scale Unknown"; no bar is in the tree                                                                                                                |
| `Labels`     | `Default`'s arg with `scaleLabel` "Målestok" and `metersUnitLabel` "meter"                                                                                                                                 | The label is heard as "Målestok 300 meter"; neither "Scale" nor "m" alone is in the tree                                                                                                                  |

## Do and don't

For a caller using the pattern, with the reason.

| Do                                                                                                                                      | Don't                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Give `metersPerPixel` for the map's centre, and give it again on every zoom and on every move that changes the latitude much            | Give it once and leave it: the scale then claims a distance the map no longer shows                                  |
| Leave `metersPerPixel` as `NaN` until the map has loaded, so the scale shows "—" and says "Unknown"                                     | Pass a guess or `0` before the map is ready: the brand never claims more than the data knows                         |
| Place the scale from the screen, at the bottom right beside the map controls, `size.panel-gap` from the edges at `z-index.map-controls` | Give it a position, a margin or a `z-index` through `className`: the pattern sizes to its content and places nothing |
| Keep one scale on the map                                                                                                               | Put a scale in a panel or a sheet, away from the map it measures                                                     |
| Leave the scale out of the screen's live region; announce changes of state there                                                        | Make the label a live region: it changes on every zoom step and would flood a screen reader                          |
