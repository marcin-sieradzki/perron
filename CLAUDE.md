# Perron

The foundations of Mylder's design system: design tokens, their build, fonts, icons, the Mylder mark and guidelines. Components join later, from the Mylder repository's `perron/components` branch.

The tokens follow the W3C Design Tokens Community Group's [Design Tokens specification 2025.10](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/), its first stable version. The build checks every token file against it.

- Layout: npm workspaces. `packages/perron` is `@mylder/perron` (tokens, styles, icons, logos) and `packages/mcp` is `@mylder/perron-mcp`; the build in `scripts/`, Storybook and the docs stay at the root.
- Tokens: adding, changing, renaming or removing one, or a component needing a value, goes through the `design-tokens` skill.
- Designing or writing for any screen: read the brand in `docs/foundations/README.md` and the voice in `docs/content-design.md` first, then the foundation page for each choice (colour, type, space, icons).
- Icons and logos: a new or changed file follows `docs/foundations/icons.md` or `logos.md` and joins its folder's manifest, `packages/perron/icons/icons.json` or `packages/perron/logos/logos.json`.
- Tables in `docs/foundations/` sit between `<!-- tokens -->`, `<!-- contrast -->` and `<!-- files -->` markers and are rebuilt by `npm run tokens`; edit the prose around them.
- A new page in `docs/`: add it to `PAGES` in `scripts/lib/pages.ts`, give it an MDX file in `storybook/pages/` and a place in `.storybook/preview.ts`'s sort order; a test checks all three.
- Skills and this file: write them with the `writing-for-agents` skill.
- A change to what `@mylder/perron` or `@mylder/perron-mcp` ships adds a changeset (`npx changeset`), which the release workflow turns into a version and a changelog line.
- Work is done when `npm run check` passes.
