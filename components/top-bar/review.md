# Review: TopBar, round 3

## P1

None.

## P2

- **P2-1.** `docs/patterns/top-bar.md:153` This round rewrote this line to say "The swap makes two more changes on screen", the phone's 12 px inline padding and the brand link's hover and pressed fills, but the swap makes a third. With `brandHref`, the brand link's box is padded `space.100` at each side and given `radius.md` corners (lines 103 and 120–122), so its keyboard focus ring changes. I measured `patterns-topbar--medium-default` against `components-brand--link`, which is Mylder's `<Brand render={<a href />} />`, in both themes. TopBar's ring is drawn around a 103 px box with 8 px rounded corners. Mylder's hugs the 95 px lockup with square corners. The link's hit area also reaches 4 px further on each side. The maintainer settled that this line must state the swap's changes truly, so it has to name the focus ring's larger size and rounded corners as well. Round 2's P2-1 also missed this change, but this round's rewrite now presents the list as complete.

## P3

- **P3-1.** `packages/perron/src/patterns/TopBar/TopBar.stories.tsx:693` This round renamed the label-override story from `Labels` to `WithLabels`. Every sibling that has one calls it `Labels`: SourceLine, KioskBar, ReportStrip, ScaleBar, DataStateKey and NumberField. The rename is probably there so that `Labels` (L) doesn't sort before `MediumDefault` (M) and become the contract's subject story, whose args must hold no overrides. The Stories prose at `docs/patterns/top-bar.md:231` explains why `MediumDefault` is the subject but not why the name departs from the siblings'. Should the spec give that reason, or should the siblings' name be kept some other way?

## Notes

I ran `npm run check` myself and it was green (exit 0): installed, tokens, registry, API, typecheck, every gate, lint, format, 79 of 79 unit test files with 967 of 967 tests, the website build, and 71 of 71 story files with 614 of 614 tests.

Since 07788bf, this round changed:

- **Spec lines 15, 153 and 231 and the Stories table:** they now describe a `State` variant property.
- **Stories:** `Default` became `MediumDefault`, `Small` became `SmallDefault` and `Labels` became `WithLabels`, and there are two new stories, `MediumHover` and `MediumPressed`.
- **CSS:** the header comment is rewritten.
- **docs.json:** regenerated.

`TopBar.tsx` and `TopBar.test.tsx` are unchanged.

Round 2's findings:

- **P2-1:** partly fixed. Line 153 now names the phone's inline padding and the brand link's hover and pressed fills, but it still leaves out the focus ring change in P2-1 above.
- **P3-1:** addressed. The CSS header now says the brand link is the one part a pointer presses, with its fills on a `radius.md` box.
- **P3-2:** addressed. The drawing takes `size` then `State`, with the values `default`, `hover` and `pressed`, giving `MediumDefault`, `MediumHover`, `MediumPressed` and `SmallDefault`. That follows `penpot/README.md`'s naming, and Button's code map maps `pressed` to `:active` the same way.

I checked the following against the code:

- **Subject story:** `storybook/contract/subjects.ts` takes the alphabetically first named export when there is no `Default`. That is `MediumDefault`, whose args are the meta's, as line 231 says.
- **State stories:** `MediumHover` and `MediumPressed` render at rest and check the brand's rules with `stateFill` and `pressedAfterHover`, as Button's state stories do.
- **Visual stage:** line 231 states truly that the stage drives a state on the root. That limit is the known shared-tooling Direction note, so I did not reopen it.

Design QA covered all 10 stories in light and dark against the spec alone, since the design is deferred:

- **Wide bar:** 46 px tall, padded 4/16 px.
- **`SmallDefault`:** 90 px tall, padded 4/12 px.
- **`Narrow`:** 191 px tall, with nothing past its 320 px container.
- **Brand link:** I drove a real hover, then a press. Light went from transparent to rgba(18, 24, 27, 0.05) to 0.09. Dark went from transparent to rgba(235, 238, 235, 0.06) to 0.09.

The accessibility tree of every story is unchanged from round 2. So are the tab order, the target sizes, the owned strings in all four locales and API consistency with SourceLine and KioskBar.

Test coverage is ticked in full. That includes the two new rows: `MediumHover`'s hover rule inside `(hover: hover)` with its `pointer` cursor, and `MediumPressed`'s `:active` rule after the hover one.

The only tracked change in the worktree is the factory's own `stages.review` entry in `components/top-bar/pipeline.yaml`. It was there before this review began, and I left it alone.
