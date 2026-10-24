---
'@mylder/perron': patch
---

The contract in the docs data now says a docs page's props table shows a prop's `@default` where the component has no destructuring default to write, such as `@default The locale's` on an owned-string prop, and has the `docs` check fail on a prop whose default the table would show otherwise than the spec gives.
