---
'@mylder/perron': minor
---

`TopBar`'s `size` takes `'responsive'`: one render that is the phone's layout, `small`, under `breakpoint.phone` and the wide one, `medium`, above it, switched by a media query with no JavaScript, for a page rendered before it knows the viewport's width. The groups keep the wide order in the DOM at both widths, and on a phone CSS places the tools on the first row and the filters on the second, with `reading-flow: flex-visual` so that a browser that supports it tabs in the order on screen. `'medium'` and `'small'` render as before, and the default is still `'medium'`. No new owned strings.
