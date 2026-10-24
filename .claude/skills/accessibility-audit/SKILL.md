---
name: accessibility-audit
description: "Accessibility audit of rendered components, patterns or screens beyond axe: the contract's checklist against the accessibility tree, focus order, reduced motion and target size. Use in a build's self-gate or a review, or to audit the library or a screen."
---

axe runs on every story in `npm run test:stories`, so most of WCAG's machine-checkable rules already fail the build. This audit covers the rest: the contract's checklist of what axe won't catch, held against what a screen reader and a keyboard actually meet.

## Scope

One argument: a `<Name>`, a list of names, `all` (every entry in `packages/perron/components.json` past `designing`), or a screen's URL. With no entry past `designing` and no URL, report the empty scope of [`format.md`](../design-qa/format.md).

## Pre-flight

Read these before rendering anything:

- `docs/foundations/accessibility.md`: the target, the rules, and what a person checks.
- The contract, `docs/components/README.md`: What axe won't catch, Design states and Words.
- For each entry in scope: its spec's Keyboard and ARIA section, with its own copy of the checklist, and its stories.
- [`rendering.md`](../design-qa/rendering.md), how to render, and [`format.md`](../design-qa/format.md), how to report.

## Steps

1. **axe.** Run `npm run test:stories`; for one entry, `npx vitest run --project stories <path to its stories file>`. For a screen, add `node_modules/axe-core/axe.min.js` with `page.addScriptTag({ path })` and run `axe.run()` in the page, in both themes. Done when the run is green, or each violation is a Defect citing its axe rule id.
2. **The accessibility tree.** For every story, and each state its `play` test reaches (an open popup, an invalid field), list the tree with `ariaSnapshot()`: each landmark and control with its role, name and state, then the text inside `aria-hidden` and `inert` elements, read with `page.evaluate`. Hold the list to each line of What axe won't catch. Done when every story has its list and every checklist line is met or is a Defect citing it.
3. **Keys and focus.** Press every key in the spec's Keyboard table and check what it does. Tab through each story and record the focused element after each press; the order follows reading order, and closing anything returns focus to where it came from. Done when every key in the table is pressed and every story tabbed through.
4. **Reduced motion.** With `reducedMotion: 'reduce'` emulated, `document.getAnimations()` holds no running animation whose `effect.getComputedTiming().iterations` is `Infinity`. Done when every story that animates has been checked.
5. **Target size.** Every element a person presses has a box at least `size.target-min` square, read from the computed `--perron-size-target-min`, or that much room around it. Done when every interactive node in every story is measured, with `ariaSnapshot({ boxes: true })`.
6. **Forced colours and reflow.** With `forcedColors: 'active'` emulated, the focus ring and the selected state still show. At 320 px wide, nothing is cut off or overlaps. Done when each story has a screenshot of both.
7. **Report** in [`format.md`](../design-qa/format.md): a broken rule or checklist line is a Defect. After the findings, add a `Not checked:` line naming each line of the foundation's "What a person checks" this run could not see, such as live-region announcements in a real screen reader. Done when every step's findings are in it.

Return the report to the caller.
