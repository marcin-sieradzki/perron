# Review: SegmentedControl, round 2

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/testing/stories.ts:27` The new shared `rendered(token, 'color')` does the same job as the `colour(property)` helper that came in from main, 32 lines below it. Both read a colour token's rendered value from a probe. The contract's Shared helpers table (`docs/components/README.md`) now has two rows for one job, and `colour`'s local `const rendered` at line 63 now shadows the new top-level name, which `npm run check` reports as a new `eslint(no-shadow)` warning. The maintainer may want to keep one helper, for example by having `colour` call `rendered`, so that each job has one helper, which is the aim of the Shared helpers rule.
- **P3-2.** `packages/perron/src/components/SegmentedControl/SegmentedControl.stories.tsx:3` Three lines in the diff run past the repo's 100-character `printWidth` (`.prettierrc.json`): this header comment at 143 characters, the `LongLabels` JSDoc at `SegmentedControl.stories.tsx:247` (106) and the inline comment at `SegmentedControl.tsx:74` (102). Prettier doesn't rewrap comments, so the build would have to wrap them by hand, as other components' comments are wrapped at 100.
