# Surface

A box that sets content on one step of the surface ladder: glass or an opaque panel floating over the map, a raised card inside a panel, or an inset box, each with its fill, edge, radius, shadow and padding from the tokens.

## Anatomy

Penpot page `Components/Surface`. Family: none. Shared parts: none.

The design is deferred (ADR 0010, `docs/adr/0010-unattended-runs-with-design-deferred.md`), so this spec decides the drawing: the layers below are the ones the drawing will name, and the variants are the steps of the surface ladder on [Elevation](../foundations/elevation.md#surfaces). Surface has no Base UI part: it is a box with no behaviour, so its root renders through Base UI's `useRender` hook (`@base-ui/react/use-render`), which gives it the `render` prop.

Surface is not one of the contract's [families](README.md#families): it is the box the ladder is drawn on, which patterns such as a detail panel or a disruption card compose. Its `glass` variant draws the Panels row's treatment (the Popups' glass, `radius.xl`), so a panel a pattern builds from it matches the Dialog and Sheet beside it.

| Part (Penpot layer) | What it is                                                                                                                                       | Base UI part                            | Class        | `slotProps` key |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- | ------------ | --------------- |
| `root`              | The box: a `<div>` with the variant's fill, edge, radius, shadow and padding, holding the caller's content. Penpot's main instance, a flex board | none: a `<div>` rendered by `useRender` | `pn-Surface` | none            |

The content is the caller's: Surface draws no heading, divider or inner part, so the drawing's one layer is `root`, holding a placeholder content slot that the code map does not map to a part.

Surface's one Penpot variant property is `variant`, with the values `raised`, `inset`, `glass` and `opaque` in that order, so `raised` is the default (the contract's first value), and the variants are `Raised`, `Inset`, `Glass` and `Opaque`. They are the four steps of [Elevation](../foundations/elevation.md#surfaces) a box sits on, named by what they look like rather than by their token (`overlay` and `default` would collide with the floating-panel words and with Penpot's `State` value `default`); `raised` comes first because cards inside a panel are the commonest box, and a floating panel is usually a pattern that chooses `glass` on purpose. `color.surface.hover`, `selected`, `inverse` and the tinted intent surfaces are state layers, buttons and messages, not boxes, so they are not variants.

## Base UI parts

Surface imports no Base UI component. It uses two Base UI utilities, at the version pinned in `package.json`: `useRender` (`@base-ui/react/use-render`) for the root and `mergeProps` (`@base-ui/react/merge-props`) to merge the caller's props with its own.

| Base UI part                     | Renders | Perron sets                                                                                                              | Passed through                                                    |
| -------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `useRender` (a hook, not a part) | `<div>` | `defaultTagName: 'div'`, `className` (`pn-Surface` first, then the caller's), `data-variant` from `variant` (CR-1, CR-2) | `render`, `ref`, `children`, `className`, `style`, the rest props |

Base UI already does: swapping the root element for the one `render` gives, keeping the class and data attribute; merging the caller's `ref` with the element's; and merging event handlers, `className` and `style` through `mergeProps`.

Surface renders a `<div>` by default, with no role, and leaves a landmark or region to the caller through `render` (`render={<section aria-labelledby="…" />}`, `<aside>`, `<article>`). Most surfaces are cards and boxes inside a panel, which are not landmarks; a `<section>` or `<aside>` by default would add an unnamed region to every card, and the contract asks every landmark and named region for a name only the caller's heading can give.

## Props

In MUI's layout. Every prop Surface declares gets this description as its JSDoc. It declares `variant`, `children`, `className`, `style` and `ref`, and inherits `render` from `useRender`'s props type as it is, with Base UI's description; a caller renders it as `<section>` or `<aside>` with `aria-labelledby` for a named region. Surface has no `slotProps`, because the contract keys `slotProps` by inner Base UI part and Surface has none; a caller restyles it through `className` on the root.

| Name                 | Type                                         | Default    | Base UI prop         | Description                                                                                                                                                                                                                                                |
| -------------------- | -------------------------------------------- | ---------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `variant`            | `'raised' \| 'inset' \| 'glass' \| 'opaque'` | `'raised'` | none                 | The step of the surface ladder: `raised` for a card inside a panel, `inset` for a box or track set into one, `glass` for a panel floating over the map, `opaque` for a floating panel full of text on a phone, where glass would let the map show through. |
| `render`             | Base UI's `render`                           |            | inherited            | Allows you to replace the component's HTML element with a different tag, or compose it with another component. Accepts a `ReactElement` or a function that returns the element to render.                                                                  |
| `children`           | `ReactNode`                                  |            | none                 | The content the surface holds                                                                                                                                                                                                                              |
| `className`, `style` | React's                                      |            | through `mergeProps` | Reaches the root; `className` is merged after `pn-Surface`                                                                                                                                                                                                 |
| `ref`                | `Ref<HTMLElement>`                           |            | `useRender`'s `ref`  | Reaches the root element, whichever element `render` makes it                                                                                                                                                                                              |

No `size`: padding follows the variant (see [Tokens](#tokens)). No label props: Surface owns no strings.

Surface has no `color`, so no variant is tinted with an intent's surface (`color.surface.success` and the rest). A tinted box says something only colour tells, and colour is never alone ([Accessibility](../foundations/accessibility.md#rules)): a status surface belongs to a component that also gives the word or icon, such as a notice, which can add the tints then. `color` can join Surface later without a break.

## Tokens

Surface is not interactive, so its one design state is rest; each row names the `variant` it applies to. Every variant has the same edge width, so the four share one geometry and swapping variants never shifts the content.

Each variant takes the treatment below: `raised` a `color.surface.raised` card with a `color.border.subtle` edge, `radius.lg` and no shadow; `inset` a `color.surface.inset` box with a transparent edge and `radius.lg`; `glass` the Panels' glass (`color.surface.overlay`, the glass blur and saturation, a `color.border.subtle` edge, `shadow.panel`) at `radius.xl`; and `opaque` the same as glass with `color.surface.default` and no blur. It is [Elevation](../foundations/elevation.md) and [Semantic spacing](../foundations/semantic-spacing.md) as written: floating panels are glass with `shadow.panel` and `radius.xl`, and on phones opaque; cards and inset boxes take `radius.lg`; card and panel edges are `border.width.025` in `color.border.subtle`; an inset box reads without a border; and nothing else casts a shadow.

Surface pads its content by variant, `space.400` for `glass` and `opaque` and `space.300` for `raised` and `inset`, with no prop to change it, so a caller who needs another inset (rows running to the edge, a flush image) sets `padding` through `className` with a `space.*` token. A box with no padding is never used as it comes, and a padding prop would grow a scale before any caller needs one; `space.300` is the gap between parts of a detail panel, and a floating panel one step wider sets its blocks off from the map. A `padding` prop can join later without a break.

| Part   | State                    | Property           | Token                                                                                                                                  |
| ------ | ------------------------ | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `root` | rest, every `variant`    | `color`            | `color.text.primary`                                                                                                                   |
| `root` | rest, every `variant`    | `border-width`     | `border.width.025`                                                                                                                     |
| `root` | rest, every `variant`    | `border-style`     | none: the keyword `solid`                                                                                                              |
| `root` | rest, `variant='raised'` | `background-color` | `color.surface.raised`                                                                                                                 |
| `root` | rest, `variant='raised'` | `border-color`     | `color.border.subtle`                                                                                                                  |
| `root` | rest, `variant='raised'` | `border-radius`    | `radius.lg`                                                                                                                            |
| `root` | rest, `variant='raised'` | `padding`          | `space.300`                                                                                                                            |
| `root` | rest, `variant='raised'` | `box-shadow`       | none: the keyword `none`                                                                                                               |
| `root` | rest, `variant='inset'`  | `background-color` | `color.surface.inset`                                                                                                                  |
| `root` | rest, `variant='inset'`  | `border-color`     | none: the keyword `transparent`, so the edge shows only in forced colours (CR-5)                                                       |
| `root` | rest, `variant='inset'`  | `border-radius`    | `radius.lg`                                                                                                                            |
| `root` | rest, `variant='inset'`  | `padding`          | `space.300`                                                                                                                            |
| `root` | rest, `variant='inset'`  | `box-shadow`       | none: the keyword `none`                                                                                                               |
| `root` | rest, `variant='glass'`  | `background-color` | `color.surface.overlay`                                                                                                                |
| `root` | rest, `variant='glass'`  | `backdrop-filter`  | `effect.glass-blur` and `effect.glass-saturate`: `blur(var(--perron-effect-glass-blur)) saturate(var(--perron-effect-glass-saturate))` |
| `root` | rest, `variant='glass'`  | `border-color`     | `color.border.subtle`                                                                                                                  |
| `root` | rest, `variant='glass'`  | `border-radius`    | `radius.xl`                                                                                                                            |
| `root` | rest, `variant='glass'`  | `padding`          | `space.400`                                                                                                                            |
| `root` | rest, `variant='glass'`  | `box-shadow`       | `shadow.panel`                                                                                                                         |
| `root` | rest, `variant='opaque'` | `background-color` | `color.surface.default`                                                                                                                |
| `root` | rest, `variant='opaque'` | `border-color`     | `color.border.subtle`                                                                                                                  |
| `root` | rest, `variant='opaque'` | `border-radius`    | `radius.xl`                                                                                                                            |
| `root` | rest, `variant='opaque'` | `padding`          | `space.400`                                                                                                                            |
| `root` | rest, `variant='opaque'` | `box-shadow`       | `shadow.panel`                                                                                                                         |

Every text colour reaches 4.5:1 on `color.surface.default`, `raised` and `inset` in both themes, as [Accessibility](../foundations/accessibility.md#text-on-surfaces) measures, except `color.text.tertiary`, which stays for hints beside stronger text. The build measures text on the three opaque surfaces only. `color.surface.overlay` is `color.surface.default`'s colour at 0.9 opacity in light and 0.88 in dark, behind the glass blur, so text on `glass` reads close to its contrast on `color.surface.default`.

## Keyboard and ARIA

Surface is a box: it takes no focus, and no key does anything. Focus moves through the caller's content in reading order. A caller who makes it a link or button through `render` brings that element's own keys.

| Key  | Does                                                          | From   |
| ---- | ------------------------------------------------------------- | ------ |
| none | Surface is not focusable or operable; Tab reaches its content | Perron |

| Element | Role                    | Accessible name from                                                                                                               | States announced |
| ------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| `root`  | none: a generic `<div>` | Not named. Through `render`, a `<section>`, `<aside>` or `<article>` takes its name from the caller's heading by `aria-labelledby` | none             |

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: the surface tells the eye only grouping and depth, which the content's own headings and order tell the ear; Surface carries no colour that means a state (no `color` prop).
- [ ] Every landmark and named region has an accessible name: the root is a generic `<div>` and no landmark; a caller who renders it as `<section>`, `<aside>` or `<article>` names it with `aria-labelledby` pointing at its heading, as the `Nested` story shows.
- [ ] Every default label can be overridden: none here; Surface owns no label.
- [ ] Every shape the type accepts renders, in every variant: `children` as a string, an element and a list all render in each of the four variants, shown by the variant stories.
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here; Surface does not animate or collapse.
- [ ] Native semantics first: a `<div>` with no role and no ARIA; the caller picks `<section>`, `<aside>` or `<article>` through `render` when the box is a region.
- [ ] Focus moves in reading order and returns on close: Surface takes no focus and does not reorder its content; it does not clip, so a focused child's ring shows in full (CR-4).
- [ ] Every target is at least `size.target-min` square: no target; Surface is not pressed.
- [ ] Loops stop when the system asks for less motion: none here; Surface has no motion.

## Owned strings

No owned strings: Surface shows and announces no words of its own; every word inside it is the caller's.

## Component rules

- **CR-1.** The root renders through `useRender` with `defaultTagName: 'div'` and `mergeProps`: Surface's own props (`className` starting with `pn-Surface`, `data-variant`) win over the caller's rest props, and `variant` is taken out of the rest before the merge, so it never reaches the DOM.
- **CR-2.** The root always carries `data-variant` with the `variant` value, `raised` by default, and the CSS reads the treatment from it: `.pn-Surface[data-variant='glass']`.
- **CR-3.** Surface sets no `display`, `inline-size`, `block-size`, `margin`, `gap` or typography: it is a block box that sizes to its container, and its content and the caller's layout decide the rest. It sets `color` to `color.text.primary` so content reads on every variant in both themes.
- **CR-4.** Surface never sets `overflow`: content stays unclipped, so a focused child's ring, drawn `focus.offset` outside it, is never cut at the edge. A caller who must clip (a scrolling panel body) does so on its own inner element.
- **CR-5.** Every variant has a `border.width.025` edge, `inset` a transparent one, so in `(forced-colors: active)`, where the system paints borders and drops shadows and translucent fills, every surface keeps a visible edge with no rule of its own.
- **CR-6.** `glass` is for a panel floating over the map. Surface has no breakpoint query, as the contract's [Media queries](README.md#media-queries) allow none: a caller whose panel fills with text on a phone chooses `opaque` there, as [Elevation](../foundations/elevation.md#surfaces) says.
- **CR-7.** Surfaces nest down the ladder: `raised` and `inset` sit inside `glass` or `opaque`, and `inset` inside `raised`. `glass` and `opaque` are never nested in another surface, and a `raised` or `inset` surface casts no shadow, since only floating panels do.

## Stories

No Penpot design yet, so the stories are named by the variant names the design will have: the `variant` value in PascalCase (the Conventions of `penpot/README.md`), and `Nested` shows the ladder together. Each `play` test reads the DOM and the accessibility tree, not the pixels.

| Story    | Shows                                                                                                                                               | `play` test                                                                                                                                                                        |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Raised` | `variant='raised'`, a card holding a heading, a line of text and a Button, on `color.surface.default`                                               | The root is a `<div>` with `pn-Surface` and `data-variant='raised'`, no role and no name; Tab moves straight to the Button inside it                                               |
| `Inset`  | `variant='inset'`, a box holding a line of text, on `color.surface.raised`                                                                          | `data-variant` is `inset`                                                                                                                                                          |
| `Glass`  | `variant='glass'`, a panel holding a heading and text, over a busy coloured backdrop that shows the blur                                            | `data-variant` is `glass`                                                                                                                                                          |
| `Opaque` | `variant='opaque'`, the same panel over the same backdrop                                                                                           | `data-variant` is `opaque`                                                                                                                                                         |
| `Nested` | A `glass` panel rendered as `<section aria-labelledby>` with its heading, holding a `raised` card that holds an `inset` box, over the busy backdrop | The outer root is a `region` named by its heading, keeps `pn-Surface` and `data-variant='glass'`; the inner surfaces carry `raised` and `inset`; a `ref` on each lands on its root |

## Do and don't

For a caller using the component, with the reason.

| Do                                                                                                                         | Don't                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Use `glass` for a panel that floats over the map, and `opaque` for one full of text on a phone, as Elevation says.         | Use `glass` over a plain background or inside another panel: the blur has nothing to soften, and glass on glass loses its edge.                |
| Put `raised` cards and `inset` boxes inside a panel, stepping down the ladder.                                             | Nest a floating `glass` or `opaque` surface inside another surface, or add a shadow to a card with `className`: only floating panels cast one. |
| Render it as `<section>` or `<aside>` with `aria-labelledby` on its heading when the box is a region someone navigates to. | Give every card a landmark element: a screen of unnamed regions is noisier than plain boxes.                                                   |
| Use Dialog or Sheet for a panel that opens and closes over the screen, since they bring the focus, Esc and scrim.          | Build a dialog from a `glass` Surface: it would look right and trap no focus.                                                                  |
| Say a state in words or with an icon inside the surface.                                                                   | Tint a surface with a status colour through `className` to mean warning or success: colour is never alone.                                     |
| Change the padding through `className` with a `space.*` token when rows must run to the edge.                              | Set raw pixel padding, radius or colours on it, which leave the ladder and the themes behind.                                                  |
