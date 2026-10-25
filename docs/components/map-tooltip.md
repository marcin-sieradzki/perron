# MapTooltip

The map's hover card: a small inverse card of the caller's words, placed against a point on the map or an element, shown while the pointer rests on a vehicle or a stop.

The design is deferred (ADR 0010, `docs/adr/0010-unattended-runs-with-design-deferred.md`): there is no read-back, code map or export, and this spec decides what the drawing would, from the contract, the foundations, the tokens and the Base UI reference. The extracted prototype component is not in any branch this run can reach.

## Anatomy

Penpot page `Components/MapTooltip`. Family: Tooltips. Shared parts: none (the card holds the caller's words and draws no mark of its own).

MapTooltip is a controlled card with no trigger: it is placed against its `anchor` (a virtual element at a point the map projects, or an element) and opened and closed by the caller through `open`, so it composes `Tooltip.Root`, `Tooltip.Portal`, `Tooltip.Positioner` and `Tooltip.Popup` and not `Tooltip.Provider` or `Tooltip.Trigger`, which the build takes out of the entry's `baseUiParts`. The vehicles and stops are drawn on the map canvas, not as elements a `Tooltip.Trigger` could wrap, so only the map knows what is under the pointer; and without triggers there is no hover delay for a `Tooltip.Provider` to share.

The popup is the component's root, taking `ref`, `className`, `style`, `render` and the rest props. `Tooltip.Root`'s props other than `open`, `defaultOpen` and `onOpenChange` (as `onClose`) are not offered, and `slotProps` has keys for the portal and the positioner only. The popup is the element the eye sees and the one a caller restyles, and `Tooltip.Root` renders no element; its other props (`actionsRef`, `handle`, `triggerId`, `trackCursorAxis`, `disabled`, `disableHoverablePopup`, `onOpenChangeComplete`) serve triggers, cursor tracking and exit animations this card doesn't have.

The card leaves out Base UI's `Tooltip.Arrow` and `Tooltip.Viewport`. The Tooltips family draws no arrow, and the content swaps at once, with no transition for a viewport to run (see Component rules).

| Part (Penpot layer) | What it is                                                                                                             | Base UI part         | Class                      | `slotProps` key |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------- | -------------------------- | --------------- |
| `root`              | The card: an inverse box that holds the caller's `children`, a block that wraps its text                               | `Tooltip.Popup`      | `pn-MapTooltip`            | none            |
| `positioner`        | Not drawn: the box Base UI places against the anchor, above it by default, and that carries the stacking               | `Tooltip.Positioner` | `pn-MapTooltip-positioner` | `positioner`    |
| `portal`            | Not drawn: the `<div>` Base UI appends to `<body>` while the card is open, so no panel's overflow or stacking clips it | `Tooltip.Portal`     | `pn-MapTooltip-portal`     | `portal`        |

`Tooltip.Root` groups the parts and holds the open state; it renders no element, so it has no layer, class or `slotProps` key.

## Base UI parts

Imported from `@base-ui/react/tooltip`, at the version pinned in `package.json` (1.9.0 installed).

| Base UI part         | Renders                                                                                                                                                                     | Perron sets                                                                                                                                                                                           | Passed through                                                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Tooltip.Root`       | No element                                                                                                                                                                  | `open` and `defaultOpen` from MapTooltip's props, and `onOpenChange`, turned into `onClose(event, reason, details)` when it reports `false`                                                           | none                                                                                                                                               |
| `Tooltip.Portal`     | A `<div>` appended to `<body>`, rendered only while the card is open                                                                                                        | `className` (`pn-MapTooltip-portal`, then the caller's)                                                                                                                                               | `slotProps.portal`: `container`, `keepMounted` and the rest of its props                                                                           |
| `Tooltip.Positioner` | A `<div role="presentation">`, placed by Base UI, with `data-side`, `data-align`, `data-open` or `data-closed`, `data-anchor-hidden`, and the `--available-width` variables | `className` (`pn-MapTooltip-positioner`, then the caller's), `anchor` from MapTooltip's prop, and the defaults `sideOffset` and `collisionPadding` (see Props), which `slotProps.positioner` replaces | `slotProps.positioner`: `side`, `align`, `sideOffset`, `alignOffset`, `collisionPadding`, `collisionAvoidance`, `sticky` and the rest of its props |
| `Tooltip.Popup`      | A `<div tabindex="-1">` with no role, with `data-side`, `data-align`, `data-open` or `data-closed`, `data-starting-style`, `data-ending-style` and `data-instant`           | `className` (`pn-MapTooltip`, then the caller's), `ref`, and the caller's `children`                                                                                                                  | `render`, `style`, `id`, `onPointerEnter`, `onPointerLeave` and every other prop of a `<div>`, through `{...rest}`                                 |

Base UI already does: it renders the card only while it is open; it places the card against the anchor, on the side asked for, flipping to the opposite side when that one has no room and shifting it along the edge so it stays inside the viewport; it re-reads the anchor when an ancestor scrolls, the anchor or the card resizes or the layout shifts, though not on every frame; it marks the positioner `data-anchor-hidden` when the anchor is out of view or a virtual one measures nothing (a 0 by 0 rect at 0, 0); it reports Esc, from anywhere in the document while the card is open, as `onOpenChange(false)` with the reason `'escape-key'`, and a press outside the card as `'outside-press'`; it leaves the card readable but out of the tab order (`tabindex="-1"`) and makes the positioner `inert` while the card is closed; and it sets the variables `--available-width` and `--available-height`, the room between the anchor and the viewport's edge.

## Props

In MUI's layout. Every prop here gets this description as its JSDoc. Slots come last.

The prop that places the card is named `anchor`, with Base UI's name and type for `Tooltip.Positioner`'s, and it is required. It maps one to one onto the positioner's prop and takes a virtual element, a point with no element behind it, which MUI's `anchorEl` would misname; and with no trigger, a card without an anchor has nothing to sit against.

MapTooltip leaves out `onOpen`. Nothing inside the component opens the card: Base UI reports an opening only from a trigger's hover or focus, and MapTooltip has no trigger, so an `onOpen` would never fire. It can join later as an optional prop without a break.

MapTooltip leaves the side and alignment to `slotProps.positioner`, keeping Base UI's `side` of `'top'` and `align` of `'center'`, and sets two defaults read in script from the tokens' `numeric` values, since Base UI takes numbers: a `sideOffset` of `space.200` and a `collisionPadding` of `size.panel-gap`. A card above the point leaves the vehicle under the pointer in view, `space.200` keeps it clear of the largest dot, and `size.panel-gap` keeps it as far from the screen edge as the panels are; a caller who needs another side gives it through `slotProps.positioner`, which the contract makes the way inside.

| Name                        | Type                                                                                                                 | Default | Base UI prop                     | Description                                                                                                                                                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `children`                  | `ReactNode`                                                                                                          | none    | none                             | The card's content: a few words on what is under the pointer, in sentence case, such as "Bus 5C to Husum". It takes the card's inverse text colour.                                                                      |
| `anchor`                    | `Element \| VirtualElement \| React.RefObject<Element \| null> \| (() => Element \| VirtualElement \| null) \| null` | none    | `anchor` on `Tooltip.Positioner` | Required. What the card sits against: a virtual element whose `getBoundingClientRect()` gives the point the map projects for a vehicle or stop, or an element. Pass a new one when the point moves, so the card follows. |
| `open`                      | `boolean`                                                                                                            | none    | `open`                           | Whether the card is shown. Set it while the pointer rests on what the card describes, and clear it in `onClose`.                                                                                                         |
| `defaultOpen`               | `boolean`                                                                                                            | `false` | `defaultOpen`                    | Whether the card is shown at first, when `open` is not set.                                                                                                                                                              |
| `onClose`                   | `(event, reason, details) => void`                                                                                   | none    | `onOpenChange`                   | Called when Base UI asks to close the card: on Esc (`reason` is `'escape-key'`) or a press outside it (`'outside-press'`). `details` is Base UI's event details, unchanged.                                              |
| `render`                    | Base UI's `render`                                                                                                   | none    | inherited                        | Allows you to replace the component's HTML element with a different tag, or compose it with another component. Accepts a `ReactElement` or a function that returns the element to render.                                |
| `className`, `style`, `ref` | React's                                                                                                              | none    | none                             | Reach the root, the card. `className` is merged after `pn-MapTooltip`.                                                                                                                                                   |
| `slotProps.portal`          | `Tooltip.Portal.Props`                                                                                               | none    | `Tooltip.Portal`                 | Props for the `portal` part, such as `container` to render the card inside the map's own element.                                                                                                                        |
| `slotProps.positioner`      | `Tooltip.Positioner.Props`                                                                                           | none    | `Tooltip.Positioner`             | Props for the `positioner` part, such as `side`, `align` or `sideOffset`. Its `sideOffset` and `collisionPadding` replace MapTooltip's defaults.                                                                         |

`MapTooltipProps` extends `Tooltip.Popup.Props` without its `children`, so `render`, `className` and `style` are inherited with Base UI's JSDoc, and declares `children`, `anchor`, `open`, `defaultOpen`, `onClose`, `ref` and `slotProps`. No `variant`, `size` or `color`: the card has one look, the Tooltips family's. No owned string, so no `*Label` prop. None of the names is one the contract's [Names from other libraries](README.md#names-from-other-libraries) table bans; `onOpenChange` stays inside the component.

## Tokens

One row per part, state and property. The card has one design state, open: it renders only while open, and takes no hover, focus, press, selection or disabled look, since it holds no control. Rest below is the open card.

The card takes the Tooltips family's treatment: `color.surface.inverse` with `color.text.inverse`, no shadow, no border, `radius.md`, text in `typography.label-sm`. The positioner takes `z-index.dialog`, as the contract's CSS section asks of everything that renders in a portal, so a dialog opened after the card paints over it; the screen's `z-index.tooltip` is a pattern's token, outside a component's [families](README.md#token-families).

The card is padded `space.150` on the block axis and `space.200` on the inline axis. The family sets no padding; `space.150` above and below keeps a line of `typography.label-sm` and a `size.badge` line badge comfortable, and `space.200` at the sides matches the offset from the point.

The card's width follows its content, capped at `--available-width`, Base UI's room between the anchor and the viewport's edge, with no token for a largest width. The card holds a few words, and the cap keeps it on screen at 320 px wide; a fixed largest width would need a new token through the `design-tokens` skill for no use yet.

In forced colours, the card draws a `border.width.025` outline in `CanvasText`, so its edge still shows on the map. Forced colours replace the inverse fill with `Canvas`, the map's own colour there, and an outline, unlike a border, keeps the card's size.

When Base UI marks the positioner `data-anchor-hidden`, the card is hidden with `visibility: hidden` until its anchor is back in view. The card speaks of a point the reader can no longer see, such as a vehicle panned off the map.

| Part         | State          | Property                 | Token                                                                          |
| ------------ | -------------- | ------------------------ | ------------------------------------------------------------------------------ |
| `positioner` | rest           | `z-index`                | `z-index.dialog`                                                               |
| `positioner` | anchor hidden  | `visibility`             | `hidden`, on `[data-anchor-hidden]`                                            |
| `root`       | rest           | `background-color`       | `color.surface.inverse`                                                        |
| `root`       | rest           | `color`                  | `color.text.inverse`                                                           |
| `root`       | rest           | `font`, `letter-spacing` | `typography.label-sm`, with its tracking twin                                  |
| `root`       | rest           | `border-radius`          | `radius.md`                                                                    |
| `root`       | rest           | `padding-block`          | `space.150`                                                                    |
| `root`       | rest           | `padding-inline`         | `space.200`                                                                    |
| `root`       | rest           | `max-inline-size`        | `var(--available-width)`, Base UI's variable                                   |
| `root`       | rest           | `box-shadow`             | `none`                                                                         |
| `root`       | forced colours | `outline`                | `border.width.025` solid `CanvasText`, inside `@media (forced-colors: active)` |

The defaults MapTooltip gives the positioner in script, from the tokens' `numeric` values:

| Part         | State | Property           | Token            |
| ------------ | ----- | ------------------ | ---------------- |
| `positioner` | rest  | `sideOffset`       | `space.200`      |
| `positioner` | rest  | `collisionPadding` | `size.panel-gap` |

Hover, highlighted, focus, pressed, disabled, selected and invalid don't apply: the card is not a control. Base UI's `data-starting-style` and `data-ending-style` take no look, as the card has no transition.

## Keyboard and ARIA

From the Base UI reference for `Tooltip` and the installed `TooltipRoot`, `TooltipPositioner`, `TooltipPopup` and the dismiss hook they build on. "From" says who does it.

| Key      | Does                                                                                                                                                                                     | From    |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `Escape` | While the card is open, from anywhere in the document: calls `onClose(event, 'escape-key', details)`; an uncontrolled card closes, a controlled one closes when the caller clears `open` | Base UI |

No other key: the card is out of the tab order (`tabindex="-1"`) and holds no control, so Tab passes it by. Opening it from the keyboard is the map's, which moves focus between vehicles in the vehicle list rather than on the canvas.

The card keeps no role and stays in the accessibility tree, with neither `role="tooltip"` nor `aria-hidden`. Base UI sets no role on `Tooltip.Popup`, and `role="tooltip"` describes a trigger through `aria-describedby`, which the card has none of; left readable, a screen reader's reading cursor still finds its words, while the map's text alternative, the vehicle list, carries the same facts.

| Element      | Role                                   | Accessible name from                  | States announced |
| ------------ | -------------------------------------- | ------------------------------------- | ---------------- |
| `positioner` | `presentation`, from Base UI           | none                                  | none             |
| `root`       | none: a `<div>` that reads as its text | none: its `children` are read as text | none             |

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: the card shows only the caller's `children`, read as text in the accessibility tree; it draws no mark, and the facts it shows are also in the vehicle list and the detail panel, the map's text alternative.
- [ ] Every landmark and named region has an accessible name: none here; the card is not a landmark or a region.
- [ ] Every default label can be overridden: none here; the card owns no strings.
- [ ] Every shape the type accepts renders, in every variant: `children` renders a string, an element and a list alike, as the `Content` story shows.
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here; the card leaves the document when it closes, and Base UI makes the positioner `inert` while it is closed.
- [ ] Native semantics first: a plain `<div>` for words, with no role, since the card is neither a control nor a description tied to one.
- [ ] Focus moves in reading order and returns on close: the card never takes focus, so opening and closing it leaves focus where it was.
- [ ] Every target is at least `size.target-min` square: none here; the card takes no press.
- [ ] Loops stop when the system asks for less motion: none here; the card has no loop and no transition.

## Owned strings

No owned strings: every word on the card comes from the caller, as `children`.

## Component rules

Rules for this component alone, numbered so the build and the review can cite them.

- **CR-1.** MapTooltip renders `Tooltip.Root`, then `Tooltip.Portal`, `Tooltip.Positioner` and `Tooltip.Popup`, and no `Tooltip.Provider`, `Tooltip.Trigger`, `Tooltip.Arrow` or `Tooltip.Viewport`. The caller opens and closes it; the component adds no pointer or key handlers of its own.
- **CR-2.** Base UI already places the card, flips and shifts it inside the viewport, re-reads the anchor on scroll, resize and layout shift, reports Esc and a press outside, and marks the hidden anchor, so the component rebuilds none of it.
- **CR-3.** The popup is the root: `{...rest}` comes before its own attributes, `ref` reaches it, and `className` is merged after `pn-MapTooltip`. `children`, `anchor`, `open`, `defaultOpen`, `onClose` and `slotProps` are taken out of `rest` first, so none reaches the `<div>`.
- **CR-4.** `onOpenChange(open, details)` is adapted once, inside the component: when `open` is `false` it calls `onClose(details.event, details.reason, details)`; MapTooltip exposes no `onOpenChange`, and `onClose` is never called for an opening.
- **CR-5.** `slotProps.portal` and `slotProps.positioner` are merged with `mergeProps` (`@base-ui/react/merge-props`), the component's own props last, so each part's `pn-` class stays and its `anchor` is MapTooltip's. The positioner's `sideOffset` and `collisionPadding` are defaults: the component passes `space.200` and `size.panel-gap` only when `slotProps.positioner` gives none, reading their numbers from the tokens' `numeric` values in script, never a literal.
- **CR-6.** The positioner takes `z-index.dialog`, and hides the card with `visibility: hidden` while it carries `[data-anchor-hidden]`.
- **CR-7.** The card's look is the Tooltips family's and nothing more: `color.surface.inverse`, `color.text.inverse`, `radius.md`, `typography.label-sm` with its tracking twin, no shadow and no border. Its text wraps (`overflow-wrap: break-word`) inside `max-inline-size: var(--available-width)`, and its width otherwise follows its content.
- **CR-8.** The card is a block: `children` flow as the caller writes them, and the component sets no flex or grid on them. Content takes the card's colour through `currentColor`.
- **CR-9.** Opening and closing are immediate: no `duration.*` token fits a hover card, so the CSS has no transition or animation, and `data-starting-style` and `data-ending-style` take no look.
- **CR-10.** In forced colours the card draws a `border.width.025` solid `CanvasText` outline, inside `@media (forced-colors: active)`, so its geometry doesn't change.
- **CR-11.** The popup keeps no role and no `aria-hidden`, and the component adds none.

## Stories

The deferred drawing has no variant property and no `State`: the card has one look and one design state, open, so its one variant is `Default` (`penpot/README.md`, "Conventions"). The other stories are behaviour, which the `play` tests check.

The meta sets `parameters: { docs: { story: { inline: false, height: '480px' } } }`, since the card portals to `<body>`, and each story renders in its own frame. A virtual anchor in a story is a point inside the frame, such as `{ getBoundingClientRect: () => DOMRect.fromRect({ x: 240, y: 240, width: 0, height: 0 }) }`, never one at 0, 0, which Base UI reads as hidden. Each `play` finds the card through `screen`, outside `canvasElement`, and ends with it closed.

| Story         | Shows                                                                                                                                                        | `play` test                                                                                                                                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Default`     | The subject story: the card open (`defaultOpen`) against a virtual point, with one line of text, "Bus 5C to Husum"; its args pass every rule alone           | The card has `pn-MapTooltip`, no role, and the text; its positioner has `data-side="top"`, and the card's bottom edge sits above the point; Esc calls `onClose` with `'escape-key'` and the card leaves the document    |
| `Controlled`  | The card with `open` held in the story's state, against an element (a small dot standing in for a stop), beside a button "Show the card" that opens it again | Esc calls `onClose` once with `'escape-key'` and the story clears `open`; the button opens it again; a press outside the card calls `onClose` with `'outside-press'`; focus stays on the button throughout; ends closed |
| `Content`     | The card open against a virtual point, with an element and a list as `children`: a bold line, "Bus 5C to Husum", and a second line, "Live, on time"          | Both lines render inside the card in `color.text.inverse`, and the card stays inside the viewport                                                                                                                       |
| `NearTopEdge` | The card open against a virtual point near the top of the frame, where there is no room above it                                                             | The positioner flips to `data-side="bottom"`, and the card's top edge stays at least `size.panel-gap` from the top of the viewport                                                                                      |

## Do and don't

For a caller using the component, with the reason.

| Do                                                                                                                                 | Don't                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Open the card while a mouse pointer rests on a vehicle or a stop, and select it on a tap or a click, opening its detail panel      | Open the card on touch: a tap has no hover, and Accessibility asks that anything shown on hover is also reached by selecting the item             |
| Keep the card open while the pointer is over it, using the card's `onPointerEnter` and `onPointerLeave`, and close it in `onClose` | Close it the moment the pointer leaves the dot: Accessibility asks that a hover card stays while the pointer is over it                           |
| Give a few words: the line and its destination, the data state                                                                     | Put a link, a button or a field in the card: it is out of the tab order, so the keys can't reach them; use a panel or a popover                   |
| Pass a new `anchor` when the vehicle moves, so the card moves with it                                                              | Expect the card to follow a moving point on its own: Base UI re-reads the anchor on scroll, resize and layout shift, not on every frame           |
| Let the card's words take its inverse colour, and use components that draw their own colours on a fill, such as a line badge       | Put text that sets its own secondary or tertiary colour in the card: those colours are measured on light surfaces, not on `color.surface.inverse` |
| Give the same facts in the vehicle list or the detail panel                                                                        | Put anything only in the card: screen reader, keyboard and touch users never see it                                                               |
| Change the side through `slotProps.positioner`, such as `side: 'bottom'`                                                           | Move the card with a margin or a `transform`: Base UI's placement and flipping no longer match what is drawn                                      |
| Show one card at a time                                                                                                            | Open a card for each vehicle at once: the cards cover the map they describe                                                                       |
