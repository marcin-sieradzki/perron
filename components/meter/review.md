# Review: Meter, round 1

## P1

None.

## P2

None.

## P3

- **P3-1.** `docs/components/meter.md:125` The row for Base UI's "x" `span` says "Not read: the meter role's children are presentational", and line 23 says the same, but Chromium shows the `span` as a `StaticText "x"` child of the meter in every story, in both themes (CDP `Accessibility.getFullAXTree`; Playwright reads it as `meter "Reporting live": Reporting live x`). No screen reader has confirmed the claim. No rule settles whether to keep Base UI's root as it is (CR-1) or replace its children to drop the `span`, so the maintainer decides, as the build's note asks. Until then the row should say what Chromium shows rather than promise silence.
- **P3-2.** `docs/components/meter.md:121` Base UI's `Meter.Label` registers its `id` only on the client. In the server-rendered markup (`renderToStaticMarkup`, and Base UI's own root) the root has no `aria-labelledby`, so before hydration the meter has no name. The row says the name comes from `aria-labelledby` with no caveat. Perron could set the label's `id` and the root's `aria-labelledby` itself, but CR-1 leaves the label's `id` to Base UI, so the maintainer decides between accepting this and taking the `id` over.
- **P3-3.** `packages/perron/src/components/Meter/Meter.tsx:41` `locale` is the library's first per-component locale prop. It is omitted from `Meter.Root.Props` and declared again (`docs/components/meter.md:51`, `:70`), with the PerronProvider as its default, and the next component that formats numbers will copy it. The redeclaration is justified, since Base UI's JSDoc ("Defaults to the user's runtime locale") would be wrong here. Whether the prop stays per component or lives on the provider only, as MUI sets it, is the maintainer's call, which the build already raised.
- **P3-4.** `docs/foundations/layout.md:68` The prose says "A measure only one component's CSS reads stays in that CSS", yet the diff lists `size.meter-track` (only Meter reads it) in the table under it, as `size.badge` was before. The contract's CSS rule ("Tokens only") wins, so the token is right. The foundation sentence should change to agree, which is the maintainer's to word.
- **P3-5.** `packages/perron/src/components/Meter/Meter.tsx:19` The `label` JSDoc, and its copy at `docs/components/meter.md:45`, tells the caller about axe's `aria-meter-name` rule and Stat's `label`. That reasoning is for maintainers. Stat's sibling form is shorter ("What the figure counts, in a few words: …. Required"), and the reasoning could move to the spec's prose.
- **P3-6.** `packages/perron/src/PerronProvider.tsx:13` The JSDoc for `PerronProviderProps.locale` still reads "The language of every owned string inside". With `useLocale`, the provider's locale now also sets how Meter formats its figure, which the JSDoc and the changeset don't mention.
