# Kbd

Kbd shows one key of the keyboard, such as "Esc", "+" or "↑", inside help text, so a sentence like "Keys: + and − zoom, arrows pan, Esc closes panels." shows each key as a key.

## Anatomy

Penpot page `Components/Kbd`. Family: none. Shared parts: none.

The design is deferred (ADR 0010, `docs/adr/0010-unattended-runs-with-design-deferred.md`), so this spec sets what the drawing will have: one board, `root`, holding the key's text; no variant property, so the design has one variant, `Default`; and no `State` property, since a key in help text is never interactive (CR-2) and has only its rest state.

| Part (Penpot layer) | What it is                                                                                                                                                                                                       | Base UI part                                 | Class    | `slotProps` key |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | -------- | --------------- |
| `root`              | The key: a small bordered box on the line of the text around it, holding the key's name or glyph from the caller's `children`. The text is the root's own, with no element, class or `slotProps` key of its own. | none: a `<kbd>` rendered through `useRender` | `pn-Kbd` | none            |

## Base UI parts

No Base UI component: `baseUiParts` is empty in `packages/perron/components.json`, and a key in help text has no behaviour to borrow. The root renders through Base UI's `useRender` hook, from `@base-ui/react/use-render` at the version pinned in `packages/perron/package.json`, so the contract's `render` prop works, and the component's props are merged with `mergeProps` from `@base-ui/react/merge-props`, as LineBadge and Text do.

| Base UI part | Renders | Perron sets                                                                                                             | Passed through                                                                      |
| ------------ | ------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `useRender`  | `<kbd>` | `defaultTagName: 'kbd'`; `ref`; `props`: `mergeProps(rest, own)`, where `own` is `className: 'pn-Kbd'` and nothing else | `render`, `ref`, `children`, `className`, `style` and every other `<kbd>` attribute |

Base UI already does: swapping the root element for the `render` element or function while keeping Perron's class and `ref`, merging the caller's `ref` with the element's under React 19, and joining `className` strings, merging `style` objects and chaining event handlers in `mergeProps`. Kbd adds no behaviour of its own.

## Props

In MUI's layout. Every prop here gets this description as its JSDoc. No slots: the key has no inner part.

| Name        | Type               | Default | Base UI prop | Description                                                                                                                                                                               |
| ----------- | ------------------ | ------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `children`  | `ReactNode`        | none    | none         | One key, as the keyboard prints it or the platform names it: "Esc", "Enter", "+", "−", "↑". Required: a key with no name says nothing. A combination is one Kbd per key (CR-5).           |
| `render`    | Base UI's `render` |         | inherited    | Allows you to replace the component's HTML element with a different tag, or compose it with another component. Accepts a `ReactElement` or a function that returns the element to render. |
| `className` | `string`           |         | none         | Joined after `pn-Kbd` on the root                                                                                                                                                         |
| `style`     | `CSSProperties`    |         | none         | Reaches the root                                                                                                                                                                          |
| `ref`       | `Ref<HTMLElement>` |         | none         | Reaches the root element                                                                                                                                                                  |

`KbdProps` extends `useRender.ComponentProps<'kbd'>` without its `children`, which it declares again as required, as LineBadge's props do; `render` is inherited from `useRender` as it is, with Base UI's JSDoc, and `KbdProps` does not declare it. `className`, `style`, `ref` and the other `<kbd>` attributes reach the root, as the contract's [Root](README.md#root) says. No `*Label` props: Kbd owns no strings.

Kbd ships one look, with no `variant`, `color` or `size`: every key in Mylder's help sits in a sentence of `typography.body` or `typography.caption`, and one look sized to fit both keeps every hint alike; a key carries no meaning a colour could add, and the props API only grows, so a `size` can join when a screen needs one.

`children` is required, with no default: an empty key draws a box that names nothing, and the contract's "everything the eye is told, the ear is told" needs a name in every key; LineBadge requires its `children` for the same reason.

## Tokens

One row per part, state and property. Kbd has one part, `root`, and one design state, rest: it is never interactive (CR-2). Every colour is one of the tokens [Semantic colours](../foundations/semantic-colours.md) gives for both themes, so the key needs no rule for the dark theme.

| Part   | State                | Property         | Token                                                                                                                                |
| ------ | -------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `root` | rest                 | `background`     | `color.surface.raised`                                                                                                               |
| `root` | rest                 | `border`         | `border.width.025` solid in `color.border.strong`                                                                                    |
| `root` | rest                 | `border-radius`  | `radius.xs`                                                                                                                          |
| `root` | rest                 | `color`          | `color.text.primary`                                                                                                                 |
| `root` | rest                 | `font`           | `typography.data-sm`                                                                                                                 |
| `root` | rest                 | `line-height`    | `font.line-height.tight`, in place of the role's own, so the key is short enough to leave room between the keys of two wrapped lines |
| `root` | rest                 | `letter-spacing` | `typography.data-sm-tracking`, the role's twin                                                                                       |
| `root` | rest                 | `padding-inline` | `space.100`                                                                                                                          |
| `root` | rest                 | `padding-block`  | none: `0`, so the key is one line of its text and its border tall                                                                    |
| `root` | rest                 | `margin-block`   | `calc(-1 * border.width.025)`, so the border paints outside the line's layout and only the key's 1lh counts toward the line          |
| `root` | rest, forced colours | `border`         | none: the same border, which Windows' contrast themes paint in the text colour, so the key keeps its edge when the fill is dropped   |

The key is a `color.surface.raised` box with a `border.width.025` solid edge in `color.border.strong`, `radius.xs` corners and `color.text.primary` text. The raised fill and solid edge read as a key on every surface the help sits on, panel, glass or card, and set it apart from its Display neighbours: a count is an inset pill and a tag a dashed one. `color.border.strong` is the token for lines that decorate rather than show a control, which a key in text is, so its edge needs no 3:1 and doesn't look pressable the way `color.border.control` would; `radius.xs` is the radius for small marks, a step under a line badge's `radius.sm`; `color.text.primary` reaches 17.92:1 on `color.surface.raised` in light and 13.45:1 in dark ([Accessibility](../foundations/accessibility.md#text-on-surfaces)).

The key's text is in `typography.data-sm`, JetBrains Mono at 11 px and 500, set at `font.line-height.tight`, 1.15, in place of the role's 1.3: a monospace face is how keys are printed in help, and Perron's one monospace face is `font.family.data`, reached only through a `data` role. At 11 px the key sits a step under `typography.caption` (12 px) and three under `typography.body` (14 px), the two roles help text takes, so a key reads as a mark in the sentence and not as a word of it; the tight line height suits a key, which is one line with nothing under it to clear, and still holds the caps and the descenders inside the border.

The face Perron ships, the latin subset of JetBrains Mono that `packages/perron/styles/fonts.css` loads, carries "+", "−", "↑" and "↓", but not "←" or "→" (U+2190 and U+2192): in a Kbd those two fall back to the system's monospace, smaller, heavier and lower than the other keys. So help text names the arrows in words, "arrows pan", as [content design](../content-design.md) writes it, and a Kbd holds "↑" or "↓" but never "←" or "→".

The key takes `space.100` either side of its text and no padding above or below. Every character of a monospace face is as wide, so a one-character key such as "+" is a little wider than it is tall from that padding alone, and needs no minimum width. With no padding above or below, the key is 1lh of its text, 12.65 px, and its border, 14.65 px in all. A margin of minus the border's width above and below takes the border out of the line's layout, so the line counts only the key's 12.65 px: inside the 18 px line of `typography.caption` and the 21 px line of `typography.body` wherever the baseline places it, so a key never pushes its line apart (CR-3). The border still paints, in the line's half-leading. When a caption wraps and puts one key under another, the two boxes stand more than 3 px apart, so their edges read as two keys and not as one doubled line. `space.100`, 4 px, is the step that keeps "Esc" compact.

## Keyboard and ARIA

No keys: Kbd is not focusable and does nothing when pressed (CR-2). It names a key; the key's action is the screen's, and the control the key works is the caller's to mark with `aria-keyshortcuts`, as [Accessibility](../foundations/accessibility.md#rules) gives the keys.

| Key  | Does                             | From   |
| ---- | -------------------------------- | ------ |
| None | Kbd is not focusable or operable | Perron |

| Element | Role                                                            | Accessible name from              | States announced |
| ------- | --------------------------------------------------------------- | --------------------------------- | ---------------- |
| `root`  | none: a `<kbd>`, which has no ARIA role and is read as its text | Its text, the caller's `children` | none             |

A screen reader reads the key's text in the sentence around it, as written: "Esc", "plus", "minus", "up arrow" for "Esc", "+", "−", "↑". Kbd adds no `aria-label` and no owned word for the key: the caller's text is already the key's name, and a `<kbd>` without a role can't carry `aria-label` reliably.

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: the box only says "this is a key"; the key itself is the text inside it, which a screen reader reads in place, and `children` is required.
- [ ] Every landmark and named region has an accessible name: none here; the key is inline text.
- [ ] Every default label can be overridden: no owned strings, so no `*Label` props.
- [ ] Every shape the type accepts renders, in every variant: `children` renders as a string, an element and a list alike, on one line inside the box; `Kbd.test.tsx` checks all three, each inside the one `<kbd>` with `pn-Kbd` first.
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here; the key has no motion.
- [ ] Native semantics first: the native `<kbd>`, with no ARIA.
- [ ] Focus moves in reading order and returns on close: never focused; it has no tab stop.
- [ ] Every target is at least `size.target-min` square: no target; Kbd is never pressed. A pressable key hint is the caller's button with the Kbd inside it, which meets the minimum itself.
- [ ] Loops stop when the system asks for less motion: none here; the key has no motion.

## Owned strings

No owned strings: the key's name is the caller's `children`, and Kbd announces nothing else.

## Component rules

- **CR-1.** The root is the native `<kbd>`, rendered through `useRender` with `defaultTagName: 'kbd'`, with `pn-Kbd` first in its `className` and the caller's after. It sets no role and no ARIA attribute, and no data attribute, since it has no `variant`, `color` or `size` prop.
- **CR-2.** The key is never interactive: no hover, focus, pressed or selected look, no tab stop, no role. A key hint the rider can press is a Perron button with the Kbd inside it.
- **CR-3.** The key sits on the line of the text around it and never breaks it: `display: inline-block`, `vertical-align: baseline`, so its text shares the sentence's baseline; `white-space: nowrap`, so it never wraps or truncates; `text-align: center`, so its text centres in its box. `margin-block: calc(-1 * border.width.025)`, so the border paints outside the line's layout and only the key's 1lh of `typography.data-sm` at `font.line-height.tight` counts toward the line. In `typography.body` and `typography.caption` text it is shorter than the line, by enough that the keys of two wrapped lines stand apart, so the lines around it keep their spacing and two keys never touch.
- **CR-4.** The CSS reads only the component layer's [token families](README.md#token-families), with no `opacity`, no `text-transform` and no `[data-theme]` selector: the key shows its text as the caller wrote it, "Esc" and not "ESC", in both themes through the semantic tokens.
- **CR-5.** One Kbd holds one key: a combination is written as one Kbd per key with the "+" between them in the caller's text, with no `keys` prop, no separator and no nested `<kbd>`. Mylder's keys are single, "+", "−", the arrows and Esc, as [Accessibility](../foundations/accessibility.md#rules) lists them; a separator Kbd drew itself would be an owned string with nothing to say in four languages; and the caller writing `<Kbd>Ctrl</Kbd> + <Kbd>K</Kbd>` reads to a screen reader as the sentence says it.

## Stories

One per variant the deferred design will draw. Kbd has no variant property, so its one variant is `Default`; `SingleCharacter` and `InHelpText` are the same variant with other text, and prove CR-3. Each `play` test reads the DOM and the accessibility tree, not the pixels.

| Story             | Shows                                                                                                                                                                | `play` test                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Default`         | The key "Esc"; the contract story renders it as the subject, and its args pass every rule alone                                                                      | The root is a `<kbd>` with `pn-Kbd`, no role, no ARIA attribute and no `data-*`; its accessible text is "Esc"; it has no `tabindex`, and nothing in it takes focus                                                                                                                                                                                                                                                                                                                        |
| `SingleCharacter` | The key "+"                                                                                                                                                          | The root is at least as wide as it is tall, and its text is "+"                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `InHelpText`      | A Text in `variant='caption'` reading "Keys: + and − zoom, arrows pan, Esc closes panels.", with "+", "−" and "Esc" each a Kbd, in a column narrow enough to wrap it | The paragraph's accessible text is the whole sentence, in order; each Kbd's height is no more than the paragraph's computed line height; a Kbd on a wrapped line stands apart from a Kbd on the line above by more than both their borders; the paragraph is no taller than a copy of it in the same column with each Kbd swapped for an inline-block stand-in of the same text and width, so both wrap at the same words; each Kbd's text stays on one line; no Kbd overflows the column |

## Do and don't

For a caller using the component, with the reason.

| Do                                                                                                                         | Don't                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Name keys in help text, one Kbd per key, as content design writes it: "Keys: + and − zoom, arrows pan, Esc closes panels." | Write a key as a quoted word, "press 'Esc'", where a Kbd says it is a key                                                                        |
| Write the key as the keyboard prints it or the platform names it, in its own case: "Esc", "Enter", "−", "↑"                | Write it in capitals ("ESC"), as an emoji, or as an icon; the key's text is what a screen reader hears                                           |
| Name the left and right arrows in words, or all four as "arrows", as content design writes it: "arrows pan"                | Put "←" or "→" in a Kbd; the font Perron ships has no glyph for them, so they fall back to the system's monospace and look unlike the other keys |
| Give a combination one Kbd per key, with "+" between them in the text: `<Kbd>Ctrl</Kbd> + <Kbd>K</Kbd>`                    | Put a whole combination or a sentence in one Kbd; the box is sized for one key                                                                   |
| Mark the control a key works with `aria-keyshortcuts`, and keep the action reachable by pressing the control too           | Make the Kbd the only way to learn or do the action, or add `onClick` or `tabIndex` to it                                                        |
| Show key hints where people have a keyboard, such as the help on a desktop screen                                          | Show keys on a phone's screen, which has no keyboard to press them on                                                                            |
