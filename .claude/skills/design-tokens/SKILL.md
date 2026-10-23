---
name: design-tokens
description: 'Design tokens: adding, changing, renaming or removing one, or giving a component or screen a value no token holds.'
---

Perron's tokens are DTCG 2025.10 files in `tokens/`: `base.tokens.json` for everything theme-independent, `light.tokens.json` and `dark.tokens.json` for colours. `perron.resolver.json` combines them. The build checks each file against the format before writing anything (`scripts/lib/spec.ts`), so the format's rules are enforced, not remembered.

## Steps

1. **Find the token that already does the job.** Search descriptions and names in `tokens/*.tokens.json` and the guidance in `docs/foundations.md`. Done when you can name the token that fits, or say in one sentence what job no token covers. Reusing a token is the usual outcome.
2. **Place it** by the placement table below. Done when you know the file, the group and the tier.
3. **Name it by its job**, then **write it**: copy the shape of a sibling token of the same type, give it a one-line `$description` saying where it is used, and put any Perron-only data under `$extensions["org.perron"]`.
4. **Build and check**: `npm run tokens`, then `npm run check`. Done when the check passes and the contrast test's known list is unchanged, or has grown only by a deliberate miss that `docs/foundations.md` explains.
5. **Record it.** Update the section of `docs/foundations.md` whose guidance changed. For a rename or removal, add the row to `docs/renames.md` and point every reader in this repo at the new name. Done when `git grep` finds the old name only in `docs/renames.md`.

## Placement

| The value is                                        | Goes in                                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------- |
| A raw colour no palette step holds                  | `palette.<hue>.<step>` in base, then a `color` token that points at it                |
| An interface colour (text, surface, border, status) | `color.<role>.<job>` as a **theme pair**: the same name in light and dark             |
| A colour Mylder shows (lines, map, chart, states)   | `color.transit`, `color.map`, `color.chart` or `color.data-state`, with its own value |
| A measure two places must agree on                  | `size.<component>-<part>` in base, like `size.detail-width`                           |
| Spacing, radius, shadow, motion, layering           | `space`, `radius`, `shadow`, `duration` / `easing`, `z-index` in base                 |
| A new kind of text                                  | A `typography` role in base, only when no role fits the job                           |

A measure only one component's CSS reads stays in that CSS.

## Rules the build does not explain

- **Two tiers.** The palette is raw values; `color.*` says what a colour is for. Only `color` tokens point at `palette.*`; components and apps read `color.*`. A tested rule.
- **Theme pairs.** Every token in `light.tokens.json` has its twin in `dark.tokens.json`. The dark value is its own palette step chosen for dark surfaces: 300 for status and brand fills and text, 900 for tints, the light neutrals for text.
- **Base points only at base.** A base token that pointed at a theme token would freeze to the root theme inside a nested `data-theme`, because custom properties resolve where they are declared.
- **Translucent colours are literal.** A reference cannot change alpha, so write the full colour: the components and hex of a palette step, plus `alpha`. A test checks the RGB is a palette step.
- **Palette steps** rise as the colour darkens. Each hue has 100 (light tint), 300 (dark-theme fill and text), 500 (light-theme fill), 700 (light-theme text, 4.5:1 on every light surface) and 900 (dark tint). Gaps in the neutral ramp are deliberate room for new steps.
- **Scale names.** `space` and `font.size` count 4 px units times 100 (`space.300` is 12 px, `font.size.400` 16 px); radius runs `xs` to `xl` plus `full`.
- **Type roles.** `letterSpacing` is the role's tracking in em times its size, in px. Capitals come from `$extensions["org.perron"].textTransform`. A role in a new family or weight needs its `@fontsource` import in `styles/fonts.css`; a test compares the two.
- **Contrast.** Every text colour reaches 4.5:1 on `surface.default`, `raised` and `inset` in both themes, and the test lists the deliberate misses by name.
- **Components live elsewhere for now**: the Mylder repository's `perron/components` branch. `docs/renames.md` is how they will follow a rename when they move here.
