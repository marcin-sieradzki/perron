# Changesets

Each Markdown file here is a changeset: which packages a change releases, at which bump (`patch`, `minor`, `major`), and the line it adds to their changelogs. Add one with `npx changeset` in every PR that changes what `@mylder/perron` or `@mylder/perron-mcp` ships. On `main`, the release workflow turns the changesets into a "Version packages" PR, and merging that PR publishes the new versions.
