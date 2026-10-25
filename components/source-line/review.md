# Review: SourceLine, round 5

## P1

None.

## P2

None.

## P3

- **P3-1.** `docs/patterns/source-line.md:100` The rewritten cost, "by up to about 3 px for each figure that changes to or from a 1", is close, but its "up to" is low. I measured the caption at 12 px in the `OutOfDate` story, moving the next source's name as the first time changed. A figure going to or from a 1 shifts the line by 3.2 px (08:14:10 to 08:14:11), by 3.5 px (08:14:00 to 08:14:01), and by up to 3.84 px where a 5 comes before it (08:07:50 to 08:07:51). A figure that changes without a 1 still shifts the line by up to 1.4 px (08:02:06 to 08:02:07), and the sentence leaves that out. This is a P3, not a P2. The error is under a pixel against "about", not the two to three times of round 4's P2-1. And it doesn't change the choice the build's direction note leaves to a design run. "By about 3 to 4 px for each figure that changes to or from a 1, and up to about 1.5 px for any other" would say what is true.

## Notes

Round 4's P2-1 is fixed in substance: line 100 no longer says "a pixel or two", and `packages/perron/data/docs.json` carries the new sentence. Since e2afd9b, the branch's own files changed only in that sentence, its regenerated line in `docs.json`, `components/source-line/pipeline.yaml` and `components/source-line/review.md`. The code, the CSS, the stories, the locales and the registry entry are the same as round 4 read them, so nothing regresses. The accepted decisions stand, and this round does not reopen them: each phrase is one text run in the caption face, and the whole out-of-date phrase is in warning ink. Round 2's P3-3 still stands as a note: at 320 px, a source's name can wrap inside itself.

`npm run check` was green, exit 0. That covers tokens, registry, api, typecheck, gates, lint, format, 951 of 951 unit tests, the website build with its anchor check, and 69 of 69 story files with 599 of 599 tests. Design QA covered all six stories in light and dark. Every line is Schibsted Grotesk 12/18 px with `font-variant-numeric: normal`, in secondary ink: rgb(71, 83, 90) light and rgb(162, 173, 177) dark. "Paused" is in primary, rgb(18, 24, 27) light and rgb(235, 238, 235) dark. The out-of-date phrase is in warning, rgb(150, 90, 0) light and rgb(240, 164, 58) dark. Nothing overflows. No part is focusable, and nothing is `aria-hidden`. The tabular figures on line 100 match my measurements: every figure, colon and comma takes 7.62 px tabular, and a colon takes 3.36 px proportional. The API, the owned strings and the test coverage are unchanged since round 4, and all three still hold. No Base UI is used. The repo was left as found: `git status --short` is empty.
