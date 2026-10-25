# Tag

A short word or two on a pill that marks a property of what it sits beside, such as "Night bus", "Replacement bus" or "Cancelled" on a departure or a vehicle, set in capitals in one of the intents' colours.

## Anatomy

Penpot page `Components/Tag`, not drawn yet: the design is deferred (`docs/adr/0010-unattended-runs-with-design-deferred.md`), so this spec decides the drawing. Family: none. Shared parts: none.

Tag is a label with no behaviour: the registry gives it no `baseUiParts`, and the chips people press, FilterChip and HighlightChip, are components of their own on Base UI's Toggle. Its root renders through Base UI's `useRender` hook (`@base-ui/react/use-render`), which gives it the `render` prop.

The drawing has a `root` board holding one text layer, `label`. Its variant properties are `variant` and `color`, in that order, with the values the [Props](#props) table gives, so its variants are `FilledNeutral`, `FilledSuccess`, `FilledWarning`, `FilledDanger`, `FilledInfo`, `DashedNeutral`, `DashedSuccess`, `DashedWarning`, `DashedDanger` and `DashedInfo`. There is no `State` property: Tag is not interactive and has only its rest state.

| Part (Penpot layer) | What it is                                                                                                                                                                                                | Base UI part                                  | Class    | `slotProps` key |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | -------- | --------------- |
| `root`              | The pill: an inline box with a `radius.full` edge, filled with the intent's tinted surface or edged with a dashed line, holding the words                                                                 | none: a `<span>` rendered through `useRender` | `pn-Tag` | none            |
| `label`             | The words, from the caller's `children`, set in `typography.overline`'s capitals. The `label` layer is the root's own text, with no element, class or `slotProps` key of its own, as LineBadge's label is | none: the root's text                         | none     | none            |

## Base UI parts

Tag imports no Base UI component. It uses two Base UI utilities, at the version pinned in `packages/perron/package.json`: `useRender` (`@base-ui/react/use-render`) for the root and `mergeProps` (`@base-ui/react/merge-props`) to merge the caller's props with its own.

| Base UI part                     | Renders  | Perron sets                                                                                                                           | Passed through                                                                       |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `useRender` (a hook, not a part) | `<span>` | `defaultTagName: 'span'`; `ref`; `props`: `mergeProps(rest, own)`, where `own` is `className: 'pn-Tag'`, `data-variant`, `data-color` | `render`, `ref`, `children`, `className`, `style` and every other `<span>` attribute |

Base UI already does: swapping the root element for the one `render` gives, keeping the class, the data attributes and the children; merging the caller's `ref` with the element's; and joining `className` and `style` and chaining event handlers through `mergeProps`.

## Props

In MUI's layout. Every prop here gets this description as its JSDoc. No slots: Tag has no inner part. No owned strings, so no `*Label` props.

Tag takes `variant`, `'filled' | 'dashed'`, default `'filled'`. `filled` lays the intent's tinted surface under its text, for a property that holds, such as "Night bus"; `dashed` has no fill and a dashed `color.border.strong` edge, the "dashed tags" that token's description names, for something announced but not yet confirmed by live data, such as a planned replacement bus. The spellings are MUI Chip's `filled` and the token's own word for the edge; no family's spelling binds Tag, since it joins none.

`color` offers `'neutral' | 'success' | 'warning' | 'danger' | 'info'`, default `'neutral'`, each with its `color.text.*` and `color.surface.*` tokens, and no `brand`: the brand yellow is kept for a screen's one main action, and a yellow pill beside it would read as a second one.

Tag comes in one size, with no `size` prop: `typography.overline` with `space.050` above and below and `space.200` at the sides, about 20 px tall with its hairline edge, so a tag fits beside a `size.badge` LineBadge in a row without making the row taller. A `size` can join later without a break.

Tag takes no `startIcon`: its words say everything it marks, and SeverityLabel is the label that comes with an icon. A `startIcon` can join later without a break.

`children` is required: a pill with no words says nothing, and its colour is never the only sign of what it marks.

| Name        | Type                                                        | Default     | Base UI prop        | Description                                                                                                                                                                                                                                                                          |
| ----------- | ----------------------------------------------------------- | ----------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `variant`   | `'filled' \| 'dashed'`                                      | `'filled'`  | none                | How sure the tag is: `filled` lays the intent's tinted surface under the words, for a property that holds; `dashed` has no fill and a dashed edge, for something announced but not yet confirmed by live data. Set on the root as `data-variant`.                                    |
| `color`     | `'neutral' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'neutral'` | none                | The intent: what the colour means. `neutral` for a plain property, such as "Night bus"; the status intents for good news, a warning, a problem or information, always in words that say it too, such as "Cancelled": colour is never the only sign. Set on the root as `data-color`. |
| `children`  | `ReactNode`                                                 | (required)  | none                | The words: one or two, written in sentence case, which the tag sets in capitals. A string, an element such as `<time>`, or a list of both.                                                                                                                                           |
| `render`    | Base UI's `render`                                          |             | inherited           | Allows you to replace the component's HTML element with a different tag, or compose it with another component. Accepts a `ReactElement` or a function that returns the element to render.                                                                                            |
| `className` | `string`                                                    |             | none                | Joined after `pn-Tag` on the root                                                                                                                                                                                                                                                    |
| `style`     | `CSSProperties`                                             |             | none                | Reaches the root                                                                                                                                                                                                                                                                     |
| `ref`       | `Ref<HTMLSpanElement>`                                      |             | `useRender`'s `ref` | Reaches the root element                                                                                                                                                                                                                                                             |

## Tokens

Tag is not interactive, so its one design state is rest; each row names the `data-variant` and `data-color` it applies to. It belongs to no family, so it takes the pill's `radius.full`, which that token's description gives to "chips, tags, counts", and the role `typography.overline`, whose description is "Section headings and tags, set in capitals".

| Part   | State                                       | Property          | Token                                                                                                                        |
| ------ | ------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `root` | rest, every variant                         | `display`         | none: the keyword `inline-block`, so the tag sits on the line of the text around it                                          |
| `root` | rest, every variant                         | `max-inline-size` | none: `100%`, so the tag never runs past its container (CR-6)                                                                |
| `root` | rest, every variant                         | `padding-block`   | `space.050`                                                                                                                  |
| `root` | rest, every variant                         | `padding-inline`  | `space.200`                                                                                                                  |
| `root` | rest, every variant                         | `border-radius`   | `radius.full`                                                                                                                |
| `root` | rest, every variant                         | `border-width`    | `border.width.025`                                                                                                           |
| `root` | rest, every variant                         | `font`            | `typography.overline`                                                                                                        |
| `root` | rest, every variant                         | `letter-spacing`  | `typography.overline-tracking`                                                                                               |
| `root` | rest, every variant                         | `text-transform`  | none: the keyword `uppercase`, as the `perron-typography-overline` class sets it                                             |
| `root` | rest, every variant                         | `overflow-wrap`   | none: the keyword `anywhere`, so a word longer than the container breaks inside itself (CR-6)                                |
| `root` | rest, `data-variant='filled'`               | `border-style`    | none: the keyword `solid`                                                                                                    |
| `root` | rest, `data-variant='filled'`               | `border-color`    | none: the keyword `transparent`, which Windows' contrast themes paint in the text colour, so the pill keeps its shape (CR-4) |
| `root` | rest, `data-variant='filled'`, `neutral`    | `background`      | `color.surface.inset`                                                                                                        |
| `root` | rest, `data-variant='filled'`, `success`    | `background`      | `color.surface.success`                                                                                                      |
| `root` | rest, `data-variant='filled'`, `warning`    | `background`      | `color.surface.warning`                                                                                                      |
| `root` | rest, `data-variant='filled'`, `danger`     | `background`      | `color.surface.danger`                                                                                                       |
| `root` | rest, `data-variant='filled'`, `info`       | `background`      | `color.surface.info`                                                                                                         |
| `root` | rest, `data-variant='dashed'`               | `background`      | none: the keyword `transparent`                                                                                              |
| `root` | rest, `data-variant='dashed'`               | `border-style`    | none: the keyword `dashed`                                                                                                   |
| `root` | rest, `data-variant='dashed'`               | `border-color`    | `color.border.strong`, a line that decorates: the words, not the edge, say what the tag marks                                |
| `root` | rest, every variant, `data-color='neutral'` | `color`           | `color.text.primary`                                                                                                         |
| `root` | rest, every variant, `data-color='success'` | `color`           | `color.text.success`                                                                                                         |
| `root` | rest, every variant, `data-color='warning'` | `color`           | `color.text.warning`                                                                                                         |
| `root` | rest, every variant, `data-color='danger'`  | `color`           | `color.text.danger`                                                                                                          |
| `root` | rest, every variant, `data-color='info'`    | `color`           | `color.text.info`                                                                                                            |

Every `color.text.*` intent token reaches 4.5:1 on `color.surface.default`, `raised` and `inset` in both themes, and each status one on its own tinted surface too ([Accessibility](../foundations/accessibility.md#what-the-build-checks)), so the words read in both variants wherever the tag sits.

## Keyboard and ARIA

Tag is text: it takes no focus, and no key does anything. A caller who makes it a link or button through `render` brings that element's own keys and must give it a target of `size.target-min`, which a tag is not.

| Key  | Does                             | From   |
| ---- | -------------------------------- | ------ |
| none | Tag is not focusable or operable | Perron |

| Element | Role                     | Accessible name from                                                        | States announced |
| ------- | ------------------------ | --------------------------------------------------------------------------- | ---------------- |
| `root`  | none: a generic `<span>` | Not named; its words are read in place, as part of the row or card it marks | none             |

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: the caller's words say what the tag marks, in every `color` and `variant`; the colour and the dashed edge only repeat it (CR-5). The capitals are `text-transform` over sentence-case source text, so a screen reader reads the words as written, not letter by letter.
- [ ] Every landmark and named region has an accessible name: none here; Tag is inline text.
- [ ] Every default label can be overridden: none here; Tag owns no strings.
- [ ] Every shape the type accepts renders, in every variant: `children` as a string, an element such as `<time>`, or a list of both, each inside the one root; every `variant` and `color` has its story.
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here; Tag does not animate.
- [ ] Native semantics first: a `<span>` with no role and no ARIA.
- [ ] Focus moves in reading order and returns on close: Tag takes no focus.
- [ ] Every target is at least `size.target-min` square: no target; Tag is not pressed.
- [ ] Loops stop when the system asks for less motion: none here; Tag has no motion.

## Owned strings

No owned strings: every word comes from the caller, as `children`.

## Component rules

- **CR-1.** Tag renders one `<span>` through `useRender`, with `defaultTagName: 'span'`, and its props merge as `mergeProps(rest, own)`, the caller's first, so `className` reads `pn-Tag` and then the caller's and Tag's own data attributes win. `variant` and `color` are taken out of `rest` before the merge, so neither reaches the DOM as an attribute.
- **CR-2.** The root always carries `data-variant` and `data-color` with the prop's value, defaults included, and the CSS reads every colour from them, as [Tokens](#tokens) gives: `.pn-Tag[data-variant='filled'][data-color='danger']`.
- **CR-3.** The colour is set once, on the root, and the words take it; the `filled` fill and the `dashed` edge never change the text colour.
- **CR-4.** Both variants keep one geometry: each draws a `border.width.025` edge, `transparent` and solid on `filled`, `color.border.strong` and dashed on `dashed`, so a filled and a dashed tag with the same words share one width and height, and Windows' forced colours draw an edge round every tag when the fill is dropped. No `(forced-colors: active)` rule is needed.
- **CR-5.** A status `color` comes with words that say it, such as "Cancelled" or "Replacement bus", and a `dashed` tag's words say it is not confirmed where that matters. Tag can't hold this for the caller, so the JSDoc of `color` says it and the review holds the stories to it.
- **CR-6.** Tag never cuts its words off: it sits on one line wherever it fits, and when its container is narrower than it, at 320 px or at 200% zoom, it wraps inside itself, a word longer than the line breaking within it, and stays inside the container ([Accessibility](../foundations/accessibility.md#what-a-person-checks), zoom and reflow). It sets no `white-space: nowrap` and no `text-overflow`.
- **CR-7.** Tag is not interactive: no `tabIndex` and no handler of its own. The caller's handlers and attributes reach the root unchanged.
- **CR-8.** The source text is the caller's, in sentence case, as [Content design](../content-design.md) asks; the capitals come only from `text-transform`, so the DOM and the accessibility tree hold the sentence-case words.

## Stories

One per variant the deferred design will draw, named as the `variant` and `color` values in PascalCase. Each `play` test reads the accessibility tree and the DOM, not the pixels.

| Story           | Shows                                                                                                       | `play` test                                                                                                                                                                                                                                                                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `FilledNeutral` | `variant='filled'`, `color='neutral'`, the defaults: "Night bus". The subject story, its args the tag alone | `data-variant` is `filled` and `data-color` is `neutral`; the text in the DOM is "Night bus", in sentence case, and its computed `text-transform` is `uppercase`; the tag is not focusable; with the canvas narrowed to a few characters' width, the tag wraps onto more than one line and stays inside the canvas, then the canvas is restored (CR-6) |
| `FilledSuccess` | `variant='filled'`, `color='success'`: "Step-free"                                                          | `data-variant` is `filled` and `data-color` is `success`; the text is "Step-free"                                                                                                                                                                                                                                                                      |
| `FilledWarning` | `variant='filled'`, `color='warning'`: "Replacement bus"                                                    | `data-variant` is `filled` and `data-color` is `warning`; the text is "Replacement bus"                                                                                                                                                                                                                                                                |
| `FilledDanger`  | `variant='filled'`, `color='danger'`: "Cancelled"                                                           | `data-variant` is `filled` and `data-color` is `danger`; the text is "Cancelled"                                                                                                                                                                                                                                                                       |
| `FilledInfo`    | `variant='filled'`, `color='info'`: "Extra departure"                                                       | `data-variant` is `filled` and `data-color` is `info`; the text is "Extra departure"                                                                                                                                                                                                                                                                   |
| `DashedNeutral` | `variant='dashed'`, `color='neutral'`: "Night bus"                                                          | `data-variant` is `dashed` and `data-color` is `neutral`; the computed `border-style` is `dashed` and the computed border width is the `border.width.025` hairline `filled` draws too, so both variants share one box (CR-4)                                                                                                                           |
| `DashedSuccess` | `variant='dashed'`, `color='success'`: "Step-free"                                                          | `data-variant` is `dashed` and `data-color` is `success`                                                                                                                                                                                                                                                                                               |
| `DashedWarning` | `variant='dashed'`, `color='warning'`: "Replacement bus"                                                    | `data-variant` is `dashed` and `data-color` is `warning`                                                                                                                                                                                                                                                                                               |
| `DashedDanger`  | `variant='dashed'`, `color='danger'`: "Cancelled"                                                           | `data-variant` is `dashed` and `data-color` is `danger`                                                                                                                                                                                                                                                                                                |
| `DashedInfo`    | `variant='dashed'`, `color='info'`: "Extra departure"                                                       | `data-variant` is `dashed` and `data-color` is `info`                                                                                                                                                                                                                                                                                                  |

## Do and don't

For a caller using the component, with the reason.

| Do                                                                                                                 | Don't                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Mark a property of a departure, vehicle or line with one or two words: "Night bus", "Replacement bus".             | Put a sentence in a tag: say what is happening beside it, in plain sentences, as content design asks.                                          |
| Write the words in sentence case and let the tag set the capitals.                                                 | Type the capitals: a screen reader may spell them out letter by letter.                                                                        |
| Say a status in the words: `color='danger'` on "Cancelled".                                                        | Let red or green be the only sign, which fails 1.4.1 and every rider who can't tell them apart.                                                |
| Use `dashed` for something announced but not yet confirmed by live data, and say so in the words where it matters. | Use `dashed` as a quieter look for a property that holds: the dashed edge says "not confirmed", and the brand never claims more than it knows. |
| Name a kind of disruption with SeverityLabel, a line with LineBadge, and a number with Count.                      | Spell out "Delays", a line's name or a count in a tag: each has its own component, with its own words, colours and figures.                    |
| Use FilterChip for a filter people turn on and off.                                                                | Make a tag a control through `render`: it is smaller than `size.target-min` and has no hover, pressed or selected state.                       |
