---
'@mylder/perron': minor
---

Adds `selected` to `Button`, for a toggle such as "Follow": `true` or `false` sets `aria-pressed` and draws the button on (its colour's solid look) or off (its colour's outline look) in either variant, and `true` sets `data-selected`. Left out, the button is no toggle and has no `aria-pressed`. A toggle keeps its label the same off and on, "Follow", since `aria-pressed` says the state. No new owned strings.
