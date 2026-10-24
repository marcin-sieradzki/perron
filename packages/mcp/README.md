# @mylder/perron-mcp

The Perron MCP server. It answers an agent's questions about Perron's tokens, its docs and the API of the Base UI and MUI versions a project installs, so the agent reads exact, small answers instead of the sources.

```sh
npx @mylder/perron-mcp
```

It runs over stdio. In a project's `.mcp.json`:

```json
{ "mcpServers": { "perron": { "command": "npx", "args": ["-y", "@mylder/perron-mcp"] } } }
```

The tokens and docs come from the data that `@mylder/perron` ships in `data/`, so they match the installed Perron. The references come from the docs bundled inside `@base-ui/react` and `@mui/material` in the project's `node_modules`.

## Tools

### `list_tokens`

Every token's name, type, CSS custom property, value in each theme, the token it aliases, its reduced-motion value and what it is for. `query` keeps the tokens whose name or description holds all its words (`surface warning`); `type` keeps one DTCG type (`color`).

### `search_docs`

The sections of the foundation pages, content design, the glossary and the component contract that best match `query`, in full. `limit` sets how many, 3 by default.

### `get_reference`

The API reference of a component, from the installed package's own docs: `library` is `base-ui` or `mui`, `component` is a name such as `Select` or `TextField`, and `part` (or `Select.Positioner`) narrows it to one part. Base UI gives the page's API reference section; MUI gives its API pages, such as `Select API`. Use it before the hosted docs, which describe the latest release rather than the installed one.
