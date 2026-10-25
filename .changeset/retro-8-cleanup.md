---
'@mylder/perron': patch
---

Checkbox, Dialog, MapTooltip, SearchField, Sheet, Tooltip and DetailPanel write their event and slot types by Base UI's and Perron's public names, which the docs props table shows, in place of file-local aliases such as `ChangeDetails`; their parts with no props of their own take `slotProps` as a plain spread, with no `mergeProps` call; and the contract in the docs data says so. The story helpers' `stateRules` reads a rule whose state starts its selector, `:hover > .x`.
