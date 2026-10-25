# Review: SourceLine, round 4

## P1

None.

## P2

- **P2-1.** `docs/patterns/source-line.md:100` This round rewrote the line, and it now says that with proportional figures "the words after a time in its phrase, and the rest of the line after it, shift by a pixel or two as the seconds change". I measured the caption's proportional figures at 12 px in the `OutOfDate` story: "0" is 7.34 px and "1" is 4.13 px, so a single figure going to or from a 1 moves everything after it by 3.2 px. One tick, 08:14:00 to 08:14:01, shifts the line by 3.5 px, and two updates a few seconds apart, 08:14:00 and 08:14:11, differ by 6.7 px (47.17 px and 40.47 px). The cost this line gives for keeping proportional figures, the very choice the build's direction note asks a design run to confirm, is understated by two to three times, as a wrong contrast ratio was in round 1's P2-1. The line needs the measured cost, for example "by up to about 3 px for each figure that changes to or from a 1", or no number at all.

## P3

None.

## Notes

Round 3's P2-1 is fixed. Line 100 now rests the time's place in the phrase's text run on the owned-strings check, and that reason is true. `wordsIn` splits the render at every tag, and `filled` matches a template only within one run (`packages/perron/src/testing/owned-strings.ts:21-32, 58-110`). The contract's `OwnedStrings` story does run `expectOwnedStrings` over every subject story (`docs/components/README.md:332`). I ran `expectOwnedStrings` on a line whose time sits in its own element inside the phrase: it fails in all four locales, on "updated", "opdateret", "uppdaterad" and "oppdatert", while the same markup with the time kept in the run passes. The tabular-figure numbers on that line match my measurements (colon 3.38 px and 7.63 px, "08:14:05," 49.83 px and 68.56 px). So does "about 50 px" for a time. Round 3's P2-2 is fixed: the `outOfDate` JSDoc (`packages/perron/src/patterns/SourceLine/SourceLine.tsx:23-27`) now reads as the spec's field row does, and `packages/perron/data/docs.json` carries that row. Round 3's P3-1 is now two recorded direction notes. Round 3's P3-2 was taken up in line 100 and CR-13, and the CSS comment (`SourceLine.css:12-16`) agrees with both. Round 2's P3-3 still stands as a note: at 320 px, a source's name can wrap inside itself.

`npm run check` was green, exit 0: 951 of 951 unit tests and 69 of 69 story files with 599 of 599 tests, the website build and its anchor check included. Design QA covered all six stories in light and dark. The render is the same as in round 3: Schibsted Grotesk 400 12/18 px with `font-variant-numeric: normal` on every part. The line is in secondary ink (rgb(71, 83, 90) light, rgb(162, 173, 177) dark), "Paused" is in primary, and the out-of-date phrase is in warning (rgb(150, 90, 0) light, rgb(240, 164, 58) dark). Nothing overflows, and in `Narrow` no line starts with a "·". In the accessibility tree, each story reads as the spec says: a paragraph, with a `time` node holding each phrase. Nothing takes focus, and nothing is `aria-hidden`. The API, the owned strings and the test coverage are unchanged since round 3, and all three still hold. No Base UI is used. The repo was left as found: `git status --short` shows only the factory's own change to `components/source-line/pipeline.yaml`, which was there before this review started.
