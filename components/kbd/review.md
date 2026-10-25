# Review: Kbd, round 1

## P1

- **P1-1.** `docs/components/kbd.md:63` The spec says the key's font "carries ... the arrows ←, ↑, → and ↓", but the JetBrains Mono that `packages/perron/styles/fonts.css` loads (`@fontsource/jetbrains-mono/500.css`, latin `unicode-range` `U+2191,U+2193,U+2212` only) has no U+2190 or U+2192. In a Kbd, "←" and "→" fall back to the system monospace (Menlo Regular on macOS, read with `CSS.getPlatformFontsForNode` on `components-kbd--single-character` with `children: '←'`). They render smaller, heavier and lower than "↑" and "↓", which do render in JetBrains Mono 500. This breaks the Tokens row `root rest font typography.data` (kbd.md:53) for two of the four arrow keys. The fonts side holds: the rerun rewrites line 63, and the "←" examples at kbd.md:3, kbd.md:31, kbd.md:122, `packages/perron/src/components/Kbd/Kbd.tsx:11` and `Kbd.tsx:20`, so they stop promising a glyph the shipped font lacks (see P3-1).

## P2

- **P2-1.** `docs/components/kbd.md:65` In `components-kbd--in-help-text`, light and dark, on `root`: a key is 17.6 px tall (1lh of `typography.data` plus its border) inside the 18 px line of `typography.caption`. When a wrapped line puts one key under another, as "Esc" (35 to 52.6 px) sits under "−" (17 to 34.6 px) here, the two boxes are 0.4 px apart and their edges read as one doubled line, worst in dark. This is a crowded part, Polish under the `design-qa` checklist. The key needs room between lines, for example from a smaller role or less block size, set in the Tokens rows and CR-3 and then in `Kbd.css`.

## P3

- **P3-1.** `packages/perron/styles/fonts.css:10` A question for the maintainer: should Perron ship a JetBrains Mono subset with ← and → (no `@fontsource` subset has them)? The other options are to accept the system fallback for those two keys, or to have help text name the arrows in words, as content design's "arrows pan" already does.
- **P3-2.** `docs/components/kbd.md:53` Kbd uses two tokens beyond the jobs their foundation rows give them. `typography.data` is for "Times, delays, counts and percentages in lists and tables" (`docs/foundations/typography.md:31`) and `color.surface.raised` is for "Inputs, selected segment" (`docs/foundations/semantic-colours.md:45`). A question for the maintainer: widen those rows to cover keys in help text, or add a role for them?
- **P3-3.** `docs/components/kbd.md:86` The checklist line says the build's self-gate checks string, element and list `children` in the `Default` story's canvas, but no story or test renders an element or a list. FactList and Stat each keep a `*.test.tsx` that renders every shape. The shapes do render today (checked with a throwaway render), but nothing in the repo would catch a regression.
