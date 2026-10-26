# Review: TopBar, round 1

## P1

None.

## P2

- **P2-1.** `docs/patterns/top-bar.md:145` The spec says "Every measure is Mylder's composition's, so the swap changes nothing on screen", but Mylder's composition as the ticket quotes it does not render the measures it writes. Its `.bar` rule (specificity 0,1,0) loses `padding-block` and `padding-inline` to Surface's `.pn-Surface[data-variant='glass'] { padding: var(--perron-space-400) }` (0,2,0), so Mylder's bar renders with 16 px of padding on every side. I rebuilt Mylder's markup and CSS beside the `Default` and `Small` stories: Mylder's bar is 68 px tall and TopBar's is 46 px on a wide screen; on a 375 px phone they are 114 px and 90 px. So swapping Mylder's bar for TopBar changes what people see, against the ticket's "Done when" (perron#159) and this line's claim, which line 7 ("the reference this spec follows for every measure") and line 103 ("the pattern sets only its padding") rest on. No rule says whether TopBar should match the padding Mylder renders or the padding it writes. TopBar's measures agree with Layout's `size.top-bar` (46 px), so the recommended fix keeps the code and rewrites line 145 to name the change and its cause (Mylder's own padding loses to Surface's). The maintainer then decides whether that meets the ticket.
- **P2-2.** `docs/patterns/top-bar.md:111` In story `patterns-topbar--narrow`, light and dark, on the `identity` and `tools` parts: a `medium` bar's `padding-block: 0` (this Tokens row) means that when the bar wraps, as CR-10 says it does at 320 px, its first and last rows touch the glass. The status line's top is 1 px inside the root's top border, and the "Dansk" link and About button end at the bottom border, inside the `radius.xl` corners. The rules allow it, but it looks cramped (design-qa Polish). A `space.100` block padding for `medium` would fix it and leave the one-row bar at 46 px: under `box-sizing: border-box`, 34 px of content + 8 px of padding + 2 px of border is still under `size.top-bar`, so `min-block-size` still sets the height.
- **P2-3.** `docs/patterns/top-bar.md:217` CR-15 says TopBar has "no hover, pressed or focus look of the pattern's own", and line 103 says "TopBar draws no interactive part of its own", but with `brandHref` the pattern makes its own `brand` part an `<a href>` (CR-5). That part is pressed to navigate, and it changes neither on hover nor when pressed: neither `TopBar.css` nor `Brand.css` has a `:hover` or `:active` rule. This breaks the contract's Pointer feedback rule, and the contract names no exception for this part. Per Levels, a spec line that allows a contract breach does not excuse it. The spec needs hover and pressed rows (and the cursor rows) in its Tokens table for the `brand` part as a link, with CSS for them and a `play` check by `stateFill` and `pressedAfterHover`. The other way out is for the maintainer to write an exception into the contract itself.
- **P2-4.** `docs/patterns/top-bar.md:233` Test coverage: one line in the Stories table is unticked. `Narrow`'s `play` cell promises "The bar wraps onto more rows" (CR-10, "a `medium` bar wraps its groups"), but the `play` only shows the chips wrapping inside `filters`, the status line breaking, and nothing reaching past the container. No step checks that the groups themselves take more than one row, for example the `tools` group's top below the `identity`'s bottom. Every other Keyboard row (Tab and Shift+Tab, in `Default`, `Small` and `NoFilters`), every other `play` cell and each visible `CR-n` is proven by a step.

## P3

- **P3-1.** `docs/patterns/top-bar.md:205` CR-3 says "the tools stay on the first row", and the `Small` row says "the tools end the first row". That fails in a `small` bar 320 px wide whose status line is paused and out of date. I rendered `Narrow`'s args with `size` small, in Danish: the identity column fills the first row, and the tools drop to a row of their own between it and the filters. Nothing overflows, and Tab still follows the order on screen. Should the spec say the tools may take a row of their own on the narrowest phones, or should the status line give way, for example with `flex-shrink` on `identity`, so the tools keep the first row?
- **P3-2.** `packages/perron/src/patterns/TopBar/TopBar.css:16` Two of TopBar's rules win only because of stylesheet order. `.pn-TopBar[data-size='medium']` and `[data-size='small']` have the same specificity (0,2,0) as Surface's `.pn-Surface[data-variant='glass']`, and `.pn-TopBar-status` the same as Text's `.pn-Text` (0,1,0), so TopBar's padding and `overflow-wrap: break-word` win only because `TopBar.tsx` imports Surface and Text before `./TopBar.css`. That holds in Storybook, but a consumer bundler that chunks CSS by route could reorder the sheets. It is the same tie Mylder's own `.bar` loses (P2-1). The contract's "one class, then attributes" rules out raising the specificity in the selector. Is source order an acceptable guarantee for a glass pattern's padding, or should the contract give the Glass line a way to win, such as a cascade layer for component CSS?
- **P3-3.** `packages/perron/src/patterns/TopBar/TopBar.tsx:181` `data-paused` and `data-out-of-date` sit on the `status` part, where SourceLine, the line this one matches, puts `data-paused` on its root. A caller styling a paused bar, or a test, then selects `.pn-TopBar-status[data-paused]` rather than `.pn-TopBar[data-paused]`. The contract's Styling line on bare boolean attributes doesn't say which element carries them when only a part changes look. Should these attributes move to the root, as SourceLine has them, or stay on the part that changes?

## Notes

I ran `npm run check` myself, and it was green (exit 0): tokens, registry, API, typecheck, every gate, lint, format, unit tests, the website build with its anchor check, and 71 of 71 story files with 612 of 612 tests.

Design QA covered all 8 stories in light and dark against the spec alone, since the design is deferred. I measured these from the rendered styles:

- The glass is Surface's: `color.surface.overlay` at 0.9 and 0.88, `blur(16px) saturate(1.3)`, and a 16 px radius.
- Padding is 0/16 px for `medium` and 4/12 px for `small`. Gaps are 12/4 px between groups, 8/4 px between chips in a `medium` bar, 4 px between chips in a `small` bar, and 4 px between tools.
- The status line is JetBrains Mono `data-sm` in `color.text.secondary`, "Paused" is in `color.text.primary`, and the out-of-date phrase is in `color.text.warning`, in both themes.
- In a `small` bar, the filters' ring room is 4 px, taken back exactly by the negative margins, so the chips line up with the bar's content edge.

The accessibility tree matches the spec's ARIA table: a link "Mylder" (or a `span` without `brandHref`), the `time`, a group "Filters" or "Filtre", and no live region. Tab order follows the order on screen in both sizes. Every target is at least 24 px. Nothing loops under reduced motion. Under forced colours the glass edge and the focus ring show, and the paused and out-of-date states remain as words.

API consistency with KioskBar and SourceLine holds:

- `slotProps.brand`'s type matches KioskBar's.
- The `slotProps` JSDoc matches the family's.
- `sourcePausedLabel` reuses SourceLine's key.
- The root's `{...rest}` comes first, and `classes` gives "pn-Surface pn-TopBar <caller's>".

The `slotProps` merge is a spread followed by the pattern's own props, because a pattern may not import `mergeProps`. The pattern sets no handler, style or ref on any part, so no caller prop is lost.

The four dictionaries' new keys read well. Danish is "Opdateret {time}", "Opdateret {time}, måske forældet" and "Filtre"; Swedish is "Uppdaterad …" and "Filter"; Norwegian is "Oppdatert …" and "Filtre". All are in sentence case, and the out-of-date wording is SourceLine's. A changeset is present.

The only tracked change in the worktree is the factory's own `stages.review` entry in `components/top-bar/pipeline.yaml`. It was there before this review began, and I left it alone.
