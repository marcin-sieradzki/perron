# Button

A button that runs one action on the screen it sits on, such as "Show departures", in ink (`neutral`) or, for the one main action of a screen, in the brand yellow (`brand`).

The design is deferred (ADR 0010, `docs/adr/0010-unattended-runs-with-design-deferred.md`): this spec decides what the drawing would. The read-back `penpot/button.json`, drawn before the contract gave action components the `brand` colour, is one source among the contract, the foundations and the tokens, and the spec follows it wherever it holds.

## Anatomy

Penpot page `Components/Button`. Family: none (the contract's [Families](README.md#families) give buttons only their text, `typography.label`). Shared parts: none.

| Part (Penpot layer) | What it is                                                                                                                                           | Base UI part                                           | Class                 | `slotProps` key |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------- | --------------- |
| `root`              | The native `<button>`: a flex row, centred, that holds the start icon, the label and the end icon in reading order                                   | `Button`                                               | `pn-Button`           | none            |
| `label`             | A `<span>` that holds the caller's `children`                                                                                                        | none: a span inside `Button`, which has no inner parts | `pn-Button-label`     | none            |
| `startIcon`         | A `<span>`, `aria-hidden`, that holds the caller's `startIcon` before the label; only rendered when `startIcon` is given                             | none: a span inside `Button`                           | `pn-Button-startIcon` | none            |
| `endIcon`           | A `<span>`, `aria-hidden`, that holds the caller's `endIcon` after the label; only rendered when `endIcon` is given. Not in the read-back: see Props | none: a span inside `Button`                           | `pn-Button-endIcon`   | none            |
| `focusRing`         | The keyboard focus ring. The code map lands it on `root`: it is the `:focus-visible` outline `perron.css` draws on the root, not an element          | `Button`                                               | none                  | none            |

## Base UI parts

Imported from `@base-ui/react/button`, at the version pinned in `package.json` (1.9.0 installed).

| Base UI part | Renders                                                                                     | Perron sets                                                                                                                                                                                                                                                          | Passed through                                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`     | `<button type="button">`, or the element `render` gives, with `data-disabled` when disabled | `className` (`pn-Button`, then the caller's), `style`, `ref`, `disabled` from `disabled`, `data-variant`, `data-color` and `data-size` from their props (defaults included), `data-full-width` when `fullWidth`, and the children: the icon spans and the label span | `render`, `nativeButton`, `focusableWhenDisabled`, `type`, `onClick` and every other prop of a native `<button>`, through `{...rest}` |

Base UI already does: it renders a native `<button>` with `type="button"`, which a caller's `type="submit"` overrides; Enter and Space activate it through the browser; when disabled it sets the native `disabled` attribute and `data-disabled`, and stops `onClick`, `onMouseDown` and `onPointerDown` from reaching the caller; with `focusableWhenDisabled` it sets `aria-disabled` in place of `disabled`, keeps the button in the tab order and lets only Tab through; with `render` and `nativeButton={false}` it gives a non-button element `role="button"`, a `tabIndex` and Enter and Space activation, and in development it warns when `nativeButton` doesn't match the rendered element.

## Props

In MUI's layout. Every prop here gets this description as its JSDoc. Slots come last.

| Name                        | Type                   | Default     | Base UI prop            | Description                                                                                                                                         |
| --------------------------- | ---------------------- | ----------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `variant`                   | `'solid' \| 'outline'` | `'solid'`   | none                    | How much the button stands out: `solid` is filled, for the action a panel is for; `outline` is an edge only, for the actions beside it.             |
| `color`                     | `'neutral' \| 'brand'` | `'neutral'` | none                    | The intent: `neutral` is ink, for every action but the main one; `brand` is the brand yellow, for the one main action of a screen.                  |
| `size`                      | `'small' \| 'medium'`  | `'medium'`  | none                    | The button's height: `medium` is `size.button`, `small` is `size.button-sm`, for dense rows and panels.                                             |
| `disabled`                  | `boolean`              | `false`     | `disabled`              | Whether the button ignores the pointer and the keys. A disabled button leaves the tab order unless `focusableWhenDisabled` is set.                  |
| `fullWidth`                 | `boolean`              | `false`     | none                    | Whether the button fills the width of its container, such as a bottom sheet's main action. Sets `data-full-width`.                                  |
| `startIcon`                 | `ReactNode`            | none        | none                    | An icon before the label, in reading order, so it moves to the right in right-to-left text. Hidden from screen readers: the label names the button. |
| `endIcon`                   | `ReactNode`            | none        | none                    | An icon after the label, in reading order. Hidden from screen readers: the label names the button.                                                  |
| `focusableWhenDisabled`     | `boolean`              | `false`     | `focusableWhenDisabled` | Inherited from Base UI with its JSDoc: whether the button stays focusable when disabled.                                                            |
| `nativeButton`              | `boolean`              | `true`      | `nativeButton`          | Inherited from Base UI with its JSDoc: set it to `false` when `render` gives an element that isn't a `<button>`.                                    |
| `render`                    | Base UI's `render`     | none        | `render`                | Inherited from Base UI: swaps the root element and keeps the behaviour, the class and the data attributes.                                          |
| `children`                  | `ReactNode`            | none        | none                    | The label: the words that name the action, in sentence case. Required in practice: a button with no words is an IconButton.                         |
| `className`, `style`, `ref` | React's                | none        | `className`, `style`    | Reach the root. `className` is merged after `pn-Button`.                                                                                            |

No `slotProps`: Button has one Base UI part, `Button`, which is the root, and the root takes the component's own props. The label and icon spans are not Base UI parts. No label-override props: Button owns no strings.

Button passes Base UI's `focusableWhenDisabled` and `nativeButton` through unchanged, keeping their Base UI JSDoc: `nativeButton={false}` lets `render` give a non-button element without a development warning, and `focusableWhenDisabled` lets a disabled button keep focus in a toolbar or explain itself through a tooltip.

Button offers `endIcon` beside `startIcon`, though the code map maps only `startIcon`: the contract names the two as a pair, MUI's Button takes both, and a "Next" or "Open in Rejseplanen" action reads with its icon after the words.

Button offers `fullWidth`, which the read-back doesn't show: a bottom sheet's main action fills the sheet on a phone, the contract names `fullWidth` as its example boolean, and it is MUI's Button prop.

## Tokens

One row per part, state and property. States are the contract's design states; Penpot's `State` values map through the code map: `default` is rest, `hover` is `:hover` inside `@media (hover: hover)`, `focus` is `:focus-visible`, `disabled` is `[data-disabled]`; pressed, which the read-back doesn't draw, is `:active`. Every `color` row sets the root's `color`, which the label and both icons take, since icons draw in `currentColor`.

All variants and colours:

| Part                   | State | Property                    | Token                                                                                                                                            |
| ---------------------- | ----- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `root`, medium         | rest  | `height`                    | `size.button`                                                                                                                                    |
| `root`, medium         | rest  | `padding-inline`            | `space.400`                                                                                                                                      |
| `root`, medium         | rest  | `gap`                       | `space.200`                                                                                                                                      |
| `root`, small          | rest  | `height`                    | `size.button-sm`                                                                                                                                 |
| `root`, small          | rest  | `padding-inline`            | `space.300`                                                                                                                                      |
| `root`, small          | rest  | `gap`                       | `space.150`                                                                                                                                      |
| `root`                 | rest  | `border-radius`             | `radius.md`                                                                                                                                      |
| `root`                 | rest  | `border-width`              | `border.width.025`                                                                                                                               |
| `label`                | rest  | `font`, `letter-spacing`    | `typography.label`, with its tracking twin                                                                                                       |
| `startIcon`, `endIcon` | rest  | `--perron-icon-size`        | `icon.size.400`                                                                                                                                  |
| `root`                 | focus | `outline`, `outline-offset` | `focus.width` in `color.border.focus`, `focus.offset` (drawn by `perron.css`)                                                                    |
| `focusRing`            | focus | ring corner radius          | `radius.lg`, as drawn: the outline follows the root's `radius.md` out by `focus.offset` plus `focus.width`, so the CSS sets no radius of its own |

`solid`, `neutral`:

| Part   | State    | Property           | Token                         |
| ------ | -------- | ------------------ | ----------------------------- |
| `root` | rest     | `background-color` | `color.surface.inverse`       |
| `root` | rest     | `border-color`     | `transparent`                 |
| `root` | rest     | `color`            | `color.text.inverse`          |
| `root` | hover    | `background-color` | `color.surface.inverse-hover` |
| `root` | pressed  | `background-color` | `color.surface.inverse-hover` |
| `root` | disabled | `background-color` | `color.surface.inset`         |
| `root` | disabled | `color`            | `color.text.tertiary`         |

`solid`, `brand`:

| Part   | State    | Property           | Token                       |
| ------ | -------- | ------------------ | --------------------------- |
| `root` | rest     | `background-color` | `color.surface.brand`       |
| `root` | rest     | `border-color`     | `color.border.brand`        |
| `root` | rest     | `color`            | `color.text.on-color.dark`  |
| `root` | hover    | `background-color` | `color.surface.brand-hover` |
| `root` | pressed  | `background-color` | `color.surface.brand-hover` |
| `root` | disabled | `background-color` | `color.surface.inset`       |
| `root` | disabled | `border-color`     | `transparent`               |
| `root` | disabled | `color`            | `color.text.tertiary`       |

`outline`, `neutral`:

| Part   | State    | Property           | Token                  |
| ------ | -------- | ------------------ | ---------------------- |
| `root` | rest     | `background-color` | `transparent`          |
| `root` | rest     | `border-color`     | `color.border.control` |
| `root` | rest     | `color`            | `color.text.primary`   |
| `root` | hover    | `background-color` | `color.surface.hover`  |
| `root` | pressed  | `background-color` | `color.surface.hover`  |
| `root` | disabled | `border-color`     | `color.border.subtle`  |
| `root` | disabled | `color`            | `color.text.tertiary`  |

`outline`, `brand`:

| Part   | State    | Property           | Token                 |
| ------ | -------- | ------------------ | --------------------- |
| `root` | rest     | `background-color` | `transparent`         |
| `root` | rest     | `border-color`     | `color.border.brand`  |
| `root` | rest     | `color`            | `color.text.brand`    |
| `root` | hover    | `background-color` | `color.surface.hover` |
| `root` | pressed  | `background-color` | `color.surface.hover` |
| `root` | disabled | `border-color`     | `color.border.subtle` |
| `root` | disabled | `color`            | `color.text.tertiary` |

A brand outline button takes `color.surface.hover` on hover, as the neutral outline does, not `color.surface.brand-subtle`: `color.surface.hover` is the hover layer every control shares, and `brand-subtle` is a tinted background, not a state.

A disabled brand button looks exactly like a disabled neutral one (solid: `color.surface.inset` with no edge; outline: a `color.border.subtle` edge), with `color.text.tertiary` text: disabled is a colour, and a yellow that can't be pressed shouldn't still mark the main action.

The read-back shows no pressed state, which a native button has (`:active`). Pressed takes the hover row's tokens, in a rule outside `@media (hover: hover)` so a touch press shows too: no token is made for a pressed fill, and a press on a phone otherwise shows nothing.

## Keyboard and ARIA

From the Base UI reference for `Button` and the installed `useButton`. "From" says who does it.

| Key                | Does                                                                                            | From                                           |
| ------------------ | ----------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `Tab`, `Shift+Tab` | Moves focus to the button and away; a disabled button is skipped unless `focusableWhenDisabled` | The browser, and Base UI                       |
| `Enter`            | Activates the button: fires `onClick`, or submits the form with `type="submit"`                 | The browser; Base UI for a non-button `render` |
| `Space`            | Activates the button on release                                                                 | The browser; Base UI for a non-button `render` |

| Element                | Role                                                                                    | Accessible name from                                                                            | States announced                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `root`                 | `button`, native; `role="button"` from Base UI when `render` gives a non-button element | Its text content: the label's `children`; `aria-label` or `aria-labelledby` from the caller win | Disabled: the native `disabled`, or `aria-disabled` with `focusableWhenDisabled` |
| `startIcon`, `endIcon` | none: `aria-hidden="true"`                                                              | none                                                                                            | none                                                                             |

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: the label is text the button is named by; the icons are `aria-hidden`, since an icon beside a word adds nothing the word doesn't say ([Icons](../foundations/icons.md#style)); `color` and `variant` carry emphasis, not meaning, and disabled is announced by the native attribute.
- [ ] Every landmark and named region has an accessible name: none here; a button is neither.
- [ ] Every default label can be overridden: none here; Button owns no strings.
- [ ] Every shape the type accepts renders, in every variant: `children`, `startIcon` and `endIcon` render a string, an element and a list alike, in every `variant`, `color` and `size`.
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here; Button keeps no hidden copy and collapses nothing.
- [ ] Native semantics first: a native `<button>` from Base UI's `Button`; with `render` and `nativeButton={false}`, Base UI's `role="button"`.
- [ ] Focus moves in reading order and returns on close: the button is one tab stop in document order, and opens nothing of its own to return from.
- [ ] Every target is at least `size.target-min` square: the smallest target is a small button, `size.button-sm` (30 px) tall, and at least that wide with its `space.300` padding on each side and a word between.
- [ ] Loops stop when the system asks for less motion: none here; Button has no loop and no transition.

## Owned strings

No owned strings: every word comes from the caller, as `children`.

## Component rules

Rules for this component alone, numbered so the build and the review can cite them.

- **CR-1.** Base UI's `Button` already renders the native `<button type="button">`, activates on Enter and Space, sets `disabled` and `data-disabled`, and blocks the click of a disabled button, so the component rebuilds none of it and passes `disabled` straight to it.
- **CR-2.** The root always carries `data-variant`, `data-color` and `data-size`, defaults included, and `data-full-width` when `fullWidth`; the CSS selects on them, one class then attributes: `.pn-Button[data-variant='outline'][data-color='brand']`.
- **CR-3.** The states keep the button's geometry: hover, pressed, focus and disabled change colours only, never the height, padding, gap, border width or radius, so nothing moves when the state changes.
- **CR-4.** Hover is read inside `@media (hover: hover)` and never applies to a disabled button: the hover rule excludes `[data-disabled]`, since a native disabled button still matches `:hover`.
- **CR-5.** Focus uses the ring `perron.css` draws on `:focus-visible`; the component draws no ring of its own and never removes the outline. The focus state otherwise looks like rest.
- **CR-6.** The colour is set on the root's `color`; the label and the icons take it, the icons through `currentColor`. No rule sets a colour on an icon.
- **CR-7.** The icon spans are `aria-hidden="true"`, rendered only when their prop is given, and set `--perron-icon-size` to `icon.size.400` in both sizes, so an icon from `packages/perron/icons/` (drawn on the 16 px grid for controls) renders at its own step.
- **CR-8.** Changes of state are immediate: no `duration.*` token fits a button's state change, so the CSS has no transition.
- **CR-9.** `{...rest}` reaches the root before the component's own attributes, and `variant`, `color`, `size`, `fullWidth`, `startIcon` and `endIcon` are taken out of `rest` first, so none reaches the DOM.
- **CR-10.** A `brand` button keeps its `color.border.brand` edge at rest, on hover and pressed, in both variants: the light-theme yellow fill reaches only 2.1:1 on the surfaces, and the edge carries the 3:1 ([Semantic colours](../foundations/semantic-colours.md#brand)).

- **CR-11.** Every variant draws a `border.width.025` border, `transparent` on a neutral solid button and a disabled solid one, so all four looks share one width and height, the label sits in the same place, and Windows' forced colours draw an edge round every button: a border only some buttons carry makes a brand button 2 px wider than the same neutral one.
- **CR-12.** The label stays on one line (`white-space: nowrap`), the button growing with it, rather than wrapping inside the fixed `size.button` height: a wrapped label would overflow it, and button labels are short by content design.
- **CR-13.** Pressed (`:active`) takes the hover row's tokens, in a rule outside `@media (hover: hover)` so a press on a touch screen shows, and, like hover, never applies to a disabled button: the rule excludes `[data-disabled]`, since a button with `focusableWhenDisabled` has no native `disabled` and still matches `:active`.

## Stories

The deferred design's variant properties, in this order: `variant` (`solid`, `outline`), `color` (`neutral`, `brand`), `size` (`medium`, `small`) and `State` (`default`, `hover`, `focus`, `disabled`). Each story is named by its variant name (`penpot/README.md`, "Conventions"), renders the label "Show departures", as the read-back does, and sets `disabled` for a `Disabled` story. The hover and focus stories render at rest: the visual check drives the state itself, and their `play` tests check it.

`color` is a variant property, after `variant`, so the stories and a later drawing's exports are named `SolidNeutralMediumDefault` and `SolidBrandMediumDefault` rather than the read-back's `SolidMediumDefault`, 32 variants in all: the contract gives every action component `brand` beside `neutral`, and the design run that ends the deferral redraws the page with it.

| Story                          | Shows                                                                                              | `play` test                                                                                 |
| ------------------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `SolidNeutralMediumDefault`    | solid, neutral, medium, at rest                                                                    | Tab focuses the button, Enter and Space each fire `onClick` once, Shift+Tab returns focus   |
| `SolidNeutralMediumHover`      | solid, neutral, medium, hover                                                                      | Hovering sets the `color.surface.inverse-hover` fill                                        |
| `SolidNeutralMediumFocus`      | solid, neutral, medium, focus                                                                      | Tab gives the root `:focus-visible` and the ring                                            |
| `SolidNeutralMediumDisabled`   | solid, neutral, medium, disabled                                                                   | The button has `disabled` and `data-disabled`, Tab skips it, and a click fires no `onClick` |
| `SolidNeutralSmallDefault`     | solid, neutral, small, at rest                                                                     | none                                                                                        |
| `SolidNeutralSmallHover`       | solid, neutral, small, hover                                                                       | none                                                                                        |
| `SolidNeutralSmallFocus`       | solid, neutral, small, focus                                                                       | none                                                                                        |
| `SolidNeutralSmallDisabled`    | solid, neutral, small, disabled                                                                    | none                                                                                        |
| `SolidBrandMediumDefault`      | solid, brand, medium, at rest                                                                      | none                                                                                        |
| `SolidBrandMediumHover`        | solid, brand, medium, hover                                                                        | Hovering sets the `color.surface.brand-hover` fill and keeps the `color.border.brand` edge  |
| `SolidBrandMediumFocus`        | solid, brand, medium, focus                                                                        | none                                                                                        |
| `SolidBrandMediumDisabled`     | solid, brand, medium, disabled                                                                     | none                                                                                        |
| `SolidBrandSmallDefault`       | solid, brand, small, at rest                                                                       | none                                                                                        |
| `SolidBrandSmallHover`         | solid, brand, small, hover                                                                         | none                                                                                        |
| `SolidBrandSmallFocus`         | solid, brand, small, focus                                                                         | none                                                                                        |
| `SolidBrandSmallDisabled`      | solid, brand, small, disabled                                                                      | none                                                                                        |
| `OutlineNeutralMediumDefault`  | outline, neutral, medium, at rest                                                                  | none                                                                                        |
| `OutlineNeutralMediumHover`    | outline, neutral, medium, hover                                                                    | Hovering lays `color.surface.hover` over the transparent fill                               |
| `OutlineNeutralMediumFocus`    | outline, neutral, medium, focus                                                                    | none                                                                                        |
| `OutlineNeutralMediumDisabled` | outline, neutral, medium, disabled                                                                 | none                                                                                        |
| `OutlineNeutralSmallDefault`   | outline, neutral, small, at rest                                                                   | none                                                                                        |
| `OutlineNeutralSmallHover`     | outline, neutral, small, hover                                                                     | none                                                                                        |
| `OutlineNeutralSmallFocus`     | outline, neutral, small, focus                                                                     | none                                                                                        |
| `OutlineNeutralSmallDisabled`  | outline, neutral, small, disabled                                                                  | none                                                                                        |
| `OutlineBrandMediumDefault`    | outline, brand, medium, at rest                                                                    | none                                                                                        |
| `OutlineBrandMediumHover`      | outline, brand, medium, hover                                                                      | none                                                                                        |
| `OutlineBrandMediumFocus`      | outline, brand, medium, focus                                                                      | none                                                                                        |
| `OutlineBrandMediumDisabled`   | outline, brand, medium, disabled                                                                   | none                                                                                        |
| `OutlineBrandSmallDefault`     | outline, brand, small, at rest                                                                     | none                                                                                        |
| `OutlineBrandSmallHover`       | outline, brand, small, hover                                                                       | none                                                                                        |
| `OutlineBrandSmallFocus`       | outline, brand, small, focus                                                                       | none                                                                                        |
| `OutlineBrandSmallDisabled`    | outline, brand, small, disabled                                                                    | none                                                                                        |
| `WithIcons`                    | solid, neutral, medium, at rest, with a `startIcon` and an `endIcon` from `packages/perron/icons/` | The icon spans are `aria-hidden`, and the button's accessible name is the label alone       |
| `FullWidth`                    | solid, brand, medium, at rest, `fullWidth` in a narrow container                                   | The root carries `data-full-width` and is as wide as its container                          |

## Do and don't

For a caller using the component, with the reason.

| Do                                                                                                                                                             | Don't                                                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Give one button per screen `color="brand"`, for its main action; the default `neutral` ink is for everything else, so the yellow keeps meaning the main action | Put two brand buttons on one screen, or use `brand` for emphasis: a second yellow action leaves neither the main one                              |
| Name the action in sentence case, as a verb and what it acts on: "Show departures", "Show whole line"                                                          | Write "OK", "Click here", Title Case or an exclamation mark ([Content design](../content-design.md))                                              |
| Use IconButton for a button with an icon and no words, so it gets its required label                                                                           | Pass only a `startIcon` and no `children`: the icon is `aria-hidden`, so the button has no name                                                   |
| Use `solid` for the action a panel is for and `outline` for the actions beside it                                                                              | Mark the main action with `outline`, or set every action in a row `solid`                                                                         |
| Set `type="submit"` on a form's submit button; Base UI's default is `type="button"`                                                                            | Rely on a button submitting its form: without `type="submit"` it doesn't                                                                          |
| Pass `nativeButton={false}` with `render` when it gives an element that isn't a `<button>`                                                                     | Render a link with `render={<a href="/map" />}` for navigation: LinkButton is that component, and a button that navigates misleads screen readers |
| Keep a brand button out of rows of line and mode badges                                                                                                        | Set a brand button among bus badges, whose fill and ink label it shares, where it reads as one                                                    |
| Set `disabled` when the action can't run, with a reason in words nearby, or `focusableWhenDisabled` so the button can carry it                                 | Restyle a disabled button with `opacity`: disabled is `color.text.tertiary`, a colour                                                             |
