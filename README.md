# Perron

Perron is the design system of [Mylder](https://github.com/marcin-sieradzki/Mylder), a live map of Copenhagen's buses, S-tog, metro and regional trains. This repository holds its foundations: the design tokens, the build that turns them into CSS, TypeScript and a Penpot file, the fonts, the icons and the Mylder mark, and the guidelines in [docs/foundations/](docs/foundations/README.md).

Components come later. They are extracted from the Mylder prototype already, and kept on their own branch until the foundations are settled.

## Standard

The tokens follow the [Design Tokens specification 2025.10](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/), the first stable version from the W3C Design Tokens Community Group: its Format module for the files, its Color module for colour values and its Resolver module for how base, light and dark combine.

The build checks every file against the format rule by rule (`scripts/lib/spec.ts`) before it writes anything, so a token that breaks the format fails `npm run check`. The format's `$root` tokens and `$extends` groups are not read by the build yet; the check reports them until it does.

## What is here

| Path                                          | What it is                                                                                                                                            |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/perron/`                            | The `@mylder/perron` package, published to npm, which holds the next six paths and `data/`, the tokens and docs as JSON for the MCP server            |
| `packages/perron/tokens/*.tokens.json`        | The token sources: `base`, a `light` and a `dark` theme, and `motion-reduced` overrides                                                               |
| `packages/perron/tokens/perron.resolver.json` | How the files combine (the format's resolver module): base always, then light or dark, then full or reduced motion                                    |
| `packages/perron/tokens/generated/`           | Built from the sources: `tokens.css`, `typography.css`, `tokens.ts`, and `penpot.tokens.json` in the older flavour Penpot imports. Never edit by hand |
| `packages/perron/styles/perron.css`           | The one file an app loads: fonts, tokens, typography classes, the icon class and page defaults                                                        |
| `packages/perron/icons/`                      | The icons as SVG files, and `icons.json`, which lists them by category with the size and use of each                                                  |
| `packages/perron/logos/`                      | The Mylder mark, one file per theme, and `logos.json`                                                                                                 |
| `packages/mcp/`                               | The `@mylder/perron-mcp` package, the MCP server for agents: tokens, docs and the pinned Base UI and MUI references                                   |
| `.mcp.json`                                   | The MCP servers a session here gets: Perron's own, from source, and the hosted MUI and Base UI docs                                                   |
| `scripts/`                                    | The token and docs build and its tests: the format, contrast, icon style and logo colours                                                             |
| `docs/foundations/`                           | One page per foundation, with tables the build fills in                                                                                               |
| `storybook/`, `.storybook/`                   | The same pages in Storybook, with every table drawn live from the tokens: swatches, type specimens, contrast grids, the icons and the mark            |
| `docs/content-design.md`                      | How every word in Mylder reads                                                                                                                        |
| `docs/glossary.md`, `docs/adr/`               | The words used to talk about Perron, and the decisions behind it                                                                                      |
| `docs/agents/`                                | How the engineering skills file, link and close work in this repository's GitHub Issues                                                               |
| `ROADMAP.md`                                  | What comes next: components on Base UI, patterns, the agent loop, the MCP server, step by step                                                        |
| `docs/renames.md`                             | Token names that changed or went away, for code written against an older name                                                                         |
| `.claude/skills/`                             | Agent skills: `design-tokens`, and the others from [mattpocock/skills](https://github.com/mattpocock/skills) (MIT)                                    |

## Releases

Both packages release from CI with [Changesets](https://github.com/changesets/changesets). A PR that changes what a package ships adds a changeset (`npx changeset`): the packages it releases, the bump, and the changelog line. On `main`, `.github/workflows/release.yml` gathers the changesets into a "Version packages" PR. Merging that PR packs the new versions, installs the tarballs in a scratch Vite app (`scripts/smoke-consumer.ts`), and publishes the same tarballs to npm with provenance through npm trusted publishing, so no npm token is kept anywhere.

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
npm run tokens        # rebuild packages/perron/tokens/generated and the tables in docs/foundations
npm run check         # generated files and tables up to date, typecheck, lint, format, tests
npm run storybook     # the guideline pages in Storybook, at localhost:6006
npm run storybook:build  # the docs site in dist/storybook
npm run smoke         # pack both packages and install them in a scratch Vite app
```

Storybook reads `docs/` itself (`scripts/lib/pages.ts`), so its pages change with the markdown and the tokens. Each page has a two-line MDX file in `storybook/pages/`; a Light and Dark switch on every page sets the theme.

The docs site is that Storybook, deployed to [GitHub Pages](https://marcin-sieradzki.github.io/perron/) from `main` by the CI workflow, once the check passes. Beside it, `scripts/build-site.ts` writes what agents read: [`llms.txt`](https://marcin-sieradzki.github.io/perron/llms.txt) with one line per page, a Markdown twin of every page at its path in this repository, and an [`AGENTS.md`](https://marcin-sieradzki.github.io/perron/AGENTS.md) for apps that install Perron.
