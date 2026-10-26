# Review: TopBar, round 5

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/patterns/TopBar/TopBar.stories.tsx:452` This comment in `SmallDefault`'s CR-9 step still says "the room moves nothing". That is the wording round 4's P3-1 asked to change, and this round did change it at spec line 147 and in CR-9 (line 219). It is not true: the margin keeps the chips where they were, but the scrolling box's clipping edge moves 4 px out. The comment should say what the line now says: "the margin keeps the chips in place". Missed in round 4.

## Notes

I ran `npm run check` myself and it was green (exit 0). That covers installed, tokens, registry, API, typecheck, every gate, lint and format. It also covers 79 of 79 unit test files with 967 of 967 tests, the website build, and 71 of 71 story files with 614 of 614 tests.

Since 13cfd52, the branch changed only these:

- **Spec line 147:** the margin's reason.
- **Spec line 153:** the swap's measured changes on screen.
- **Spec line 219:** CR-9's last clause.
- **Spec line 231:** the reason for the name `WithLabels`.
- **Data and records:** the regenerated `docs.json` and the factory records.

`TopBar.tsx`, `TopBar.css`, the stories, the test and the registry entry are byte-identical to 13cfd52.

Round 4's findings:

- **P2-1:** fixed. Line 153 now says that a phone's filters clip 8 px nearer the bar's ends than Mylder's, 4 px from the padding and 4 px from the ring's room. It says a chip is cut at rest, and it has dropped the ring's room from the "change nothing" rows. It also no longer claims to list every change. I measured `patterns-topbar--small-default` at 375 px in light and dark. Measured from the bar's inner edge (inside its 1 px glass border), the filters' scrolling box starts 8 px in and the first chip, the mark and the tools 12 px in. Mylder's composition gives 16 px, because its `.modes` has no padding or margin. The box is 357 px wide and its chips are 489 px, so Train is cut at the right edge before any scroll.
- **P3-1:** addressed in the spec at lines 147 and 219. The story comment above still uses the old wording.
- **P3-2:** addressed. Line 231 now gives the actual reason, and it holds. `expectOwnedStrings` builds its templates from the dictionary alone (`packages/perron/src/testing/owned-strings.ts:126`). The caller's "As of {time}" therefore can't match "As of 08:14:05". The contract story takes the alphabetically first story when there is no `Default` (`storybook/contract/subjects.ts`).

I checked the rest of line 153 against the code (`TopBar.css:25–29, 48–53, 100–112`) and Mylder's CSS in the ticket. The phone's 12 px padding is right. The brand link's box is 103.3 px against the 95 px lockup, as the spec says. Mylder's desktop `.bar` writes `padding-block: 0` above 760 px, so a `medium` bar's `space.100` block padding does go past what Mylder writes.

Design QA covered all 10 stories in light and dark against the spec alone, since the design is deferred. The measures match round 4:

- **Wide bar:** 46 px tall.
- **`SmallDefault`:** 90.3 px tall.
- **`Narrow`:** 190.6 px tall within its 320 px container.
- **Overflow:** no part outside the scrolling filters reaches past the bar.
- **Inks:** secondary rgb(71, 83, 90) and warning rgb(150, 90, 0) in light; secondary rgb(162, 173, 177) and warning rgb(240, 164, 58) in dark.

With no code changed, these are as round 4 found them: the accessibility tree, the tab order, the target sizes, the owned strings in all four locales, API consistency with SourceLine and KioskBar, and test coverage, which is ticked in full.

Settled points I did not reopen: TopBar follows the measures Mylder's composition writes, and the visual stage's root-centre state driving is a recorded retro note.

The only tracked change in the worktree is the factory's own `stages.review` entry in `components/top-bar/pipeline.yaml`. It was there before this review began, and I left it alone.
