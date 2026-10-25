# Review: Alert, round 4

## P1

None.

## P2

None.

## P3

- **P3-1.** `docs/components/alert.md:122` The icon rows (lines 122 to 125, and `packages/perron/src/components/Alert/Alert.css:57`) draw the intent icon in `color.text.*`. The contract's Intents table (`docs/components/README.md:80`) gives icons the Mark column, `color.status.*`. NormalService already draws its icon in `color.text.success`, and question 6 approved the look in the Tokens table, so the maintainer chooses: keep `color.text.*` and say why in the spec, or move to the Mark column. Carried from round 1.
- **P3-2.** `packages/perron/src/components/Alert/Alert.css:50` The icon part is `1lh` of `body-sm`, 19.5 px tall, but a title's line is `heading-sm`, 18.2 px. In the Danger and Success stories, in both themes, the icon's centre measures 38.75 px against the title line's 38.1 px. So Tokens row `docs/components/alert.md:118` ("the icon sits on the middle of the first line") holds only when there is no title. The gap is under a pixel, but Toast inherits it. Carried from round 1.
- **P3-3.** `packages/perron/src/components/Alert/Alert.css:106` The close button is pulled up `space.200` and its box starts at y=21, so its focus ring's outer edge reaches the alert's 1 px transparent edge, and an `overflow: hidden` container would clip it. The pull is part of the approved Tokens table; a smaller pull such as `space.150` is the maintainer's call. Carried from round 1.
- **P3-4.** `docs/components/alert.md:211` CR-6 merges Alert's `onClick` first, so the caller's handler runs first, which Base UI's `mergeEventHandlers` confirms. That goes against the contract's Customising rule, "the component's own props last". Also, `slotProps.close` is typed with React's button props, so a caller can't call `event.preventBaseUIHandler()` without a cast. The contract should say which order handlers merge in, and how a close slot's handler is typed when there is no Base UI root. Carried from round 1.
- **P3-5.** `packages/perron/src/parts/IntentIcon/IntentIcon.tsx:18` The contract's Shared parts section says each part is drawn in `<Part>.tsx` and `<Part>.css`. IntentIcon has no `IntentIcon.css`, and its `pn-IntentIcon` class styles nothing. Either the contract allows a part with no CSS, or the class has no job yet. Carried from round 1.
- **P3-6.** `docs/components/alert.md:210` CR-5 ends "so a caller that swaps the icon's element leaves `aria-hidden` off it", which is not what happens. `useRender` merges `mergeProps(props, render.props)`, so a plain `render: <span />` keeps `aria-hidden="true"`. Only an element that sets `aria-hidden={false}` itself, or a function `render` that drops the props, takes it off. EmptyState CR-2 and StationIcon CR-3 use the same words, so the shared wording could say "can take `aria-hidden` off it with its own props". Carried from round 2.
- **P3-7.** `docs/components/alert.md:189` The "Native semantics first" line says "the one ARIA is the root's `role="status"`, which no element says". Two parts of that are wrong. HTML's `<output>` maps to `status`, though it is meant for a calculation's result and is the wrong element for a message. And the icon part and the `IntentIcon` svg also carry `aria-hidden`. The sentence ships in `packages/perron/data/docs.json`. It could read "the one role is the root's `role=\"status\"`, since `<output>`, the one element with that role, is for a calculation's result" (contract checklist, Native semantics first).
