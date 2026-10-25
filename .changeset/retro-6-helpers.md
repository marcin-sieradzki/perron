---
'@mylder/perron': patch
---

Dialog, Sheet and MapTooltip share one internal copy of their class and token helpers (`withClass`, `given`, `tokenValue`), with no change to their props or what they render. The contract in the docs data now says a component reads a token in script from its custom property with `tokenValue`, never from `tokens.ts`, lists `withClass`, `tokenValue` and the unit tests' `heardMarkup` among the shared helpers, and says a renamed copy of a helper fails the check. SeverityLabel's page no longer suggests making it a link or button through `render`.
