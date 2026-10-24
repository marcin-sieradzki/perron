---
name: design-tokens
description: 'Design tokens: adding, changing, renaming or removing one, or giving a component or screen a value no token holds.'
---

Perron's tokens are DTCG 2025.10 files in `packages/perron/tokens/`: `base.tokens.json` for everything theme-independent, `light.tokens.json` and `dark.tokens.json` for colours and shadows, and `motion-reduced.tokens.json` for the values that change when the system asks for less motion. `perron.resolver.json` combines them: base, then a theme, then a motion context. The build checks each file against the format before writing anything (`scripts/lib/spec.ts`), so the format's rules are enforced, not remembered.

## Steps

1. **Find the token that already does the job.** Search descriptions and names in `packages/perron/tokens/*.tokens.json` and the guidance in `docs/foundations/`. Done when you can name the token that fits, or say in one sentence what job no token covers. Reusing a token is the usual outcome.
2. **Place it** by the placement table below. Done when you know the file, the group and the tier.
3. **Name it by its job**, then **write it**: copy the shape of a sibling token of the same type, give it a one-line `$description` saying where it is used, and put any Perron-only data under `$extensions["org.perron"]`.
4. **Document it.** On the page in `docs/foundations/` that owns the token's group, add its name, or a prefix ending in `*`, to a `<!-- tokens: -->` marker, and update the prose where the guidance changed. The build fills the table. For a rename or removal, add the row to `docs/renames.md` and point every reader in this repo at the new name. Done when every new token sits in a marker and `git grep` finds an old name only in `docs/renames.md`.
5. **Build and check**: `npm run tokens`, then `npm run check`. Done when the check passes, including the test that every token appears in a table, and the contrast tests' known lists are unchanged or have grown only by a deliberate miss that `docs/foundations/accessibility.md` explains.

## Placement

| The value is                                              | Goes in                                                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| A raw colour no palette step holds                        | `palette.<hue>.<step>` in base, then a `color` token that points at it                     |
| An interface colour (text, surface, border, status)       | `color.<role>.<job>` as a **theme pair**: the same name in light and dark                  |
| A colour Mylder shows (lines, map, chart, states)         | `color.transit`, `color.map`, `color.chart` or `color.data-state`, with its own value      |
| A shadow                                                  | `shadow.<job>` as a theme pair: a dark surface needs its own, stronger shadow              |
| A border, ring or stroke width                            | `border.width.<step>` in base; the focus ring reads `focus.*`                              |
| An icon size                                              | `icon.size.<step>` in base                                                                 |
| A measure two places must agree on                        | `size.<component>-<part>` in base, like `size.detail-width`                                |
| Spacing, radius, motion, layering                         | `space`, `radius`, `duration` / `easing`, `z-index` in base                                |
| A new kind of text                                        | A `typography` role in base, only when no role fits the job                                |
| A value that changes when the system asks for less motion | An override in `motion-reduced.tokens.json` of the base token, with the same name and type |

A measure only one component's CSS reads stays in that CSS.

## Rules the build does not explain

- **Two tiers.** The palette is raw values; `color.*` says what a colour is for. Only `color` tokens point at `palette.*`; components and apps read `color.*`. A tested rule.
- **Theme pairs.** Every token in `light.tokens.json` has its twin in `dark.tokens.json`. The dark value is its own palette step chosen for dark surfaces: 300 for status and brand fills and text, 900 for tints, the light neutrals for text.
- **Base points only at base.** A base token that pointed at a theme token would freeze to the root theme inside a nested `data-theme`, because custom properties resolve where they are declared.
- **Translucent colours are literal.** A reference cannot change alpha, so write the full colour: the components and hex of a palette step, plus `alpha`. A test checks the RGB is a palette step.
- **Palette steps** rise as the colour darkens. Each hue has 100 (light tint), 300 (dark-theme fill and text), 500 (light-theme fill), 700 (light-theme text, 4.5:1 on every light surface) and 900 (dark tint). Gaps in the neutral ramp are deliberate room for new steps.
- **Scale names.** `space`, `font.size`, `border.width` and `icon.size` count 4 px units times 100 (`space.300` is 12 px, `border.width.025` 1 px); radius runs `xs` to `xl` plus `full`.
- **Type roles.** `letterSpacing` is the role's tracking in em times its size, in px. Capitals come from `$extensions["org.perron"].textTransform`. A role in a new family or weight needs its `@fontsource` import in `packages/perron/styles/fonts.css`; a test compares the two.
- **Contrast.** Text colours reach 4.5:1 on `surface.default`, `raised` and `inset` in both themes. What shows where a control is or what state it is in reaches 3:1: `border.control`, the focus ring and the status fills. `border.strong` decorates, so it is exempt. `surface.inset` stays at least 1.15:1 from `raised`. The tests list each deliberate miss by name.
- **Modifiers.** A system preference is a resolver modifier with an empty default context and a context file of overrides. Each override is a base token of the same type, and each context has its media query in `MODIFIER_MEDIA` (`scripts/lib/tokens.ts`); the build fails otherwise. Loops keep their durations: the components that run them stop them under reduced motion.
- **Components** read token names in their CSS under `packages/perron/src/`, so a rename changes them in the same PR; `npm run gates -- component-css` names every name no token defines. The old components on the Mylder repository's `perron/components` branch follow a rename through `docs/renames.md`.
