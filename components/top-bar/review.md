# Review: TopBar, round 2

## P1

None.

## P2

- **P2-1.** `docs/patterns/top-bar.md:153` This round rewrote this line, and it now says the bar's height "is the one change on screen" when Mylder's bar is swapped for TopBar, but two more changes show. First, with `brandHref` the brand link now fills on hover (`color.surface.hover`, rgba(18, 24, 27, 0.05) light and rgba(235, 238, 235, 0.06) dark, measured on `patterns-topbar--default`) and fills again while pressed (`color.surface.selected`, 0.09). Mylder's `<Brand render={<a href />} />` has neither fill. Second, on a phone the inline padding drops from the 16 px Mylder renders (line 103: "`space.400` on every side") to TopBar's 12 px, so the brand, the status line, the tools and the chips each move 4 px toward the bar's edges. The maintainer settled that the spec only has to state the swap's change truly (the fix asked for by round 1's P2-1, at this line), so the line has to name the brand's hover and pressed fills and the phone's inline padding next to the heights.

## P3

- **P3-1.** `packages/perron/src/patterns/TopBar/TopBar.css:2` This round's brand-link change made the file's header comment false. It still says "Every row is at rest: the bar draws no interactive part of its own. No fill, edge, radius or shadow beyond Surface's, which it only pads", but lines 46–61 now give `.pn-TopBar-brand[href]` a `radius.md`, hover and pressed fills, and a cursor. CR-15 and spec line 103 hold, so the comment should say what they say (content-audit: the words in the code).
- **P3-2.** `docs/patterns/top-bar.md:15` The spec says the drawing has no `State` property, yet the pattern now draws a hover look and a pressed look of its own for the `brand` link (Tokens rows 120–126). `penpot/README.md:21` says "Interaction states are a `State` property". Without one, the design run has no variant to draw those looks in, and no story pairs with them in the visual check. Should the drawing take a `State` (`default`, `hover`, `pressed`) for the brand link, with `DefaultHover` and `DefaultPressed` stories? Or should the spec say where the design run draws these looks instead?

## Notes

I ran `npm run check` myself and it was green (exit 0): tokens, registry, API, typecheck, every gate (`pointer-feedback` included), lint, format, the unit tests, the website build with its anchor check, and 71 of 71 story files with 612 of 612 tests.

Round 1's findings:

- **P2-1:** fixed, except for the overclaim above. Lines 7 and 103 now give the cause, Mylder's one-class `.bar` losing its padding to `.pn-Surface[data-variant='glass']`. I did not reopen the 46 px against 68 px question, since the maintainer settled it.
- **P2-2:** fixed. A `medium` bar now has a `space.100` block padding, and a one-row `Default` is still exactly 46 px tall: 34 px of content, 8 px of padding and 2 px of border.
- **P2-3:** fixed. The brand link lays `color.surface.hover` inside `(hover: hover)`, then `color.surface.selected` in a later rule outside the query, with `cursor: pointer`. Its box is padded `space.100` at its sides and taken back by the margin, so the mark still starts at the identity's edge. `Default`'s `play` checks this with `stateFill` and `pressedAfterHover`. I drove a real hover and then a press in both themes, and each state's fill differs from the one before.
- **P2-4:** fixed. `Narrow`'s `play` now checks that the filters start below the identity and the tools below the filters.
- **P3-1:** addressed. A `small` identity is now `flex: 1 1 0` with `min-inline-size: 0`, and a new `Small` step shows the tools keeping the first row at 320 px under the paused, out-of-date Danish line.
- **P3-2:** still open, and it goes on the PR as before. Both the source-order tie between TopBar's padding and Surface's and the `overflow-wrap` tie with Text are unchanged. The new `.pn-TopBar-brand[href]` rules beat `.pn-Brand` on specificity, so they don't depend on that tie.
- **P3-3:** addressed. `data-paused` and `data-out-of-date` are on the root, as on SourceLine, and the CSS, the Base UI parts row, CR-4, CR-11, CR-12 and the stories all agree.

Design QA covered all 8 stories in light and dark against the spec alone, since the design is deferred:

- **`Default`:** 46 px tall, padded 4/16 px.
- **`Small` at 375 px:** 90.3 px tall, padded 4/12 px. The tools end the first row, and the chips scroll with ring room that moves nothing.
- **`Narrow` at 320 px:** 190.6 px tall. Its first and last rows sit 4 px inside the glass, and nothing reaches past the bar.
- **The brand link's focus ring:** it now follows the `radius.md` box and sits about 4 px from the status line, as close as the rings of neighbouring chips sit to each other.

The accessibility tree, the tab order in both sizes, the target sizes, the owned strings in all four locales and API consistency with SourceLine and KioskBar are unchanged since round 1, apart from the root's state attributes, which now match SourceLine.

Test coverage: every Keyboard row, every promise in a Stories `play` cell and each visible CR-n is ticked by a step, including the new brand-link, CR-3 and `Narrow` row checks.

The only tracked change in the worktree is the factory's own `stages.review` entry in `components/top-bar/pipeline.yaml`. It was there before this review began, and I left it alone.
