---
'@mylder/perron': patch
---

StationIcon and Delay inherit `render` from Base UI's `useRender.ComponentProps<'span'>` instead of declaring it again, so their docs show Base UI's own JSDoc for it, as every other component does. The prop accepts the same elements and functions as before.
