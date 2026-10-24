# @mylder/perron

## 0.2.0

### Minor Changes

- 5d5f868: Depend on Base UI (`@base-ui/react` 1.9.0, pinned) and take `react` and `react-dom` 19 from the app as peer dependencies.
- 84fa566: The docs data now holds the component contract, with the rules its checks and story tests hold every component and pattern to, and the spec template, and `search_docs` finds both.
- a1df949: Add the `@mylder/perron/patterns` entry point, where Mylder's patterns are exported once they are built.
- d618c3c: Add `PerronProvider`, whose `locale` (`en`, `da`, `sv` or `nb`) picks the language of every string a component owns, the `useOwnedStrings` hook that reads them, and the English, Danish, Swedish and Norwegian Bokmål dictionaries.

## 0.1.0

### Minor Changes

- 3d522f8: The first release. `@mylder/perron` ships Perron's foundations: the design tokens as CSS custom properties and TypeScript, the fonts, the icons, the Mylder mark, and the token and docs data the MCP server reads. `@mylder/perron-mcp` is the MCP server, with `list_tokens`, `search_docs` and `get_reference`.
