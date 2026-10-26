---
'@mylder/perron': minor
---

MapControls takes `centerMapDisabled`, which disables the centre button alone, focusable and announced as dimmed, as `zoomInDisabled` and `zoomOutDisabled` do theirs. A screen whose map can't yet be moved sets the three instead of `disabled`, so the pause button stays pressable.
