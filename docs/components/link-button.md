# LinkButton

A link that looks like a [Button](button.md): it takes the reader to another page or place, such as "Back to the map" or "Open in Rejseplanen", where a Button runs an action on the screen it sits on.

<!-- run notes -->

The design is deferred (ADR 0010, `docs/adr/0010-unattended-runs-with-design-deferred.md`): there is no read-back, code map or export, and this spec decides what the drawing would, from the contract, the foundations, the tokens, the Base UI reference and the [Button](button.md) spec, the one entry in its `dependsOn`. Base UI's Button guide settles the shape: Base UI's `Button` "enforces button semantics" (`role="button"`, Space activation) and "should not be used for links", and "if a link needs to look like a button visually, style the `<a>` element directly with CSS". So LinkButton is a native `<a href>` with Button's look, not a Button with `render={<a />}`.

## Anatomy

Penpot page `Components/LinkButton`. Family: none (the contract's [Families](README.md#families) give buttons only their text, `typography.label`, and LinkButton wears Button's treatment). Shared parts: none.

LinkButton has no Base UI part: the registry gives it none, and Base UI's only candidate, `Button`, would give the link a button's role. Its root renders through Base UI's `useRender` hook (`@base-ui/react/use-render`), which gives it the `render` prop, as Delay's does, and its inner parts are plain elements. The layers are the ones the drawing will name, Button's own.

| Part (Penpot layer) | What it is                                                                                                                                | Base UI part                                      | Class                     | `slotProps` key |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------- | --------------- |
| `root`              | The native `<a href>`: an inline flex row, centred, that holds the start icon, the label and the end icon in reading order                | none: an `<a>` rendered by `useRender`            | `pn-LinkButton`           | none            |
| `label`             | A `<span>` that holds the caller's `children`                                                                                             | none: a plain `<span>`, no behaviour to borrow    | `pn-LinkButton-label`     | none            |
| `startIcon`         | A `<span>`, `aria-hidden`, that holds the caller's `startIcon` before the label; only rendered when `startIcon` is given                  | none: a plain `<span>`                            | `pn-LinkButton-startIcon` | none            |
| `endIcon`           | A `<span>`, `aria-hidden`, that holds the caller's `endIcon` after the label; only rendered when `endIcon` is given                       | none: a plain `<span>`                            | `pn-LinkButton-endIcon`   | none            |
| `focusRing`         | The keyboard focus ring: the `:focus-visible` outline `perron.css` draws on the root, not an element; the code map will land it on `root` | none: the browser's `:focus-visible` on the `<a>` | none                      | none            |

LinkButton has its own CSS, `pn-LinkButton`, that sets Button's tokens row for row (see Tokens), rather than reusing Button's classes or composing Perron's `Button`: the contract names each component's classes after it, composing `Button` would bring Base UI's `role="button"`, and ToolbarButton already set the precedent of its own CSS over Button's tokens. A story holds the two to each other (`MatchesButton`).

## Base UI parts

LinkButton imports no Base UI component. It uses two Base UI utilities, at the version pinned in `package.json` (1.9.0 installed): `useRender` (`@base-ui/react/use-render`) for the root and `mergeProps` (`@base-ui/react/merge-props`) to merge the caller's props with its own.

| Base UI part                     | Renders                              | Perron sets                                                                                                                                                                                                   | Passed through                                                                                                                                                         |
| -------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useRender` (a hook, not a part) | `<a>`, or the element `render` gives | `defaultTagName: 'a'`, `className` (`pn-LinkButton`, then the caller's), `href` from `href`, `data-variant` and `data-size` (defaults included), `data-full-width` when `fullWidth`, the icon and label spans | `render`, `ref`, `className`, `style`, `target`, `rel`, `download`, `hrefLang`, `aria-current`, `onClick` and every other prop of a native `<a>`, through `mergeProps` |

Base UI already does: swapping the root element for the one `render` gives (a router's link component, for one), keeping the class, the data attributes and the children; merging the caller's `ref` with the element's; and merging event handlers, `className` and `style` through `mergeProps`. Everything a link does, the browser does: Enter follows it, a middle click or a modifier opens it in a new tab or window, the context menu offers to copy it, and assistive technology lists it among the page's links.

## Props

In MUI's layout. Every prop here gets this description as its JSDoc. LinkButton has no `slotProps`, because the contract keys `slotProps` by inner Base UI part and LinkButton has none; a caller restyles it through `className` on the root. It owns no strings, so it has no label-override props. The `<a>` element's other attributes (`target`, `rel`, `download`, `aria-current`) reach the root and get no row, as the contract's [Props](README.md#props) says.

LinkButton offers Button's `variant` (`'solid' | 'outline'`, default `'solid'`), `size` (`'small' | 'medium'`, default `'medium'`), `fullWidth`, `startIcon` and `endIcon`, with Button's meanings and tokens, so a link and a button side by side look alike.

LinkButton has no `color` prop and is always ink (Button's `neutral`): the contract's [Intents](README.md#intents) say `brand` "is never a link" and offer it to Button, IconButton and a Toolbar's buttons only, and [Semantic colours](../foundations/semantic-colours.md#brand) say links have their own colours. A `color` prop can join later, as a wider union, without a break.

LinkButton has no `disabled` prop: an `<a>` has no `disabled` attribute, an `<a>` without `href` has no role for `aria-disabled` to sit on, and a link that goes nowhere shouldn't be shown; a caller who needs a disabled look renders a disabled Button.

LinkButton declares `href` itself, optional, with its own JSDoc, so the docs page shows it, though the contract leaves the element's attributes without a row: it is the one attribute every LinkButton needs, and it is optional only because a `render` such as a router's link can bring its own (`to`).

| Name                 | Type                     | Default    | Base UI prop         | Description                                                                                                                                                                               |
| -------------------- | ------------------------ | ---------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `href`               | `string`                 | none       | none                 | Where the link goes: a URL or a path. Give it on every LinkButton, unless `render` gives a router's link that brings its own destination.                                                 |
| `variant`            | `'solid' \| 'outline'`   | `'solid'`  | none                 | How much the link stands out: `solid` is filled, for the main place a panel leads to; `outline` is an edge only, for the links and actions beside it.                                     |
| `size`               | `'small' \| 'medium'`    | `'medium'` | none                 | The link's height: `medium` is `size.button`, `small` is `size.button-sm`, for dense rows and panels.                                                                                     |
| `fullWidth`          | `boolean`                | `false`    | none                 | Whether the link fills the width of its container, such as a bottom sheet's main link. Sets `data-full-width`.                                                                            |
| `startIcon`          | `ReactNode`              | none       | none                 | An icon before the label, in reading order, so it moves to the right in right-to-left text. Hidden from screen readers: the label names the link.                                         |
| `endIcon`            | `ReactNode`              | none       | none                 | An icon after the label, in reading order. Hidden from screen readers: the label names the link.                                                                                          |
| `render`             | Base UI's `render`       |            | inherited            | Allows you to replace the component's HTML element with a different tag, or compose it with another component. Accepts a `ReactElement` or a function that returns the element to render. |
| `children`           | `ReactNode`              | none       | none                 | The label: the words that name where the link goes, in sentence case. Required in practice: a link with no words has no name.                                                             |
| `className`, `style` | React's                  | none       | through `mergeProps` | Reach the root; `className` is merged after `pn-LinkButton`.                                                                                                                              |
| `ref`                | `Ref<HTMLAnchorElement>` | none       | `useRender`'s `ref`  | Reaches the root element.                                                                                                                                                                 |

`render` is Base UI's, inherited as it is. With none, LinkButton renders an `<a>` (CR-1); `render` swaps it, such as for a router's link component, keeping the class, the data attributes and the children, and the element it gives must render an `<a>` too.

## Tokens

One row per part, state and property, Button's own for the variants LinkButton offers ([Button](button.md#tokens)). States are the contract's design states: rest is no selector, hover is `:hover` inside `@media (hover: hover)`, focus is `:focus-visible`, pressed is `:active`. A link has no disabled, open, selected or invalid state, and `:visited` is not a design state, so a visited LinkButton looks as it did before. Every `color` row sets the root's `color`, which the label and both icons take, since icons draw in `currentColor`.

All variants:

| Part                   | State | Property                    | Token                                                                                                                            |
| ---------------------- | ----- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `root`, medium         | rest  | `height`                    | `size.button`                                                                                                                    |
| `root`, medium         | rest  | `padding-inline`            | `space.400`                                                                                                                      |
| `root`, medium         | rest  | `gap`                       | `space.200`                                                                                                                      |
| `root`, small          | rest  | `height`                    | `size.button-sm`                                                                                                                 |
| `root`, small          | rest  | `padding-inline`            | `space.300`                                                                                                                      |
| `root`, small          | rest  | `gap`                       | `space.150`                                                                                                                      |
| `root`                 | rest  | `border-radius`             | `radius.md`                                                                                                                      |
| `root`                 | rest  | `border-width`              | `border.width.025`                                                                                                               |
| `root`                 | rest  | `cursor`                    | none: the keyword `pointer`, as every `<a href>` has, set so a `render` element without one keeps it                             |
| `root`                 | rest  | `text-decoration`           | none: the keyword `none`, since the shape marks the link (CR-6)                                                                  |
| `label`                | rest  | `font`, `letter-spacing`    | `typography.label`, with its tracking twin                                                                                       |
| `startIcon`, `endIcon` | rest  | `--perron-icon-size`        | `icon.size.400`                                                                                                                  |
| `root`                 | focus | `outline`, `outline-offset` | `focus.width` in `color.border.focus`, `focus.offset` (drawn by `perron.css`)                                                    |
| `focusRing`            | focus | ring corner radius          | `radius.lg`, as Button's: the outline follows the root's `radius.md` out by `focus.offset` plus `focus.width`, no CSS of its own |

`solid`:

| Part   | State   | Property           | Token                           |
| ------ | ------- | ------------------ | ------------------------------- |
| `root` | rest    | `background-color` | `color.surface.inverse`         |
| `root` | rest    | `border-color`     | `transparent`                   |
| `root` | rest    | `color`            | `color.text.inverse`            |
| `root` | hover   | `background-color` | `color.surface.inverse-hover`   |
| `root` | pressed | `background-color` | `color.surface.inverse-pressed` |

`outline`:

| Part   | State   | Property           | Token                    |
| ------ | ------- | ------------------ | ------------------------ |
| `root` | rest    | `background-color` | `transparent`            |
| `root` | rest    | `border-color`     | `color.border.control`   |
| `root` | rest    | `color`            | `color.text.primary`     |
| `root` | hover   | `background-color` | `color.surface.hover`    |
| `root` | pressed | `background-color` | `color.surface.selected` |

Pressed is a step past hover, Button's pressed tokens, in a rule outside `@media (hover: hover)` so a touch press shows, as Button's CR-13 does.

## Keyboard and ARIA

From the browser's native link and Base UI's `useRender`, which adds no behaviour. "From" says who does it.

| Key                | Does                                                                                 | From        |
| ------------------ | ------------------------------------------------------------------------------------ | ----------- |
| `Tab`, `Shift+Tab` | Moves focus to the link and away                                                     | The browser |
| `Enter`            | Follows the link: fires `onClick`, then goes to `href` unless the click is prevented | The browser |
| `Space`            | Nothing: Space scrolls the page, as on every link, and never follows it (CR-4)       | The browser |

| Element                | Role                            | Accessible name from                                                                            | States announced                                                |
| ---------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `root`                 | `link`, native, from `<a href>` | Its text content: the label's `children`; `aria-label` or `aria-labelledby` from the caller win | Visited, by the browser; `aria-current` when the caller sets it |
| `startIcon`, `endIcon` | none: `aria-hidden="true"`      | none                                                                                            | none                                                            |

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: the label is text the link is named by; the icons are `aria-hidden`, since an icon beside a word adds nothing the word doesn't say ([Icons](../foundations/icons.md#style)); `variant` carries emphasis, not meaning; and the role says "link" where the shape says "button", so the label names where it goes (see Do and don't).
- [ ] Every landmark and named region has an accessible name: none here; a link is neither.
- [ ] Every default label can be overridden: none here; LinkButton owns no strings.
- [ ] Every shape the type accepts renders, in every variant: `children`, `startIcon` and `endIcon` render a string, an element and a list alike, in every `variant` and `size`.
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here; LinkButton keeps no hidden copy and collapses nothing.
- [ ] Native semantics first: a native `<a href>`, never `role="button"` and never Base UI's `Button` (CR-1); a `render` element renders an `<a>` too.
- [ ] Focus moves in reading order and returns on close: the link is one tab stop in document order, and opens nothing of its own to return from.
- [ ] Every target is at least `size.target-min` square: the smallest target is a small LinkButton, `size.button-sm` (30 px) tall, and at least that wide with its `space.300` padding on each side and a word between.
- [ ] Loops stop when the system asks for less motion: none here; LinkButton has no loop and no transition.

## Owned strings

No owned strings: every word comes from the caller, as `children`.

LinkButton announces nothing of its own when `target="_blank"` opens a new tab, and owns no "Opens in a new tab" string: a link that leaves Mylder names its destination in its label ("Open in Rejseplanen"), and Mylder's own links open in the same tab.

## Component rules

Rules for this component alone, numbered so the build and the review can cite them.

- **CR-1.** The root is a native `<a>` through `useRender` with `defaultTagName: 'a'`, never Base UI's `Button` or Perron's `Button` with `render={<a />}`: Base UI's `Button` gives a non-button element `role="button"` and Space activation, which tell a screen reader a link is a button.
- **CR-2.** The root always carries `data-variant` and `data-size`, defaults included, and `data-full-width` when `fullWidth`; the CSS selects on them, one class then attributes: `.pn-LinkButton[data-variant='outline'][data-size='small']`.
- **CR-3.** LinkButton's CSS sets, for each `variant` and `size`, the tokens Button's sets for the same `variant` and `size` in its `neutral` colour (see Tokens), so a LinkButton and a Button side by side share their height, padding, gap, radius, border, font and colours in every state. A change to Button's tokens changes LinkButton's in the same PR.
- **CR-4.** LinkButton adds no keyboard handling: Enter follows the link through the browser, Space does nothing to it, and modifier clicks open it in a new tab or window, as on every link.
- **CR-5.** The states keep the link's geometry: hover, pressed and focus change colours only, never the height, padding, gap, border width or radius, so nothing moves when the state changes. Hover is read inside `@media (hover: hover)`; pressed (`:active`) takes the pressed row's tokens, a step past hover, outside it.
- **CR-6.** The root resets the browser's link styles: `text-decoration: none` in every state, and its `color` from the tokens in every state, `:visited` included, so a visited LinkButton looks as it did before. Its shape marks it as something to press, as Button's does.
- **CR-7.** Focus uses the ring `perron.css` draws on `:focus-visible`; the component draws no ring of its own and never removes the outline.
- **CR-8.** The colour is set on the root's `color`; the label and the icons take it, the icons through `currentColor`. No rule sets a colour on an icon.
- **CR-9.** The icon spans are `aria-hidden="true"`, rendered only when their prop renders something (`false`, `true`, `null`, `undefined` and `''` leave no span, as in Button), and set `--perron-icon-size` to `icon.size.400` in both sizes.
- **CR-10.** Every variant draws a `border.width.025` border, `transparent` on a solid link, so both looks share one box and Windows' forced colours draw an edge round every LinkButton, as Button's CR-11 does.
- **CR-11.** The label stays on one line (`white-space: nowrap`), the link growing with it, rather than wrapping inside the fixed `size.button` height, as Button's CR-12 does.
- **CR-12.** Changes of state are immediate: no `duration.*` token fits the change, so the CSS has no transition.
- **CR-13.** The caller's props reach the root through `mergeProps`, the component's own last, so the component's class, data attributes and children win, and `variant`, `size`, `fullWidth`, `startIcon` and `endIcon` are taken out first, so none reaches the DOM. `className` is merged after `pn-LinkButton`.
- **CR-14.** LinkButton takes no `color` and no `disabled`: it is always ink, Button's `neutral`, and has no disabled state. Its props type is the `<a>` element's with React's non-standard `color` attribute omitted, so `color="brand"` is a type error rather than an attribute on the DOM; the `<a>` element's type already has no `disabled`.
- **CR-15.** `href` is declared in LinkButton's own props, optional, with its Props row's description as its JSDoc, and reaches the root's `<a>` as its `href`.

## Stories

The deferred design's variant properties, in this order: `variant` (`solid`, `outline`), `size` (`medium`, `small`) and `State` (`default`, `hover`, `focus`). Each story is named by its variant name (`penpot/README.md`, "Conventions"), renders the label "Back to the map" with an `href`, and its link's click is prevented in the story so a `play` test never leaves the page. The hover and focus stories render at rest: the visual check drives the state itself, and their `play` tests check it. Button's `disabled` State has no LinkButton twin, since LinkButton has no disabled state.

| Story                  | Shows                                                                                               | `play` test                                                                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SolidMediumDefault`   | solid, medium, at rest                                                                              | The root is a `link` named "Back to the map" with its `href`; Tab focuses it, Enter fires `onClick` once, Space fires none, Shift+Tab returns focus |
| `SolidMediumHover`     | solid, medium, hover                                                                                | Hovering sets the `color.surface.inverse-hover` fill, and pressing the `color.surface.inverse-pressed` fill past it                                 |
| `SolidMediumFocus`     | solid, medium, focus                                                                                | Tab gives the root `:focus-visible` and the ring                                                                                                    |
| `SolidSmallDefault`    | solid, small, at rest                                                                               | none                                                                                                                                                |
| `SolidSmallHover`      | solid, small, hover                                                                                 | none                                                                                                                                                |
| `SolidSmallFocus`      | solid, small, focus                                                                                 | none                                                                                                                                                |
| `OutlineMediumDefault` | outline, medium, at rest                                                                            | none                                                                                                                                                |
| `OutlineMediumHover`   | outline, medium, hover                                                                              | Hovering lays `color.surface.hover` over the transparent fill, and pressing the denser `color.surface.selected`                                     |
| `OutlineMediumFocus`   | outline, medium, focus                                                                              | none                                                                                                                                                |
| `OutlineSmallDefault`  | outline, small, at rest                                                                             | none                                                                                                                                                |
| `OutlineSmallHover`    | outline, small, hover                                                                               | none                                                                                                                                                |
| `OutlineSmallFocus`    | outline, small, focus                                                                               | none                                                                                                                                                |
| `WithIcons`            | solid, medium, at rest, with a `startIcon` and an `endIcon` from `packages/perron/icons/`           | The icon spans are `aria-hidden`, and the link's accessible name is the label alone                                                                 |
| `FullWidth`            | outline, medium, at rest, `fullWidth` in a narrow container                                         | The root carries `data-full-width` and is as wide as its container                                                                                  |
| `RenderedLink`         | solid, medium, at rest, with `render` giving a router-style link component that renders an `<a>`    | The root is still one `link` with `pn-LinkButton`, `data-variant` and `data-size`, and the `ref` reaches it                                         |
| `MatchesButton`        | A LinkButton beside a Button with the same label, in each `variant` and `size`, Button in `neutral` | Each pair's computed height, padding, border, radius, font, background and colour are equal (CR-3), and `:visited` changes none of the LinkButton's |

## Do and don't

For a caller using the component, with the reason.

| Do                                                                                                                            | Don't                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Use LinkButton when pressing it goes somewhere: another page, another place in the app, another site                          | Use LinkButton to run an action, such as showing a line or closing a panel, with an `onClick` that prevents the link: that is a Button                 |
| Use Button for an action and LinkButton for navigation, even when they sit side by side and look alike                        | Render a link through Button's `render={<a href="/map" />}`: Base UI gives it `role="button"`, and a screen reader hears a button that navigates       |
| Name where the link goes, in sentence case: "Back to the map", "Open in Rejseplanen"                                          | Write "Click here", "Read more", Title Case or an exclamation mark ([Content design](../content-design.md)): the role already says it is a link        |
| Give a router's link through `render`, such as `render={<Link to="/map" />}`, so the app's navigation runs and the look stays | Wrap a LinkButton in a router link, or a router link in a LinkButton: two nested `<a>` elements are invalid and make two tab stops                     |
| Use a plain `<a>` inside a sentence, where a link is part of the text                                                         | Put a LinkButton in running text: its height and padding break the line                                                                                |
| Keep LinkButton in ink; give the screen's one main action to a `brand` Button                                                 | Restyle a LinkButton in the brand yellow: brand is never a link ([Intents](README.md#intents))                                                         |
| Leave a link out, or show a disabled Button, when there is nowhere to go yet                                                  | Render a LinkButton without `href` or `render`, or fake a disabled one with `opacity`: an `<a>` with no `href` is not a link, and disabled is a colour |
| Use IconButton for a control with an icon and no words                                                                        | Pass only a `startIcon` and no `children`: the icon is `aria-hidden`, so the link has no name                                                          |
