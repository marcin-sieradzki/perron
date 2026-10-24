---
name: design-qa
description: "Design QA: the design-quality pass over a rendered component, pattern or screen in light and dark, with Defect, Polish and Direction findings. Use in a build's self-gate, in a review, or when asked how something looks."
---

The design-quality pass on its own: render what is in scope in both themes, judge every render against the foundations and its spec, and return findings. The `component-build` skill's self-gate and the `component-reviewer` agent both run it; anyone can run it on a component, a pattern, the whole library or a screen.

## Scope

One argument: a `<Name>`, a list of names, `all` (every entry in `packages/perron/components.json` past `designing`), or a screen's URL. With no entry past `designing` and no URL, report the empty scope of [`format.md`](format.md).

## Pre-flight

Read these before rendering anything:

- [`rendering.md`](rendering.md), how to render, and [`format.md`](format.md), how to report.
- The brand, `docs/foundations/README.md`, and the pages each line of the checklist below cites: `docs/foundations/semantic-spacing.md`, `docs/foundations/semantic-colours.md`, `docs/foundations/typography.md`, `docs/foundations/elevation.md`, `docs/foundations/icons.md` and `docs/foundations/accessibility.md`.
- The contract, `docs/components/README.md`: Styling, Design states, CSS and Families.
- For each component or pattern in scope: its spec (`docs/components/<name>.md` or `docs/patterns/<name>.md`), whose Tokens table is the expected token per part and state, and, where they exist, its read-back `penpot/<name>.json` and its exports `penpot/<name>/<Variant>.light.png` and `penpot/<name>/<Variant>.dark.png`, the approved design.
- For a screen: the spec of each pattern it shows, and `docs/foundations/layout.md`.

## Steps

1. **Render** every story in scope, or the screen at each breakpoint, in light and dark, as [`rendering.md`](rendering.md) says. Done when every story has a light and a dark screenshot and the tokens resolved in each; a page without tokens is the one finding, and the pass ends there.
2. **Judge** each pair against every line of the checklist below, measuring with computed styles and boxes where the line names a value, and looking at the screenshot for the rest. Done when every story and theme has been held to every line.
3. **Sort** each finding into Defect, Polish or Direction, and write the report in [`format.md`](format.md). A line of the checklist broken is a Defect. Uneven optical weight, a crowded part or an icon that measures centred but looks low is Polish. A doubt about the approved design itself is Direction. Done when each finding names its story, theme and part and the rule it breaks, and the `Checked:` line counts the stories.

Return the report to the caller. The self-gate fixes and runs the pass again; a run by hand ends with the report.

## Checklist

- **Alignment.** Edges, baselines and icon centres line up, within a part and across the variants of a story set. Measure with boxes: an icon's centre against its box's, a label's baseline against its neighbour's.
- **Spacing.** Every padding, gap and size is the token the spec's Tokens table names, read from the computed style. A value between steps, or a part the table gives no token, is a Defect.
- **Contrast.** Text reaches 4.5:1 on the surface it really sits on, and what shows a control's edge, focus or state reaches 3:1, as `docs/foundations/accessibility.md` sets. Its tables cover token pairs; a pairing they don't list, such as text on a tinted surface or on glass over content, is measured from the computed colours.
- **Token use.** Every rendered colour, length, font and shadow traces to a token in its role: a browser default (a serif font, black on white) or a token used outside the job its row in `docs/foundations/semantic-colours.md` gives it, such as `color.text.brand` on a link (its job is a brand outline button's label and hero emphasis, never links), is a Defect. `npm run gates -- component-css` holds the CSS source; this line holds what renders.
- **Themes.** Each surface, border, shadow and icon changes to its dark pair. A dark render that loses an edge, keeps a light shadow or shows a mark in light-theme ink is a Defect.
- **States move nothing.** Hover, focus, pressed, disabled, open, selected and invalid change colour, never geometry: compare each state's boxes with the rest state's, and any shift in size or position, such as a border that appears or a weight that reflows text, is a Defect.
- **Family.** A member of a family matches its row in the contract's Families table: fill, border, radius, hover, selected, text and height.
- **The design.** Anatomy, order and spacing match the Penpot export of the same variant. The visual stage measures this to the pixel; here a difference the eye can see is enough.
- **Text.** Each part uses the typography role the contract's family text rule gives. Long words, Danish and Swedish strings and a 320 px width wrap or truncate as the spec says, never overflow.
