---
'@mylder/perron': minor
---

Text and line badge labels now reach WCAG 2.2 AA contrast (4.5:1) everywhere. `color.text.tertiary` (and `color.transit.delay.unknown`, which points at it) moves to two new palette steps, `palette.neutral.550` (#606C74) in the light theme and `palette.neutral.350` (#909BA1) in the dark, so hints, captions, placeholders and inactive labels pass on every surface. Line colours stay exact; their labels change instead: A, B, C and M4 take `color.text.on-color.dark`, and M1 takes the new `color.text.on-color.black` (`palette.neutral.1000`, #000000), since neither white nor the dark text clears 4.5:1 on its green.
