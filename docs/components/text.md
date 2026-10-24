# Text

Text sets a piece of text in one of the [typography](../foundations/typography.md) roles and one of the text colours, on the element the caller's document needs.

## Anatomy

Penpot page `Components/Text`. Family: none. Shared parts: none.

The design is deferred (`docs/adr/0010-unattended-runs-with-design-deferred.md`), so this spec decides the drawing: one layer, `root`; the variant properties `variant`, `color` and `emphasis`, in that order, with the values the [Props](#props) table gives; no `State` property, since Text is not interactive and has only its rest state.

| Part (Penpot layer) | What it is                                                                                | Base UI part                                                                      | Class     | `slotProps` key |
| ------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------- | --------------- |
| `root`              | The one element that holds the text: a `<p>` or `<span>` by role, or the `render` element | None: Base UI has no text component, so Text renders through its `useRender` hook | `pn-Text` | none            |

## Base UI parts

No Base UI component: `baseUiParts` stays empty in `packages/perron/components.json`. Text renders its root through Base UI's `useRender` hook and merges props with `mergeProps`, imported from `@base-ui/react/use-render` and `@base-ui/react/merge-props`, at the version pinned in `package.json`.

| Base UI part | Renders                                                                            | Perron sets                                                                                                                                                       | Passed through                                                                     |
| ------------ | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `useRender`  | The role's default element (see [CR-1](#component-rules)), or the `render` element | `defaultTagName` from `variant`; `ref`; `props`: `mergeProps(rest, own)`, where `own` is `className: 'pn-Text'`, `data-variant`, `data-color` and `data-emphasis` | `render`, `children`, `className`, `style` and every HTML attribute of the element |

Base UI already does: swapping the element for the `render` element or function while keeping Perron's class, data attributes and `ref`; joining `className` strings and merging `style` objects; chaining event handlers. Text adds no behaviour of its own.

## Props

In MUI's layout. Every prop here gets this description as its JSDoc. Slots come last.

| Name        | Type                                                                                                                                                                                                         | Default     | Base UI prop            | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `variant`   | `'body' \| 'display' \| 'heading-lg' \| 'heading-md' \| 'heading-sm' \| 'body-sm' \| 'caption' \| 'label' \| 'label-sm' \| 'overline' \| 'badge' \| 'stat' \| 'data-xl' \| 'data-lg' \| 'data' \| 'data-sm'` | `'body'`    | none                    | The typography role, one per job, as [Typography](../foundations/typography.md#roles) gives them: `data` roles for anything compared down a column, `overline` set in capitals. [PENDING] Should `variant` take all sixteen roles, spelled as their tokens are, with `'body'` first and the default? Recommended: yes: it is the role `perron.css` sets on the page body, and the contract makes the first value the default.                                                                                                                                                  |
| `color`     | `'neutral' \| 'brand' \| 'success' \| 'warning' \| 'danger' \| 'info'`                                                                                                                                       | `'neutral'` | none                    | The intent: what the colour means. `neutral` is main text; `brand` is emphasis on the hero page, never a link; the status intents say on time, warning, late or info, always beside words that say it too. [PENDING] Should `color` offer all six intents, each with its `color.text.*` token, and default to `'neutral'` (`color.text.primary`) as the contract sets, rather than inheriting the colour around it? Recommended: yes: every intent has a text token measured at 4.5:1, and text on an inverse or coloured fill is the fill's own component's text, not a Text. |
| `emphasis`  | `'primary' \| 'secondary' \| 'tertiary'`                                                                                                                                                                     | `'primary'` | none                    | How strongly neutral text stands out: `primary` for what people read first, `secondary` for supporting text, `tertiary` for hints and captions next to stronger text. Changes nothing with any other `color`. [PENDING] Should Text take this prop of its own, named `emphasis`, for `color.text.secondary` and `color.text.tertiary`, which are no intent and so can't be `color` values? Recommended: yes: the contract keeps `color` to the intents, the glossary rules out "tone", and the values are the tokens' own names.                                               |
| `render`    | `ReactElement \| (props, state) => ReactElement`                                                                                                                                                             |             | `render` of `useRender` | Swaps the root element, keeping the class and data attributes: `render={<h2 />}` for a heading, `render={<time dateTime="08:14" />}` for a time. [PENDING] Should Text render a `<p>` for `body` and `body-sm` and a `<span>` for every other role, headings included, leaving a heading's level to the caller through `render`? Recommended: yes: sentences are paragraphs, only the caller knows a heading's level in the page's outline, and a `<span>` is safe inside a button, a label or another paragraph.                                                              |
| `children`  | `ReactNode`                                                                                                                                                                                                  |             | none                    | The text: a string, an element such as `<strong>` or `<time>`, or a list of both.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `className` | `string`                                                                                                                                                                                                     |             | none                    | Joined after `pn-Text` on the root.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `style`     | `CSSProperties`                                                                                                                                                                                              |             | none                    | Merged onto the root.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `ref`       | `Ref<HTMLElement>`                                                                                                                                                                                           |             | `ref` of `useRender`    | Reaches the root element, whichever element `render` makes it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

No `size`: the role sets the size. No `slotProps`: Text has no part but its root. No `*Label` props: Text owns no strings. [PENDING] Should Text leave out MUI's `align`, `noWrap` and `gutterBottom`, so alignment, truncation and spacing come from the caller's `className` and the layout? Recommended: yes: no source asks for them yet, and the props API only grows, so adding one when a pattern needs it is no break, where removing one would be.

## Tokens

One row per part, state and property. Text has one part, `root`, and one design state, rest. Each role reads its composite `typography.*` token for `font` and that token's tracking twin, `--perron-typography-<role>-tracking`, for `letter-spacing`.

| Part                                              | State | Property         | Token                                 |
| ------------------------------------------------- | ----- | ---------------- | ------------------------------------- |
| `root`, `variant='body'`                          | rest  | `font`           | `typography.body`                     |
| `root`, `variant='body'`                          | rest  | `letter-spacing` | `typography.body`, its tracking       |
| `root`, `variant='display'`                       | rest  | `font`           | `typography.display`                  |
| `root`, `variant='display'`                       | rest  | `letter-spacing` | `typography.display`, its tracking    |
| `root`, `variant='heading-lg'`                    | rest  | `font`           | `typography.heading-lg`               |
| `root`, `variant='heading-lg'`                    | rest  | `letter-spacing` | `typography.heading-lg`, its tracking |
| `root`, `variant='heading-md'`                    | rest  | `font`           | `typography.heading-md`               |
| `root`, `variant='heading-md'`                    | rest  | `letter-spacing` | `typography.heading-md`, its tracking |
| `root`, `variant='heading-sm'`                    | rest  | `font`           | `typography.heading-sm`               |
| `root`, `variant='heading-sm'`                    | rest  | `letter-spacing` | `typography.heading-sm`, its tracking |
| `root`, `variant='body-sm'`                       | rest  | `font`           | `typography.body-sm`                  |
| `root`, `variant='body-sm'`                       | rest  | `letter-spacing` | `typography.body-sm`, its tracking    |
| `root`, `variant='caption'`                       | rest  | `font`           | `typography.caption`                  |
| `root`, `variant='caption'`                       | rest  | `letter-spacing` | `typography.caption`, its tracking    |
| `root`, `variant='label'`                         | rest  | `font`           | `typography.label`                    |
| `root`, `variant='label'`                         | rest  | `letter-spacing` | `typography.label`, its tracking      |
| `root`, `variant='label-sm'`                      | rest  | `font`           | `typography.label-sm`                 |
| `root`, `variant='label-sm'`                      | rest  | `letter-spacing` | `typography.label-sm`, its tracking   |
| `root`, `variant='overline'`                      | rest  | `font`           | `typography.overline`                 |
| `root`, `variant='overline'`                      | rest  | `letter-spacing` | `typography.overline`, its tracking   |
| `root`, `variant='badge'`                         | rest  | `font`           | `typography.badge`                    |
| `root`, `variant='badge'`                         | rest  | `letter-spacing` | `typography.badge`, its tracking      |
| `root`, `variant='stat'`                          | rest  | `font`           | `typography.stat`                     |
| `root`, `variant='stat'`                          | rest  | `letter-spacing` | `typography.stat`, its tracking       |
| `root`, `variant='data-xl'`                       | rest  | `font`           | `typography.data-xl`                  |
| `root`, `variant='data-xl'`                       | rest  | `letter-spacing` | `typography.data-xl`, its tracking    |
| `root`, `variant='data-lg'`                       | rest  | `font`           | `typography.data-lg`                  |
| `root`, `variant='data-lg'`                       | rest  | `letter-spacing` | `typography.data-lg`, its tracking    |
| `root`, `variant='data'`                          | rest  | `font`           | `typography.data`                     |
| `root`, `variant='data'`                          | rest  | `letter-spacing` | `typography.data`, its tracking       |
| `root`, `variant='data-sm'`                       | rest  | `font`           | `typography.data-sm`                  |
| `root`, `variant='data-sm'`                       | rest  | `letter-spacing` | `typography.data-sm`, its tracking    |
| `root`, `color='neutral'`                         | rest  | `color`          | `color.text.primary`                  |
| `root`, `color='brand'`                           | rest  | `color`          | `color.text.brand`                    |
| `root`, `color='success'`                         | rest  | `color`          | `color.text.success`                  |
| `root`, `color='warning'`                         | rest  | `color`          | `color.text.warning`                  |
| `root`, `color='danger'`                          | rest  | `color`          | `color.text.danger`                   |
| `root`, `color='info'`                            | rest  | `color`          | `color.text.info`                     |
| `root`, `color='neutral'`, `emphasis='secondary'` | rest  | `color`          | `color.text.secondary`                |
| `root`, `color='neutral'`, `emphasis='tertiary'`  | rest  | `color`          | `color.text.tertiary`                 |

[PENDING] [Typography](../foundations/typography.md#roles) steps `display` and `data-xl` down to `font.size.800`, and `stat` to `font.size.600`, on phones, but the contract gives components no viewport query and no breakpoint a CSS query can read. Should Text keep each role's size at every width, and the step-down be filed as a token gap for the `design-tokens` skill, a phone modifier that redefines those three composites on `:root`, so Text and the `perron-typography-*` classes step down together when it lands? Recommended: yes.

## Keyboard and ARIA

From the `useRender` reference. "From" says who does it: Base UI, or Perron.

| Key  | Does                                                    | From |
| ---- | ------------------------------------------------------- | ---- |
| None | Text is not interactive: it never takes focus or a key. | none |

| Element | Role                                                                                                       | Accessible name from                                                          | States announced |
| ------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------- |
| `root`  | The element's own: `paragraph` for `<p>`, generic for `<span>`, `heading` for an `h` element from `render` | Its own text, read in place; a heading from `render` is named by its children | None             |

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: the text itself is what both are told; a status `color` is never the only sign, so the caller's words say it ([CR-8](#component-rules)), and `overline`'s capitals are styling over sentence-case source text, read as written.
- [ ] Every landmark and named region has an accessible name: none here; Text makes no landmark or region.
- [ ] Every default label can be overridden: none here; Text owns no strings.
- [ ] Every shape the type accepts renders, in every variant: `children` is a `ReactNode`; the `BodySmNeutralPrimary` story gives a list of a string and a `<time>` element, and every other story a string.
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here; Text keeps no hidden copy and collapses nothing.
- [ ] Native semantics first: `<p>` for sentences, `<span>` for the rest, and the caller's own element through `render`: `<h2>` for a heading, `<time>` for a time. No ARIA.
- [ ] Focus moves in reading order and returns on close: none here; Text takes no focus and opens nothing.
- [ ] Every target is at least `size.target-min` square: none here; Text is no target.
- [ ] Loops stop when the system asks for less motion: none here; Text has no animation.

## Owned strings

No owned strings: every word comes from the caller, as `children`.

## Component rules

Rules for this component alone, numbered so the build and the review can cite them.

- **CR-1.** Text renders one element through `useRender`, with `defaultTagName` `'p'` for `body` and `body-sm` and `'span'` for every other role, per the answer on `render` in [Props](#props). `render` swaps it, and the swapped element keeps `pn-Text`, the data attributes and the `ref`.
- **CR-2.** Props merge as `mergeProps(rest, own)`, the caller's first, so Text's own data attributes win and `className` reads `pn-Text` and then the caller's. `variant`, `color`, `emphasis` and `render` are taken out of `rest` before the merge, so none reaches the DOM as an attribute.
- **CR-3.** The root always carries `data-variant`, `data-color` and `data-emphasis` with the prop's value, defaults included.
- **CR-4.** `Text.css` sets each role itself, in one rule per role, `.pn-Text[data-variant='<role>']`, with `font` from the role's `typography.*` token and `letter-spacing` from its tracking twin. Text doesn't add the `perron-typography-*` classes, so its look is in the CSS the `component-css` gate reads, and one class of the caller's overrides it.
- **CR-5.** As the typography classes do, the `data`, `data-sm`, `data-lg` and `data-xl` rules add `font-variant-numeric: tabular-nums`, and the `overline` rule adds `text-transform: uppercase`. Both are keywords; the source text stays in sentence case.
- **CR-6.** The root sets `margin: 0`, so a `<p>` or a heading from `render` brings no browser margin: space between texts is the layout's, from `space.*`.
- **CR-7.** `.pn-Text[data-color='<intent>']` sets `color` to the intent's `color.text.*` token. `emphasis` reads only with neutral, as `.pn-Text[data-color='neutral'][data-emphasis='secondary']` and `…[data-emphasis='tertiary']`; with any other intent it changes nothing.
- **CR-8.** A status intent's colour comes with words that say it: "Late", "+4 min", "Running normally". Text can't hold this rule for the caller, so its JSDoc for `color` says it and the review holds the stories to it.
- **CR-9.** Text is not interactive: no `tabIndex`, no handler of its own. The caller's handlers and attributes reach the root unchanged.
- **CR-10.** Each role keeps its token size at every width: no media or container query, per the answer on the phone step-down in [Tokens](#tokens).

## Stories

One per variant the design draws, named by the Penpot convention: `variant`, `color` and `emphasis` in PascalCase, joined. The design draws every role in neutral at primary emphasis, `body` in each other intent, and `body` in neutral at each other emphasis. Each story's text follows [Content design](../content-design.md): a time or a count for a `data` role, a sentence for `body`.

| Story                     | Shows                                                                                                  | `play` test                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `BodyNeutralPrimary`      | `variant='body'`, `color='neutral'`, `emphasis='primary'`, the defaults: a sentence about a disruption | The root is a `<p>` with class `pn-Text`, `data-variant='body'`, `data-color='neutral'` and `data-emphasis='primary'`, and the `ref` reaches it |
| `DisplayNeutralPrimary`   | `variant='display'`, neutral, primary                                                                  | none                                                                                                                                            |
| `HeadingLgNeutralPrimary` | `variant='heading-lg'`, neutral, primary, with `render={<h1 />}`                                       | none                                                                                                                                            |
| `HeadingMdNeutralPrimary` | `variant='heading-md'`, neutral, primary, with `render={<h2 />}`: a stop's name                        | A heading of level 2 holds the text and keeps class `pn-Text` and `data-variant='heading-md'`                                                   |
| `HeadingSmNeutralPrimary` | `variant='heading-sm'`, neutral, primary, with `render={<h3 />}`                                       | none                                                                                                                                            |
| `BodySmNeutralPrimary`    | `variant='body-sm'`, neutral, primary, its children a string and a `<time>` element                    | Both children render, in order                                                                                                                  |
| `CaptionNeutralPrimary`   | `variant='caption'`, neutral, primary                                                                  | The root is a `<span>`                                                                                                                          |
| `LabelNeutralPrimary`     | `variant='label'`, neutral, primary                                                                    | none                                                                                                                                            |
| `LabelSmNeutralPrimary`   | `variant='label-sm'`, neutral, primary                                                                 | none                                                                                                                                            |
| `OverlineNeutralPrimary`  | `variant='overline'`, neutral, primary, its source text in sentence case                               | The text in the DOM is the sentence-case source, and the computed `text-transform` is `uppercase`                                               |
| `BadgeNeutralPrimary`     | `variant='badge'`, neutral, primary                                                                    | none                                                                                                                                            |
| `StatNeutralPrimary`      | `variant='stat'`, neutral, primary: a key figure                                                       | none                                                                                                                                            |
| `DataXlNeutralPrimary`    | `variant='data-xl'`, neutral, primary: a clock                                                         | none                                                                                                                                            |
| `DataLgNeutralPrimary`    | `variant='data-lg'`, neutral, primary: a countdown                                                     | none                                                                                                                                            |
| `DataNeutralPrimary`      | `variant='data'`, neutral, primary: a time                                                             | The computed `font-variant-numeric` is `tabular-nums`                                                                                           |
| `DataSmNeutralPrimary`    | `variant='data-sm'`, neutral, primary: a count                                                         | none                                                                                                                                            |
| `BodyBrandPrimary`        | `variant='body'`, `color='brand'`, primary                                                             | none                                                                                                                                            |
| `BodySuccessPrimary`      | `variant='body'`, `color='success'`, primary: "Running normally"                                       | none                                                                                                                                            |
| `BodyWarningPrimary`      | `variant='body'`, `color='warning'`, primary                                                           | none                                                                                                                                            |
| `BodyDangerPrimary`       | `variant='body'`, `color='danger'`, primary: a delay in words                                          | none                                                                                                                                            |
| `BodyInfoPrimary`         | `variant='body'`, `color='info'`, primary: a diversion                                                 | none                                                                                                                                            |
| `BodyNeutralSecondary`    | `variant='body'`, neutral, `emphasis='secondary'`                                                      | none                                                                                                                                            |
| `BodyNeutralTertiary`     | `variant='body'`, neutral, `emphasis='tertiary'`: a hint                                               | none                                                                                                                                            |

## Do and don't

For a caller using the component, with the reason.

| Do                                                                                                               | Don't                                                                                           |
| ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Give a heading role its heading element through `render`, at its level in the page's outline: `render={<h2 />}`. | Set a heading's look on a `<span>`: a screen reader's list of headings never finds it.          |
| Say a status in words beside its colour: `color='danger'` on "+4 min late".                                      | Let red or green be the only sign, which fails 1.4.1 and every rider who can't tell them apart. |
| Keep `emphasis='tertiary'` for hints and captions next to stronger text.                                         | Set a sentence people must read in tertiary: it misses 4.5:1 on purpose.                        |
| Set times, countdowns, counts and delays in a `data` role, so their tabular figures line up down a column.       | Set a time in `body`, where each digit has its own width and a column of times wobbles.         |
| Write an `overline`'s text in sentence case and let the role set the capitals.                                   | Type the capitals: a screen reader may spell them out letter by letter.                         |
| Keep `color='brand'` for emphasis on the hero page.                                                              | Use brand text for a link, or anything that looks like one.                                     |
| Leave `badge` to line badges, the job its role was made for.                                                     | Set other text in `badge`: its line height of 1 crowds a second line against the first.         |
| Restyle through `className`, with the tokens.                                                                    | Reach for a raw size or colour in `style`, which leaves the theme and the scale behind.         |
