# Perron

The foundations of Mylder's design system: design tokens, their build, fonts and guidelines. Components join later, from the Mylder repository's `perron/components` branch.

The tokens follow the W3C Design Tokens Community Group's [Design Tokens specification 2025.10](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/), its first stable version. The build checks every token file against it.

- Tokens: adding, changing, renaming or removing one, or a component needing a value, goes through the `design-tokens` skill.
- Skills and this file: write them with the `writing-for-agents` skill.
- Choosing tokens for a screen (which colour, role, space or radius): `docs/foundations/`, one page per foundation.
- Work is done when `npm run check` passes.
