# Perron

Perron is the design system of [Mylder](https://github.com/marcin-sieradzki/Mylder), a live map of Copenhagen's buses, S-tog, metro and regional trains. This repository holds its foundations: the design tokens, the build that turns them into CSS, TypeScript and a Penpot file, the fonts, the icons and the Mylder mark, and the guidelines in [docs/foundations/](docs/foundations/README.md), whose pages follow the order of [Rift](https://rift-ds.com/foundations)'s foundations.

Components come later. They are extracted from the Mylder prototype already, and kept on their own branch until the foundations are settled.

## Standard

The tokens follow the [Design Tokens specification 2025.10](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/), the first stable version from the W3C Design Tokens Community Group: its Format module for the files, its Color module for colour values and its Resolver module for how base, light and dark combine.

The build checks every file against the format rule by rule (`scripts/lib/spec.ts`) before it writes anything, so a token that breaks the format fails `npm run check`. The format's `$root` tokens and `$extends` groups are not read by the build yet; the check reports them until it does.

## What is here

| Path                          | What it is                                                                                                                                                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tokens/*.tokens.json`        | The token sources: `base`, a `light` and a `dark` theme, and `motion-reduced` overrides                                                                                                                     |
| `tokens/perron.resolver.json` | How the files combine (the format's resolver module): base always, then light or dark, then full or reduced motion                                                                                          |
| `tokens/generated/`           | Built from the sources: `tokens.css`, `typography.css`, `tokens.ts`, and `penpot.tokens.json` in the older flavour Penpot imports. Never edit by hand                                                       |
| `styles/perron.css`           | The one file an app loads: fonts, tokens, typography classes, the icon class and page defaults                                                                                                              |
| `icons/`                      | The icons as SVG files, and `icons.json`, which lists them by category with the size and use of each                                                                                                        |
| `logos/`                      | The Mylder mark, one file per theme, and `logos.json`                                                                                                                                                       |
| `scripts/`                    | The token and docs build and its tests: the format, contrast, icon style and logo colours                                                                                                                   |
| `docs/foundations/`           | One page per foundation, with tables the build fills in                                                                                                                                                     |
| `docs/content-design.md`      | How every word in Mylder reads                                                                                                                                                                              |
| `docs/renames.md`             | Token names that changed or went away, for code written against an older name                                                                                                                               |
| `.claude/skills/`             | Agent skills: `design-tokens`, and from [mattpocock/skills](https://github.com/mattpocock/skills) (MIT) `writing-for-agents` and `grill-with-docs` with the `grilling` and `domain-modeling` skills it runs |

## Token names

Every token is `--perron-<group>-<name>` in CSS and `<group>.<name>` in the sources.

- **Palette:** raw colours, `palette.<hue>.<step>`. A neutral ramp from `0` (white) to `950`, and blue, green, orange, red and yellow at steps 100, 300, 500, 700 and 900. Only colour tokens read the palette.
- **Colour:** what a colour is for, per theme. `text`, `surface`, `border`, `status` (success, warning, danger, info) and the brand colour for the interface; `chart`, `transit` (lines, modes, delays, severities), `data-state` and `map` for what Mylder shows. For example `--perron-color-text-secondary`, `--perron-color-surface-warning`, `--perron-color-transit-line-a`.
- **Space:** a 4 px base, named by count of 4 px units times 100: `space.050` is 2 px, `space.200` 8 px, `space.800` 32 px.
- **Radius:** `xs` 4, `sm` 6, `md` 8, `lg` 12, `xl` 16 px and `full`.
- **Type:** 16 roles under `typography.*` (`display`, `heading-*`, `body`, `label`, `overline`, `stat`, `data-*` and more), each a composite of family, weight, size, line height and tracking. Sizes use the spacing numbers: `font.size.400` is 16 px.
- **Borders and focus:** `border.width.025` (1 px) and `border.width.050` (2 px); `focus.width` and `focus.offset` for the focus ring.
- **Icons:** `icon.size.325`, `icon.size.400` and `icon.size.450`: 13, 16 and 18 px.
- Also `shadow`, `size`, `opacity`, `z-index`, `duration`, `easing`, `breakpoint`, `effect`, `prik` (the data-state dot's geometry) and `map` (canvas measures).

## Commands

Node 22 or later.

```sh
npm install
npm run tokens        # rebuild tokens/generated and the tables in docs/foundations
npm run check         # generated files and tables up to date, typecheck, lint, format, tests
```
