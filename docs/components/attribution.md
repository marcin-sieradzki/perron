# Attribution

Attribution is the map's credits: one small strip of caption text, laid on glass in a corner of the map, that names where the map and its data come from, such as "Map data © OpenStreetMap contributors", with the caller's links to each source.

## Anatomy

Penpot page `Components/Attribution`. Family: none (the contract's [Families](README.md#families) have no strip of small print; Attribution borrows the Popups' glass fill and nothing else of theirs). Shared parts: none (every word is the caller's, and nothing is told by an icon or a shape).

The design is deferred (ADR 0010, `docs/adr/0010-unattended-runs-with-design-deferred.md`): there is no read-back, code map or export, and this spec decides what the drawing would, from the contract, the foundations, the tokens and the Base UI utilities the other boxes with no behaviour use ([Kbd](kbd.md), [Surface](surface.md)). `packages/perron/components.json` gives Attribution no `baseUiParts` and no `dependsOn`. The extracted prototype component is not in any branch this run can reach. The drawing has one board, `root`, holding one text layer with the caller's credits, a link drawn as an underlined run inside it; no variant property, so its one variant is `Default`; and no `State` property, since the strip itself is never interactive (CR-2) and the links' hover and focus are the design states the Tokens table gives them.

[Typography](../foundations/typography.md) gives `typography.caption` to "map credits", and [Layout](../foundations/layout.md#stacking) stacks the "attribution" with the legend, the map controls and the scale at `z-index.map-controls`. That token is in the pattern row of the contract's [Token families](README.md#token-families), not the component's, so Attribution places nothing: the screen that holds the map puts it in its corner and stacks it (CR-6).

The root is the native `<small>`, rendered through `useRender` with `defaultTagName: 'small'`. HTML defines `<small>` as small print, naming copyright and attribution among its uses, and it carries no role, so a screen reader reads the credits as text in place; it holds phrasing content, which every credit is: text, links and "©". A `<p>` would read as a paragraph of the page, and a `<footer>` or `<aside>` would add a landmark that needs a name the caller has no reason to give.

| Part (Penpot layer) | What it is                                                                                                                                                                                                                                     | Base UI part                                   | Class            | `slotProps` key |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------- | --------------- |
| `root`              | The strip: a glass box holding the caller's `children`, the credits, in `typography.caption`. A link in them is the caller's own `<a href>`, styled by the root's rule for links (CR-4), with no class, element or `slotProps` key of its own. | none: a `<small>` rendered through `useRender` | `pn-Attribution` | none            |

## Base UI parts

No Base UI component: `baseUiParts` is empty in `packages/perron/components.json`, and a strip of credits has no behaviour to borrow. The root renders through Base UI's `useRender` hook, from `@base-ui/react/use-render` at the version pinned in `packages/perron/package.json`, so the contract's `render` prop works, and the component's props are merged with `mergeProps` from `@base-ui/react/merge-props`, as Kbd and Surface do.

| Base UI part                     | Renders   | Perron sets                                                                                                                       | Passed through                                                                        |
| -------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `useRender` (a hook, not a part) | `<small>` | `defaultTagName: 'small'`; `ref`; `props`: `mergeProps(rest, own)`, where `own` is `className: 'pn-Attribution'` and nothing else | `render`, `ref`, `children`, `className`, `style` and every other `<small>` attribute |

Base UI already does: swapping the root element for the `render` element or function while keeping Perron's class and `ref`, merging the caller's `ref` with the element's under React 19, and joining `className` strings, merging `style` objects and chaining event handlers in `mergeProps`. Attribution adds no behaviour of its own; the caller's links follow theirs when pressed, as any link does.

## Props

In MUI's layout. Every prop here gets this description as its JSDoc. No slots: the strip has no inner part.

| Name        | Type               | Default | Base UI prop | Description                                                                                                                                                                                                                                     |
| ----------- | ------------------ | ------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `children`  | `ReactNode`        | none    | none         | The credits, as each source asks to be credited, with a link to each source's terms where it has one: "Map data © OpenStreetMap contributors". Phrasing content only: text, links and inline elements. Required: an empty strip credits no one. |
| `render`    | Base UI's `render` |         | inherited    | Allows you to replace the component's HTML element with a different tag, or compose it with another component. Accepts a `ReactElement` or a function that returns the element to render.                                                       |
| `className` | `string`           |         | none         | Joined after `pn-Attribution` on the root                                                                                                                                                                                                       |
| `style`     | `CSSProperties`    |         | none         | Reaches the root                                                                                                                                                                                                                                |
| `ref`       | `Ref<HTMLElement>` |         | none         | Reaches the root element                                                                                                                                                                                                                        |

`AttributionProps` extends `useRender.ComponentProps<'small'>` without its `children`, which it declares again as required, as Kbd's and LineBadge's props do; `render` is inherited from `useRender` as it is, with Base UI's JSDoc, and `AttributionProps` does not declare it. `className`, `style`, `ref` and the other `<small>` attributes reach the root, as the contract's [Root](README.md#root) says.

`children` is required, with no default: the credits are the sources' own words, which only the screen that uses those sources knows, and an empty glass strip in the map's corner says nothing.

Attribution ships one look, with no `variant`, `color` or `size` prop. A map has one strip of credits, in one place, and [Typography](../foundations/typography.md) gives map credits one role, `typography.caption`; credits carry no meaning a colour could add; and the props API only grows, so a prop can join when a second look is needed.

Attribution has no compact state, such as an "i" button that shows the credits only when pressed: the strip is always the full credits, wrapping onto more lines in a narrow container. A button that shows and hides the credits would be a disclosure with an owned label, a Base UI part the registry entry doesn't name, and a second look the deferred design doesn't draw; at `typography.caption` one or two sources fit a phone's corner on a line or two; and a `compact` prop can join later without a break.

## Tokens

One row per part, state and property. Attribution has one part, `root`, whose design state is rest; the caller's links inside it take rest, hover and focus, from the root's rule for links (CR-4). Every colour is one of the tokens [Semantic colours](../foundations/semantic-colours.md) gives for both themes, so the strip needs no rule for the dark theme.

The strip is glass with no edge and no shadow: a `color.surface.overlay` fill with a backdrop of `effect.glass-blur` and `effect.glass-saturate`, `radius.xs` corners, and padding of `space.050` on the block axis and `space.150` on the inline axis. Text over the moving map needs a fill under it, and [Elevation](../foundations/elevation.md#surfaces) makes what floats over the map glass; with no `color.border.subtle` edge and no `shadow.panel`, which Elevation keeps for floating panels, the credits recede behind the map controls beside them, as the brand's "calm" asks; `radius.xs` is the radius for small marks, and a strip one caption line tall is too small for a panel's `radius.lg` or `radius.xl`, while a pill's `radius.full` would read as a chip to press; and `space.050` and `space.150` keep the strip about 22 px tall, a line of `typography.caption` and a little, so it covers as little map as it can.

The credits' text is `color.text.secondary`, not `color.text.tertiary`. Credits are supporting text, which [Semantic colours](../foundations/semantic-colours.md#text) gives to secondary; tertiary misses 4.5:1 on purpose and is only for hints next to stronger text, while the credits stand alone in the corner and some sources' terms ask that the credit be legible. Secondary reaches 7.63:1 on `color.surface.default` in light and 7.80:1 in dark ([Accessibility](../foundations/accessibility.md#text-on-surfaces)), and the overlay is that surface at 0.9 and 0.88 over the map.

A link in the credits keeps the credits' colour, underlined in every state, takes `color.text.primary` on hover, and looks the same when visited, through one rule for `.pn-Attribution :any-link`. The browser's blue and purple would be the only hues in the interface around the map, which the brand keeps ink, glass and neutral; the underline marks the link where colour alone may not ([Accessibility](../foundations/accessibility.md#rules), "Colour never alone"), and `color.text.brand` is never a link; a darker ink on hover is the step [Tabs](tabs.md) takes from secondary to primary; and a visited credit is no different from one not yet followed. The rule names the root's class and then the links inside it, a descendant selector, as `.pn-Sheet-content > :first-child` does in Sheet, because the links are the caller's elements and have no class of Perron's.

| Part                     | State                | Property                                       | Token                                                                                                                                       |
| ------------------------ | -------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `root`                   | rest                 | `background-color`                             | `color.surface.overlay`                                                                                                                     |
| `root`                   | rest                 | `backdrop-filter`                              | `effect.glass-blur` (blur) and `effect.glass-saturate` (saturate)                                                                           |
| `root`                   | rest                 | `border`                                       | none: no edge, so the strip recedes behind the map controls                                                                                 |
| `root`                   | rest                 | `box-shadow`                                   | none: Elevation keeps `shadow.panel` for floating panels                                                                                    |
| `root`                   | rest                 | `border-radius`                                | `radius.xs`                                                                                                                                 |
| `root`                   | rest                 | `padding-block`                                | `space.050`                                                                                                                                 |
| `root`                   | rest                 | `padding-inline`                               | `space.150`                                                                                                                                 |
| `root`                   | rest                 | `color`                                        | `color.text.secondary`                                                                                                                      |
| `root`                   | rest                 | `font`                                         | `typography.caption`                                                                                                                        |
| `root`                   | rest                 | `letter-spacing`                               | `typography.caption-tracking`, the role's twin                                                                                              |
| `root`                   | rest                 | `overflow-wrap`                                | none: the keyword `anywhere`, so a long word, a Danish compound or a source's name, breaks in a narrow corner rather than overflowing it    |
| `root`, a link inside it | rest                 | `color`                                        | none: `inherit`, the root's `color.text.secondary`, `:visited` included                                                                     |
| `root`, a link inside it | rest                 | `text-decoration-line`                         | none: the keyword `underline`, in every state                                                                                               |
| `root`, a link inside it | hover                | `color`                                        | `color.text.primary`, inside `@media (hover: hover)`                                                                                        |
| `root`, a link inside it | focus                | `outline`                                      | none: the ring `perron.css` draws on `:focus-visible`, `focus.width` in `color.border.focus` at `focus.offset`                              |
| `root`                   | rest, forced colours | `background-color`, `color`, `backdrop-filter` | none: Windows' contrast themes paint the strip `Canvas`, its text `CanvasText` and its links `LinkText`, and the links keep their underline |

The strip is one line of `typography.caption`, 12 px at a line height of 1.5, so 18 px, and `space.050` above and below it: 22 px tall, the height of `size.badge`, a line badge. The text and the links change colour at once, with no transition: no `duration.*` token is given to a link's hover, and the strip has no motion.

## Keyboard and ARIA

Attribution adds no keys and no tab stop of its own: the strip is not focusable (CR-2). Each of the caller's links is a tab stop where it sits in the credits, in reading order, and works as a link does.

| Key   | Does                                              | From                                  |
| ----- | ------------------------------------------------- | ------------------------------------- |
| Tab   | Moves focus to the next of the caller's links     | Perron, through the native `<a href>` |
| Enter | Follows the focused link to the source it credits | Perron, through the native `<a href>` |

| Element               | Role                                                              | Accessible name from              | States announced                     |
| --------------------- | ----------------------------------------------------------------- | --------------------------------- | ------------------------------------ |
| `root`                | none: a `<small>`, which has no ARIA role and is read as its text | Its text, the caller's `children` | none                                 |
| A link in the credits | `link`, the caller's `<a href>`                                   | Its text                          | visited, as the browser announces it |

A screen reader reads the credits in place, as written, "copyright" for "©". Attribution adds no `aria-label`, no heading and no region: the credits' text is all there is to hear, and a named region around one line of small print would be a landmark with nothing to find.

Attribution owns no strings: no "Map credits" or "Sources" label is seen or heard before the credits. The credits name their sources themselves, "Map data © OpenStreetMap contributors", so a label in front of them would say again what they say; a label heard only by screen readers would need a region to name, which the strip doesn't make; and an owned word can join later with its `*Label` prop.

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: the glass only sets the credits apart from the map; the credits are text, read in place, and a link is told by its underline to the eye and by its `link` role to the ear.
- [ ] Every landmark and named region has an accessible name: none here; the `<small>` is not a landmark or a region.
- [ ] Every default label can be overridden: no owned strings, so no `*Label` props.
- [ ] Every shape the type accepts renders, in every variant: `children` renders as a string, an element and a list alike, inside the one `<small>` with `pn-Attribution` first; `Attribution.test.tsx` checks all three.
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here; the strip has no motion and never collapses.
- [ ] Native semantics first: the native `<small>` for small print, and the caller's native `<a href>` for each link, with no ARIA.
- [ ] Focus moves in reading order and returns on close: nothing takes focus but the caller's links, in the order they are written; nothing opens or closes.
- [ ] Every target is at least `size.target-min` square: a link in the credits is in a sentence, the inline exception of WCAG 2.2's target size (2.5.8), so its height is the caption's line; the strip itself is never pressed.
- [ ] Loops stop when the system asks for less motion: none here; the strip has no motion.

## Owned strings

No owned strings: every word of the credits, and every link's text, is the caller's `children`, and Attribution announces nothing else.

## Component rules

- **CR-1.** The root is the native `<small>`, rendered through `useRender` with `defaultTagName: 'small'`, with `pn-Attribution` first in its `className` and the caller's after. It sets no role, no ARIA attribute and no data attribute, since it has no `variant`, `color` or `size` prop.
- **CR-2.** The strip is never interactive: no hover, focus, pressed or selected look of its own, no tab stop and no role. Only the caller's links inside it are pressed, and they keep the browser's behaviour.
- **CR-3.** The strip sizes to its text and to its container: `display: inline-block` and `max-inline-size: 100%`, so it is as wide as its credits and never wider than what holds it, and its text wraps onto more lines, breaking a long word with `overflow-wrap: anywhere`, rather than overflowing a narrow corner.
- **CR-4.** One rule styles the caller's links, `.pn-Attribution :any-link`: `color: inherit` in every state but hover, `:visited` included, `text-decoration-line: underline` in every state, and `color.text.primary` on hover inside `@media (hover: hover)`. It sets no outline, so `perron.css`'s focus ring shows on `:focus-visible`, and no `text-decoration-color`, so the underline follows the text's colour.
- **CR-5.** The CSS reads only the component layer's [token families](README.md#token-families), with no `opacity`, no `text-transform`, no transition and no `[data-theme]` selector: the credits read in the case the caller wrote them, in both themes through the semantic tokens.
- **CR-6.** Attribution places nothing: no `position`, `inset`, `z-index` or `margin`. The screen that holds the map puts it in a corner of the map with `size.panel-gap` from the edge and stacks it at `z-index.map-controls`, the pattern row's tokens, as [Layout](../foundations/layout.md#stacking) stacks it with the legend, the map controls and the scale.

## Stories

One per variant the deferred design will draw. Attribution has no variant property, so its one variant is `Default`; `PlainText` and `Wrapping` are the same variant with other credits, and prove the shapes `children` takes and CR-3. Each sits on a `color.map.land` backdrop, so the glass is seen over what it sits on in Mylder. Each `play` test reads the DOM and the accessibility tree, not the pixels.

| Story       | Shows                                                                                                                                                                                                            | `play` test                                                                                                                                                                                                                                                                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Default`   | "Map data © OpenStreetMap contributors", with "OpenStreetMap contributors" a link to `https://www.openstreetmap.org/copyright`; the contract story renders it as the subject, and its args pass every rule alone | The root is a `<small>` with `pn-Attribution`, no role, no ARIA attribute and no `data-*`; its accessible text is the whole credit; the link has the `link` role, its name "OpenStreetMap contributors", and a computed `text-decoration-line` of `underline`; Tab moves focus to the link and Shift+Tab back, and the root itself never takes focus |
| `PlainText` | "Departures from Rejseplanen", a string with no link                                                                                                                                                             | The root's text is the string; nothing in it takes focus; the root's computed `color` is `color.text.secondary`'s                                                                                                                                                                                                                                    |
| `Wrapping`  | Two credits, "Map data © OpenStreetMap contributors" and "Departures from Rejseplanen", each with its link, as a list of children in a 200 px wide column                                                        | The root wraps onto more than one line; it stays inside its column (its `scrollWidth` is no more than its `clientWidth`, and its right edge no further than the column's); both links are in the accessible text, in order                                                                                                                           |

## Do and don't

For a caller using the component, with the reason.

| Do                                                                                                                                                          | Don't                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Credit each source as its terms ask, with a link to those terms: "Map data © OpenStreetMap contributors"                                                    | Shorten a credit a source's terms set, or leave the link out where the terms ask for one                                                                     |
| Place one Attribution in a corner of the map, `size.panel-gap` from the edge and stacked at `z-index.map-controls`, clear of the map controls and the scale | Put it in a panel, a dialog or the page's footer, away from the map it credits, or cover it with a sheet or a panel                                          |
| Give it phrasing content: text, links and inline elements                                                                                                   | Put a heading, a paragraph or a list in it; a `<small>` holds phrasing content only                                                                          |
| Write each link's text as the source's name or the credit itself                                                                                            | Write "Click here" or "Read more", or a bare URL; the link's text is what a screen reader hears                                                              |
| Keep it to the credits                                                                                                                                      | Use it for a disclaimer, a data-state note or a status message; a status belongs in words beside what it is about, in its own component, with its own colour |
