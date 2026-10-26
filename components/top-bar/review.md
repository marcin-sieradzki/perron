# Review: TopBar, round 4

## P1

None.

## P2

- **P2-1.** `docs/patterns/top-bar.md:153` This round's new sentence says that on a phone "the filters' scrolling box ... clips a scrolled chip 4 px nearer the bar's edges too", and it presents the list as complete ("in these ways, and in no other"). The real shift is 8 px, so the claim is false. The filters' box is padded and negatively margined by `focus.width` plus `focus.offset`, which is 4 px (`TopBar.css:109–111`). That puts its clipping edge 12 − 4 = 8 px in from the bar's inner edge. Mylder's `.modes` has no padding or margin, so its edge is the 16 px Surface's glass renders. I measured this in `patterns-topbar--small-default` in both themes, next to a copy of Mylder's composition built in the same 375 px frame with its single-class rules: TopBar's box starts 8 px from the bar's inner edge and Mylder's starts 16 px from it. So a cut chip sits 4 px nearer than the chips themselves move, and 8 px nearer than in Mylder's bar. The clipping also shows at rest, not only on a scrolled chip. `SmallDefault`'s five chips are 489 px wide inside a 357 px box, so Train is already cut at that edge before any scroll. The same line still ends by listing the filters' focus-ring room among the rows that "change nothing Mylder shows at its sizes", which its own new sentence now contradicts. The maintainer settled that this line must state the swap's changes truly, so it has to give the 8 px (4 px from the phone's padding and 4 px from the ring room), say that the clipping shows at rest, and drop the ring room from the "change nothing" list.

## P3

- **P3-1.** `docs/patterns/top-bar.md:147` This row says the negative margin means "the room for the ring moves nothing", and CR-9 (line 219) says "the row's place in the bar is Mylder's". The chips and the row do stay where they were, but the scrolling box's edge moves 4 px out, where cut chips are clipped (see P2-1). Both lines should say that the margin keeps the chips in place, not that nothing moves. Missed in round 3.
- **P3-2.** `docs/patterns/top-bar.md:231` This round's new reason, "since a subject's args must hold no overrides", overstates the contract. The contract (`docs/components/README.md:109` and `:332`) asks only that the subject's args render the component alone and hold every word the caller gives. A plain override such as `filtersLabel` "Modes" passes as a string arg. What would fail is `WithLabels`' `{time}` phrases, because `expectOwnedStrings` fills placeholders only in dictionary templates (`packages/perron/src/testing/owned-strings.ts:126`). The wording is slightly loose, but the naming choice it explains holds, since `Labels` would sort before `MediumDefault`.

## Notes

I ran `npm run check` myself and it was green (exit 0): installed, tokens, registry, API, typecheck, every gate, lint, format, 79 of 79 unit test files with 967 of 967 tests, the website build, and 71 of 71 story files with 614 of 614 tests.

Since ea5fa49 the branch changed only:

- **Spec line 153:** the swap's on-screen changes.
- **Spec line 231:** the reason for the name `WithLabels`.
- **Data and records:** the regenerated `docs.json` and the factory records.

`TopBar.tsx`, `TopBar.css`, the stories, the test and the registry entry are byte-identical to ea5fa49.

Round 3's findings:

- **P2-1:** fixed. Line 153 now names the brand link's focus ring around a box 8 px wider than the lockup, its rounded corners and the larger hit area, which round 3 measured as 103 px against 95 px.
- **P3-1:** addressed. Line 231 now gives the reason for `WithLabels`, though its wording is P3-2 above.

Line 153's other new claims hold against the code. On a phone the bar is 12 px in from its ends and Mylder's 16 px. The brand, the status line and the tools sit 4 px nearer. The brand link's box is padded `space.100` with `radius.md` and taken back by its margin, so the lockup does not move.

Design QA covered all 10 stories in light and dark against the spec alone, since the design is deferred. The measures match round 3:

- **Wide bar:** 46 px tall, padded 4/16 px.
- **`SmallDefault`:** 90.3 px tall, padded 4/12 px. Mylder's copy is 114.3 px.
- **`Narrow`:** 190.6 px tall within its 320 px container.
- **Inks:** the status inks and the warning ink are as the Tokens table gives them in both themes.

With no code changed, these are as round 3 found them: the accessibility tree, the tab order, the target sizes, the owned strings in all four locales, API consistency with SourceLine and KioskBar, and test coverage, which is ticked in full.

Settled points I did not reopen: TopBar follows the measures Mylder's composition writes, and the visual stage's root-centre state driving is a recorded retro note.

The only tracked change in the worktree is the factory's own `stages.review` entry in `components/top-bar/pipeline.yaml`. It was there before this review began, and I left it alone.
