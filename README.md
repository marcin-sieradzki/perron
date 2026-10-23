# Perron

Perron is the design system of [Mylder](https://github.com/marcin-sieradzki/Mylder), a live map of Copenhagen's buses, S-tog, metro and regional trains. This repository holds its foundations: the design tokens, the build that turns them into CSS, TypeScript and a Penpot file, the fonts, and the guidelines in [docs/foundations.md](docs/foundations.md).

Components come later. They are extracted from the Mylder prototype already, and kept on their own branch until the foundations are settled.

## What is here

| Path                          | What it is                                                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `tokens/*.tokens.json`        | The token sources, in the W3C design tokens format 2025.10: `base`, plus a `light` and a `dark` theme            |
| `tokens/perron.resolver.json` | How the files combine (the format's resolver module): base always, then light or dark                            |
| `tokens/generated/`           | Built from the sources: `tokens.css`, `typography.css`, `tokens.ts` and `penpot.tokens.json`. Never edit by hand |
| `styles/perron.css`           | The one file an app loads: fonts, tokens, typography classes and page defaults                                   |
| `scripts/`                    | The token build and its tests, including contrast checks                                                         |
| `docs/foundations.md`         | How to use colour, type, space, shape, motion and the data states                                                |

## Token names

Every token is `--perron-<group>-<name>` in CSS and `<group>.<name>` in the sources.

- **Colour:** `text`, `surface`, `border`, `status` (success, warning, danger, info) and `chart` for the interface; `transit` (lines, modes, delays, severities), `data-state` and `map` for what Mylder shows. For example `--perron-color-text-secondary`, `--perron-color-transit-line-a`.
- **Space:** a 4 px base, named by count of 4 px units times 100: `space.050` is 2 px, `space.200` 8 px, `space.800` 32 px.
- **Radius:** `xs` 4, `sm` 6, `md` 8, `lg` 12, `xl` 16 px and `full`.
- **Type:** 40 roles under `typography.*`, each a composite of family, size, weight, line height and tracking.
- Also `shadow`, `size`, `opacity`, `z-index`, `duration`, `easing`, `breakpoint`, `effect`, `prik` (the data-state dot's geometry) and `map` (canvas measures).

## Commands

Node 22 or later.

```sh
npm install
npm run tokens        # rebuild tokens/generated from the sources
npm run check         # generated files up to date, typecheck, lint, format, tests
```
