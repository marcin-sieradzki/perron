# Section

A titled group of content inside a panel or a page, such as a stop's departures or the lines that call at it: a small heading in capitals, an optional action beside it, and the caller's content below.

The design is deferred (ADR 0010, `docs/adr/0010-unattended-runs-with-design-deferred.md`): this spec decides what the drawing would, from the [contract](README.md), the [foundations](../foundations/README.md), [content design](../content-design.md) and the tokens. Section has no Base UI component and nothing in `dependsOn`, and the extracted prototype is not reachable from this branch, so nothing here rests on it. Its one firm source is the token `typography.overline`, whose description is "Section headings and tags, set in capitals".

## Anatomy

Penpot page `Components/Section`. Family: none, since it is content on its container's surface and joins no family's treatment. Shared parts: none.

The drawing has no variant property, so its one variant is `Default`, and no `State` property, since Section is not interactive and has only its rest state. Its layers are the parts below.

| Part (Penpot layer) | What it is                                                                                                                      | Base UI part                              | Class                | `slotProps` key |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | -------------------- | --------------- |
| `root`              | A `section` stacking the header above the content, named by its title. Penpot's main instance, a vertical flex board            | None: `useRender`, a `section` by default | `pn-Section`         | none            |
| `header`            | A `div` laying out the title and the action in a row                                                                            | None: `useRender`, a `div` by default     | `pn-Section-header`  | `header`        |
| `title`             | An `h3` holding the caller's `title`, set in capitals: what the section is about                                                | None: `useRender`, an `h3` by default     | `pn-Section-title`   | `title`         |
| `action`            | A `div` at the end of the header holding the caller's `action`, such as a link to everything the section shows; only when given | None: `useRender`, a `div` by default     | `pn-Section-action`  | `action`        |
| `content`           | A `div` holding the caller's `children`; only when given                                                                        | None: `useRender`, a `div` by default     | `pn-Section-content` | `content`       |

No part has a Base UI component, because none has behaviour for Base UI to give: no focus, keys, state or popup. Each part renders through Base UI's `useRender` hook instead, as EmptyState's do ([EmptyState](empty-state.md)), so each takes `render`: the root through the `render` prop, an inner part through its `slotProps` key.

- The root is a `section` named by its own title, through `aria-labelledby` pointing at the title's `id`, so it is a named region a screen reader can list and jump to. A `section` is the native element for a group under its own heading, the contract's checklist asks a named region for its name "from the component's own heading through `aria-labelledby` where it has one", and a caller who wants a plain group renders the root as a `div` through `render`, which drops the region and keeps the heading.
- The title is an `h3` by default, its level changed through `slotProps.title.render` (`render: <h2 />`, `<h4 />`), with no `level` prop. Sections sit inside a detail panel whose title is always an `h2` ([DetailHeader](../patterns/detail-header.md)), so `h3` is the level the commonest use needs; `render` is the contract's one way to swap an element, as EmptyState's title is swapped, and a `level` prop would be a second way.
- Section wraps its `children` in a `content` part, rather than laying them straight into the root. The root's gap then sits once between the header and the content, however many children the caller gives, and the content's own layout (a list, a grid, a run of paragraphs) stays the caller's, with `slotProps.content` to reach it.

## Base UI parts

No Base UI component: each part renders through the `useRender` hook from `@base-ui/react/use-render`, and merges its props with `mergeProps` from `@base-ui/react/merge-props`, at the version pinned in `packages/perron/package.json` (1.9.0). `baseUiParts` stays empty in `packages/perron/components.json`.

| Base UI part            | Renders   | Perron sets                                                                                                                                        | Passed through                                                            |
| ----------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `useRender` for root    | `section` | `defaultTagName: 'section'`, `ref`, the class `pn-Section`, `aria-labelledby` with the title's `id` (CR-2), and the header and content as children | `render`, `className`, `style`, `ref` and the rest of the `section` props |
| `useRender` for header  | `div`     | `defaultTagName: 'div'`, the class `pn-Section-header`, the title and action as children                                                           | `slotProps.header`                                                        |
| `useRender` for title   | `h3`      | `defaultTagName: 'h3'`, the class `pn-Section-title`, `id` (`slotProps.title.id`, else one from React's `useId`), `title` as children              | `slotProps.title`, its `render` changing the heading's level              |
| `useRender` for action  | `div`     | `defaultTagName: 'div'`, the class `pn-Section-action`, `action` as children; left out when `action` renders nothing (CR-1)                        | `slotProps.action`                                                        |
| `useRender` for content | `div`     | `defaultTagName: 'div'`, the class `pn-Section-content`, `children` as children; left out when `children` renders nothing (CR-1)                   | `slotProps.content`                                                       |

Base UI already does: swapping each part's element through `render` while keeping its class and props, joining `className` strings and `style` objects and chaining event handlers in `mergeProps`, setting `ref` on the rendered element, and rendering nothing for a part whose `enabled` is `false`.

## Props

In MUI's layout. Every prop here gets this description as its JSDoc. Slots come last.

| Name                | Type                              | Default | Base UI prop            | Description                                                                                                                                                                                          |
| ------------------- | --------------------------------- | ------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`             | `ReactNode`                       |         | none                    | What the section is about, in a word or two and in sentence case: "Departures". Set in capitals by the style; it names the section for screen readers. Required. Replaces the HTML `title` attribute |
| `children`          | `ReactNode`                       |         | none                    | The section's content, below the title                                                                                                                                                               |
| `action`            | `ReactNode`                       |         | none                    | One small action at the end of the header, such as a small `outline` LinkButton to everything the section lists                                                                                      |
| `render`            | Base UI's `render`                |         | inherited               | Allows you to replace the component's HTML element with a different tag, or compose it with another component. Accepts a `ReactElement` or a function that returns the element to render.            |
| `className`         | `string`                          |         | none                    | Joined after `pn-Section` on the root                                                                                                                                                                |
| `style`             | `CSSProperties`                   |         | none                    | Reaches the root                                                                                                                                                                                     |
| `ref`               | `Ref<HTMLElement>`                |         | none                    | Reaches the root element, whichever element `render` makes it                                                                                                                                        |
| `slotProps.header`  | `useRender.ComponentProps<'div'>` |         | `useRender` for header  | Props for the `header` part                                                                                                                                                                          |
| `slotProps.title`   | `useRender.ComponentProps<'h3'>`  |         | `useRender` for title   | Props for the `title` part. Its `render` changes the heading's level, `render: <h2 />`, and its `id` is the one the root's `aria-labelledby` points at                                               |
| `slotProps.action`  | `useRender.ComponentProps<'div'>` |         | `useRender` for action  | Props for the `action` part                                                                                                                                                                          |
| `slotProps.content` | `useRender.ComponentProps<'div'>` |         | `useRender` for content | Props for the `content` part                                                                                                                                                                         |

`render`, `className`, `style`, `ref` and the other `section` props reach the root, as the contract's Root section says; `render` is inherited from `useRender.ComponentProps<'section'>` as it is, with Base UI's JSDoc, and `SectionProps` does not declare it again. `title` and `children` are left out of the inherited props and declared again, as EmptyState does. No owned string, so no `*Label` prop. The names `title` and `action` are MUI's (`CardHeader`) and EmptyState's, and none of the names is one the contract's [Names from other libraries](README.md#names-from-other-libraries) table bans.

- Section takes an `action`, one node at the end of its header. A list in a panel often leads to the whole of itself ("All departures", "Show on map"), and a slot keeps that link beside the heading it belongs to, aligned the same way in every section, where a caller's own row would differ from one screen to the next.
- Section ships with no `variant`, `size` or `color`, one look everywhere. The uses known now (the groups of a stop, line or vehicle panel, a settings sheet) share one heading style, `typography.overline` has one size, and any of the three can join later as an optional prop without a break.

## Tokens

One row per part, state and property. Section has no interactive state of its own, so every row is rest; the caller's action and content keep their own states.

| Part      | State | Property         | Token                                                             |
| --------- | ----- | ---------------- | ----------------------------------------------------------------- |
| `root`    | rest  | `gap`            | `space.300`                                                       |
| `header`  | rest  | `gap`            | `space.200`                                                       |
| `title`   | rest  | `font`           | `typography.overline`                                             |
| `title`   | rest  | `letter-spacing` | `typography.overline`, its tracking                               |
| `title`   | rest  | `color`          | `color.text.secondary`                                            |
| `title`   | rest  | `text-transform` | none: the keyword `uppercase`, as the role's class sets it (CR-7) |
| `action`  | rest  | `gap`            | `space.200`                                                       |
| `content` | rest  | none             | none: the content's look and layout are the caller's              |

The root is a flex column; the header is a flex row that wraps, its items centred on the cross axis, the title growing and the action keeping its size at the inline end; the action is a flex row that wraps. Every part resets the browser's margins to 0 and adds none of its own, so the `h3` brings no browser margin and the caller spaces sections.

- The title is `typography.overline` in `color.text.secondary`. The role's own use is "Section headings and tags, set in capitals"; its 11 px semibold capitals sit under a panel's `heading-md` title and above `label` rows without competing with either, and `color.text.secondary` reaches 4.5:1 on every opaque surface in both themes (6.77:1 at its lowest in light, on `color.surface.inset`, and 5.71:1 in dark, on [Accessibility](../foundations/accessibility.md#text-on-surfaces)), where `color.text.primary` would make every group heading as loud as the rows under it.
- The header and the content are `space.300` apart, and the title and the action `space.200`. [Semantic spacing](../foundations/semantic-spacing.md#space) sets the parts of a detail panel 12 px apart and the blocks of a pane 24 px apart, so a heading sits nearer its own content than the section before it, which reads as belonging to what follows. The header is as tall as its tallest item, with the title centred in it: with no action the header is the title's own line, 12 px above the content, and beside a small LinkButton (`size.button-sm`, 30 px) the header is 30 px tall and the title's text sits about 20 px above the content. The 8 px between title and action is the gap the components use between items in a row, such as EmptyState's actions.
- Section draws no surface, divider or padding of its own, and adds no margin, so sections take the panel's surface and the caller spaces them. It is content, not a card: a box of its own would join no family and stack a box inside the panel's, a box is Surface's job ([Surface](surface.md)) and a caller wraps a section in one when it needs one; the space between sections, `space.600` for blocks of a pane, is the caller's layout, as the contract has components size to their container.

## Keyboard and ARIA

Section has no keys of its own and is never focusable. The caller's action, then the caller's content, are reached in reading order.

| Key         | Does                                                                               | From        |
| ----------- | ---------------------------------------------------------------------------------- | ----------- |
| `Tab`       | Moves to the first focusable element in the action, then on into the content       | The browser |
| `Shift+Tab` | Moves back through the content and the action, out to what came before the Section | The browser |

| Element   | Role                                                                                       | Accessible name from                                     | States announced |
| --------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------- | ---------------- |
| `root`    | `region`, from a `section` with an accessible name; generic when `render` makes it a `div` | `aria-labelledby`, the title's `id`: its text            | None             |
| `header`  | None (generic `div`)                                                                       | None                                                     | None             |
| `title`   | `heading`, level 3, or the level `slotProps.title.render` gives                            | Its text, from `title`, read as written in sentence case | None             |
| `action`  | None (generic `div`); the caller's controls carry their own roles                          | The caller's controls' own names                         | Theirs           |
| `content` | None (generic `div`); the caller's content carries its own roles                           | None                                                     | None             |

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: the eye gets a grouping under a heading, and the ear the same heading and a region named by it; the capitals are style over sentence-case text (CR-7), so a screen reader reads the word, not its letters.
- [ ] Every landmark and named region has an accessible name: the root is a `section` named by its own title through `aria-labelledby` (CR-2), and the `Default` story's `play` checks the region's name.
- [ ] Every default label can be overridden: none here; Section owns no string.
- [ ] Every shape the type accepts renders, in every variant: `title`, `action` and `children` each render a string, an element and an array; the title is a heading, so it takes phrasing content, and `content` and `action` are `div`s, so block content such as a list is valid inside them.
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here; nothing animates or collapses.
- [ ] Native semantics first: a native `section` and `h3`, with `aria-labelledby` the only ARIA, naming the region from the heading that is already there; the action holds the caller's own `a href` or `button`.
- [ ] Focus moves in reading order and returns on close: the title, the action and the content follow each other in the DOM as on screen, including when the header wraps (CR-6); Section never moves focus, and nothing in it closes.
- [ ] Every target is at least `size.target-min` square: Section has no target of its own; the action's targets are the caller's components, which keep their own sizes (a small LinkButton is `size.button-sm`).
- [ ] Loops stop when the system asks for less motion: none here; nothing moves.

## Owned strings

No owned strings: every word Section shows or announces comes from the caller, through `title`, `action` and `children`, and the region's name is the title.

## Component rules

Rules for this component alone, numbered so the build and the review can cite them.

- **CR-1.** The optional parts render only when given: no `action` part without `action`, no `content` part without `children`. A value that renders nothing (`null`, `undefined`, a boolean, `''`, or an array of only such values) counts as not given, so no empty wrapper takes up a gap. The root, the header and the title always render: `title` is required.
- **CR-2.** The title's `id` is `slotProps.title.id` when given, else one from React's `useId`, and the root's `aria-labelledby` is set to it after the caller's rest props, so the region is always named by its own heading.
- **CR-3.** `title`, `action`, `children`, `slotProps` and `render` are taken out of the rest props before they reach the root, so the HTML `title` attribute never reaches the element and a hover tooltip never repeats the heading.
- **CR-4.** Each inner part's props are its `slotProps` value merged with `mergeProps`, the component's own props last, so its class, `id` and children stay while the caller's `className` joins and its `render` swaps the element, such as the title's heading level. An element given as `render` is merged over all of these, as Base UI's `useRender` merges its element's own props last, so the element carries no `id` or children of its own: an `id` on it replaces the title's, and the root's `aria-labelledby` then points at nothing.
- **CR-5.** Section sets no `background`, `border`, `padding`, `box-shadow`, `inline-size` or `max-inline-size`, and every part sets `margin: 0`, resetting the browser's margins and adding none of its own: it sizes to its container on the surface it sits on, and the space between sections is the caller's.
- **CR-6.** The header wraps: the title grows to fill its line and the action keeps its own size at the inline end (`margin-inline-start: auto`). When the title's text and the action don't fit on one line together, the action moves onto its own line below the title, still at the inline end and in the same reading order, so beside "Driftsforstyrrelser" on a 320 px screen the action sits under the title. The title can shrink below its longest word (`min-inline-size: 0`) and breaks a word longer than its line (`overflow-wrap: anywhere`), so a single long word never overflows the section.
- **CR-7.** The title sets `text-transform: uppercase`, as the `perron-typography-overline` class does; the source text stays in sentence case, as content design asks, and the DOM and the region's name keep it.
- **CR-8.** Section never sets `overflow`, so a focused child's ring, drawn `focus.offset` outside it, is never cut at the edge.
- **CR-9.** Section never moves focus, sets no `tabindex` and adds no role beyond its native elements.

## Stories

One per variant and state the design would show. The design is deferred and has no variant property, so its one variant is `Default`; `TitleOnly` is the same variant with the optional props left out, and proves CR-1; `HeadingLevel` is the same variant with the title's level changed, and proves CR-4. Each sits on a `raised` Surface, as a section sits in a panel.

| Story          | Shows                                                                                                                                                                                      | `play` test                                                                                                                                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Default`      | Every part: `title` "Departures", `action` a small `outline` LinkButton "All departures" with an `href`, and `children` a list of three departures, such as "5C Husum Torv 08:14", at rest | A `region` named "Departures" holds a heading of level 3 named "Departures"; the title's computed `text-transform` is `uppercase` while its DOM text is the sentence case; Tab reaches "All departures" and Shift+Tab leaves it, so focus ends where it started |
| `TitleOnly`    | `title` "Lines here" and `children` a sentence, with no action                                                                                                                             | No `pn-Section-action` element renders; the `pn-Section-content` part holds the sentence; nothing in the section takes focus                                                                                                                                    |
| `HeadingLevel` | `title` "Planned works", `slotProps.title.render` an `h2`, and `children` a sentence about planned works on a line                                                                         | The title is a heading of level 2 that keeps `pn-Section-title`, and the `region` is still named "Planned works"                                                                                                                                                |

## Do and don't

For a caller using the component, with the reason.

| Do                                                                                                                                               | Don't                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Write the title in sentence case, a word or two, and let the style set the capitals: "Departures"                                                | Type the title in capitals: a screen reader may spell it out letter by letter, and content design writes source text in sentence case |
| Give the title the level that fits the page's outline through `slotProps.title.render`: `h3` under a panel's `h2`, `h4` inside an `h3`'s section | Skip a level, or wrap a heading element inside `title`: the part is already a heading, and a heading inside a heading is invalid      |
| Put one small, neutral action in the header, such as a small `outline` LinkButton to the whole list                                              | Put the panel's main action, or a `brand` button, in a section's header: a screen has one brand action, and it belongs to the panel   |
| Space sections apart in the caller's layout, `space.600` between blocks of a pane                                                                | Add margins or padding to Section with raw values, or rely on it for the space between sections: it adds none                         |
| Wrap a section in a Surface when it needs a card or a box of its own                                                                             | Add a fill, border or shadow to Section through `className`: a box is Surface's job, and the ladder lives there                       |
| Render the root as a `div` through `render` when the group is too small to be worth a region of its own                                          | Leave a screen full of tiny named regions: a screen reader's landmark list then says less than its headings                           |
| Leave a group that opens and closes to a collapsible component, built on Base UI's Collapsible                                                   | Build a collapsible group from Section by hiding its content: it brings no button, state or keys                                      |
| Set the title's `id` through `slotProps.title.id`                                                                                                | Put an `id` on the element in `slotProps.title.render`: it replaces the generated one and the region loses its name                   |
