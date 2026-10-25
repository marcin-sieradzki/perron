---
'@mylder/perron-mcp': minor
---

Every tool takes `dir`, the project folder to read from, so an agent in a git worktree gets that worktree's tokens, docs and references rather than the checkout the server runs from; the data is read again when it changes.
