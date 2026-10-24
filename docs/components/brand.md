# Brand

The Mylder mark beside the wordmark "mylder", drawn in both themes from the tokens, for the brand slot of a top bar or a kiosk bar.

## Anatomy

Penpot page `Components/Brand`, not drawn yet: the design is deferred (`docs/adr/0010-unattended-runs-with-design-deferred.md`), so this spec decides the drawing from [Logos](../foundations/logos.md), [Typography](../foundations/typography.md), [Layout](../foundations/layout.md) and the tokens. Family: none. Shared parts: `VisuallyHidden`, which holds the brand name when the mark stands alone.

The mark is drawn inline as an `<svg>` whose three shapes take their colours from the tokens in CSS, not from `packages/perron/logos/mylder-mark.svg` as an image. A file can't follow the theme ([Logos](../foundations/logos.md#the-mark)), and the contract keeps `[data-theme]` selectors and `prefers-color-scheme` queries out of component CSS ([CSS](README.md#css)), so an inline mark reading `color.transit.mode.bus`, `color.transit.line.a` and `color.text.primary` is the one way the component shows the right mark on either ground. Its geometry is the file's (CR-3).

| Part (Penpot layer) | What it is                                                                                                                            | Base UI part                                   | Class                               | `slotProps` key |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------- | --------------- |
| `root`              | The lockup: an inline row holding the mark and then the wordmark                                                                      | none: a `<span>` rendered by `useRender`       | `pn-Brand`                          | none            |
| `mark`              | The Mylder mark, an inline `<svg>` of the logo file's 27 × 19 viewBox, hidden from screen readers                                     | none: a plain `<svg>`, no behaviour to borrow  | `pn-Brand-mark`                     | none            |
| `bus`               | The mark's bus dot: the left circle, filled                                                                                           | none: a `<circle>` inside `mark`               | `pn-Brand-bus`                      | none            |
| `sTog`              | The mark's S-tog dot: the upper circle, filled                                                                                        | none: a `<circle>` inside `mark`               | `pn-Brand-sTog`                     | none            |
| `ring`              | The mark's estimated ring: the right circle, stroked and unfilled                                                                     | none: a `<circle>` inside `mark`               | `pn-Brand-ring`                     | none            |
| `wordmark`          | The brand name, "Mylder", set lowercase in `typography.heading-md` bold. Only with `variant='full'`                                   | none: a plain `<span>`, no behaviour to borrow | `pn-Brand-wordmark`                 | none            |
| `label`             | With `variant='mark'`, the brand name for screen readers only, in place of the wordmark. Never seen, so a drawing has no layer for it | none: the `VisuallyHidden` shared part         | `pn-VisuallyHidden`, the part's own | none            |

Brand has one variant property, `variant`, with `full` (the mark and the wordmark, the default) and `mark` (the mark alone, the brand name read to screen readers through `VisuallyHidden`). Hiding it under `breakpoint.compact-phone` is left to the screen or pattern that places it, since a component reads no `breakpoint.*` token and sizes to its container: [Logos](../foundations/logos.md#usage) keeps the mark alone for where space is tight, and [Layout](../foundations/layout.md#breakpoints)'s "the brand mark goes" is the screen's rule, applied by its caller.

## Base UI parts

Brand imports no Base UI component: the registry gives it no `baseUiParts`, and Base UI has nothing that draws a logo. It uses two Base UI utilities, at the version pinned in `package.json`: `useRender` (`@base-ui/react/use-render`) for the root, which gives it the contract's `render` prop, and `mergeProps` (`@base-ui/react/merge-props`) to merge the caller's props with its own.

| Base UI part                     | Renders  | Perron sets                                                                                                                           | Passed through                                                            |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `useRender` (a hook, not a part) | `<span>` | `defaultTagName: 'span'`; `className` (`pn-Brand` first, then the caller's); `data-variant` from `variant`; the children (CR-1, CR-2) | `render`, `ref`, `className`, `style` and the `<span>`'s other attributes |

The root is a `<span>`, so the lockup is phrasing content and fits inside a link, a heading or a button the caller renders it as.

Base UI already does: swapping the root element for the one `render` gives, keeping the class, data attribute and children; merging the caller's `ref` with the element's; and merging event handlers, `className` and `style` through `mergeProps`, the caller's other props overwriting the component's.

## Props

In MUI's layout. Every prop here gets this description as its JSDoc. Brand takes no `children`: it draws its own mark and words, so the props type leaves `children` out. It has no `slotProps`, because the contract keys `slotProps` by inner Base UI part and Brand has none; a caller restyles it through `className` on the root.

| Name             | Type                   | Default      | Base UI prop | Description                                                                                                                                                                               |
| ---------------- | ---------------------- | ------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `variant`        | `'full' \| 'mark'`     | `'full'`     | none         | `full` sets the mark beside the wordmark, as the brand appears by default; `mark` shows the mark alone, for where space is tight, with the brand name read to screen readers.             |
| `render`         | Base UI's `render`     |              | inherited    | Allows you to replace the component's HTML element with a different tag, or compose it with another component. Accepts a `ReactElement` or a function that returns the element to render. |
| `brandNameLabel` | `string`               | The locale's | none         | Overrides "Mylder"                                                                                                                                                                        |
| `className`      | `string`               |              | none         | Merged after `pn-Brand` on the root                                                                                                                                                       |
| `style`          | `CSSProperties`        |              | none         | Reaches the root                                                                                                                                                                          |
| `ref`            | `Ref<HTMLSpanElement>` |              | none         | Reaches the root                                                                                                                                                                          |

Brand comes in one size, with no `size` prop: the mark at its drawn size, 27 × 19 px, from the inline `<svg>`'s own `width` and `height` attributes as the logo file sets them, and the wordmark in `typography.heading-md`. [Logos](../foundations/logos.md#usage) sets the drawn size as the smallest the mark may be and gives the wordmark one role, no token holds a larger mark or wordmark, and a larger brand for the kiosk bar can join as a `size` value through the `design-tokens` skill when that pattern needs it.

## Tokens

One row per part, variant and property. Brand is not interactive, so its only design state is rest; rendered as a link through `render`, its focus ring is the one `perron.css` already draws on `:focus-visible`.

| Part                         | State | Property                    | Token                                                         |
| ---------------------------- | ----- | --------------------------- | ------------------------------------------------------------- |
| `root`                       | rest  | `display`                   | none: `inline-flex`, `align-items: center`                    |
| `root`                       | rest  | `gap`                       | `space.200`                                                   |
| `root`                       | rest  | `min-block-size`            | `size.target-min`                                             |
| `mark`                       | rest  | `inline-size`, `block-size` | none: the `<svg>`'s own `width="27"` and `height="19"` (CR-3) |
| `bus`                        | rest  | `fill`                      | `color.transit.mode.bus`                                      |
| `sTog`                       | rest  | `fill`                      | `color.transit.line.a`                                        |
| `ring`                       | rest  | `fill`                      | none: `none`                                                  |
| `ring`                       | rest  | `stroke`                    | `color.text.primary`                                          |
| `wordmark`, `variant='full'` | rest  | `font`                      | `typography.heading-md`                                       |
| `wordmark`, `variant='full'` | rest  | `font-weight`               | `font.weight.bold`                                            |
| `wordmark`, `variant='full'` | rest  | `letter-spacing`            | `typography.heading-md-tracking`                              |
| `wordmark`, `variant='full'` | rest  | `color`                     | `color.text.primary`                                          |
| `wordmark`, `variant='full'` | rest  | `text-transform`            | none: `lowercase`                                             |
| `label`, `variant='mark'`    | rest  | none                        | none: the `VisuallyHidden` part's own styles, never seen      |

The gap between the mark and the wordmark is `space.200`, and the wordmark's colour is `color.text.primary`, the ring's ink. [Logos](../foundations/logos.md) names neither; `space.200` (8 px) is close to the ring's width (8.9 px), the clear space the mark keeps from everything else, and the mark's one neutral colour is `color.text.primary`.

The root keeps a `min-block-size` of `size.target-min`, so the lockup is at least 24 px tall when a caller renders it as a link to the start screen: the wordmark's line is 23 px (20 px at 1.15) and the mark 19 px, a pixel short of the contract's smallest target, and the extra pixel changes nothing in a 46 px top bar.

The mark's colours are the logo file's, held by the tokens [Logos](../foundations/logos.md#the-mark) names: bus `#D99A00` light and `#F2B630` dark, S-tog A `#00A1DE` in both, the ring `#12181B` light and `#EBEEEB` dark.

## Keyboard and ARIA

No Base UI part, so nothing from Base UI here. Brand takes no focus of its own; a caller that renders it as a link makes it one stop in the tab order.

| Key   | Does                                                                                                       | From                                         |
| ----- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| None  | The lockup takes no focus and no keys; Tab passes it by                                                    | Perron                                       |
| Enter | Rendered as a link (`render={<a href="/" />}`), follows it; Tab focuses it and `perron.css` draws the ring | The browser, through the caller's `<a href>` |

| Element    | Role                                                           | Accessible name from                                                                                         | States announced |
| ---------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------- |
| `root`     | None: a `<span>`; `link` when the caller renders an `<a href>` | Its text: the `wordmark`, or with `variant='mark'` the `label`, both the `brandName` owned string ("Mylder") | None             |
| `mark`     | None: `aria-hidden="true"`, hidden                             | None: the brand name beside it, seen or hidden, says it                                                      | None             |
| `wordmark` | None: text                                                     | Its text, "Mylder", shown lowercase                                                                          | None             |
| `label`    | None: text, visually hidden                                    | Its text, "Mylder"                                                                                           | None             |

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: the eye reads the brand from the mark and the wordmark; the ear hears the brand name, from the wordmark with `variant='full'` and from the `VisuallyHidden` label with `variant='mark'`, so neither variant is silent
- [ ] Every landmark and named region has an accessible name: none here, the lockup is not a region; the top bar or kiosk bar that holds it names its own
- [ ] Every default label can be overridden: `brandNameLabel` overrides "Mylder", in the wordmark and in the hidden label alike
- [ ] Every shape the type accepts renders, in every variant: both `variant` values, each with and without `brandNameLabel`, and each as a `<span>` and as a link through `render`, shown by the `Full`, `Mark` and `Link` stories
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here, nothing animates or collapses; the `aria-hidden` mark is a picture, not a copy
- [ ] Native semantics first: a plain `<span>` with no role; the caller's `<a href>` through `render` for a link, never `role="link"` or `role="img"`
- [ ] Focus moves in reading order and returns on close: nothing takes focus but a caller's link, which sits in the tab order where it sits in the page
- [ ] Every target is at least `size.target-min` square: rendered as a link, the lockup is at least `size.target-min` tall and wider than tall in both variants (the mark alone, 27 px)
- [ ] Loops stop when the system asks for less motion: none here, nothing moves

## Owned strings

The brand name is a word the component shows and announces that the caller doesn't give, so it is an owned string: `expectOwnedStrings` fails a text run that is neither in the dictionary nor the caller's.

| Key         | English  | Override         | Seen or heard where                                                                                                             |
| ----------- | -------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `brandName` | `Mylder` | `brandNameLabel` | The `wordmark`, shown lowercase as "mylder" with `variant='full'`; the `VisuallyHidden` label, read only, with `variant='mark'` |

The brand name is a new owned-string key, `brandName`, with "Mylder" in all four locales (a name, not translated), shown lowercase through `text-transform: lowercase` on the wordmark rather than written lowercase in the dictionary. The logo file's title and the docs write the name "Mylder", so screen readers meet a capitalised name, the wordmark still reads "mylder" as [Logos](../foundations/logos.md#usage) asks, and a `brandNameLabel` override is lowercased the same way.

## Component rules

- **CR-1.** The root renders through `useRender` with `defaultTagName: 'span'`, so `render`, `className`, `style` and `ref` behave as the contract's [Root](README.md#root) and [Customising](README.md#customising) say, with no Base UI component underneath. The rest props are merged first, so `pn-Brand` and `data-variant` win over them; a `render` element's own props are merged last, as Base UI does.
- **CR-2.** The root always carries `data-variant`, `'full'` included, and CSS selects on it: `.pn-Brand[data-variant='full'] .pn-Brand-wordmark`. Its children are the `mark`, then, with `full`, the `wordmark`, or, with `mark`, the `VisuallyHidden` `label`, both holding the `brandName` string with `brandNameLabel` laid over it through `useOwnedStrings({ brandName: brandNameLabel })`.
- **CR-3.** The mark's geometry is `packages/perron/logos/mylder-mark.svg`'s, exactly: `viewBox="0 0 27 19"`, `width="27"`, `height="19"`; the bus dot at (5.5, 12.5), r 4.3; the S-tog dot at (13.5, 5.5), r 4.3; the ring at (21.5, 12.5), r 3.6, stroke width 1.7. Its colours are not in the markup: each shape's `fill` or `stroke` is set in `Brand.css` from the tokens in [Tokens](#tokens), so the mark follows the theme. A test holds the inline circles to the file's, so the two never drift apart.
- **CR-4.** The mark is `aria-hidden="true"` and `focusable="false"`, with no `<title>`: the brand name in the wordmark or the label is the one thing a screen reader hears, once.
- **CR-5.** Keep the mark as drawn ([Logos](../foundations/logos.md#usage)): no prop or class recolours, outlines or rearranges its three shapes, and the mark never shrinks below its drawn size in a flex row (`flex: none`).
- **CR-6.** In `(forced-colors: active)`, the bus and S-tog dots fill and the ring strokes in `CanvasText`, and the wordmark takes `CanvasText`, so the mark stays visible when the system replaces colours ([Accessibility](../foundations/accessibility.md#what-a-person-checks)): the ring's `color.text.primary` can vanish on a forced dark `Canvas`, the three shapes still tell the mark apart by their place, fill and ring, and StationIcon does the same.
- **CR-7.** Brand reads no `breakpoint.*` token and no media query beyond the contract's three: the screen or pattern that places it hides it, or picks `variant='mark'`, at its own breakpoints, such as [Layout](../foundations/layout.md#breakpoints)'s `breakpoint.compact-phone`.

## Stories

No Penpot design yet, so the stories are named by the variant names the design will have: `variant`, each value in PascalCase (the Conventions of `penpot/README.md`). Each renders on a `color.surface.raised` ground, as in a top bar's glass group; the build's light and dark Storybook themes show both marks.

| Story  | Shows                                                                              | `play` test                                                                                                                                       |
| ------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Full` | `variant='full'`: the mark beside the wordmark "mylder"                            | The root has `data-variant="full"` and the text "Mylder"; the mark is `aria-hidden`; Tab passes the lockup by                                     |
| `Mark` | `variant='mark'`: the mark alone                                                   | No wordmark is shown; the `VisuallyHidden` label holds "Mylder", so the root's text is still the brand name                                       |
| `Link` | `variant='full'` rendered as a link to the start screen, `render={<a href="/" />}` | The page has a link named "Mylder" (case-insensitive); Tab focuses it, its box is at least `size.target-min` tall, and Shift+Tab moves focus back |

## Do and don't

For a caller using the component, with the reason.

| Do                                                                                                                             | Don't                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Use Brand wherever the Mylder brand appears in an interface, so the mark follows the theme                                     | Put `mylder-mark.svg` in an `<img>` on a themed ground: a file can't follow the theme, so the ring disappears in dark                        |
| Keep `variant='full'`, and switch to `variant='mark'` only where space is tight                                                | Show the wordmark alone, or set "mylder" in text beside an icon: the lockup is the mark and the wordmark together                            |
| Hide the whole Brand, or pick `variant='mark'`, at the screen's own breakpoint, such as `breakpoint.compact-phone`             | Hide parts of it with `className`, which can leave a mark that no screen reader hears or a wordmark without its mark                         |
| Render it as a link to the start screen with `render={<a href="/" />}`, so the name and the link are one stop in the tab order | Wrap it in a `<button>` with its own `aria-label`, or give the link a second name: the brand name is already its accessible name             |
| Keep at least the ring's width of clear space around it, as [Logos](../foundations/logos.md#usage) asks                        | Resize, recolour or restyle the mark with `className`, which breaks its drawn size and turns its colours, which are data states, into others |
