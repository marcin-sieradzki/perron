---
'@mylder/perron': minor
---

`MapControls` takes an optional 3D toggle and an optional compass for the map's angle: given `onTiltedChange(event, tilted)`, the bar adds a 3D toggle, and given `onResetNorth(event)`, a compass, after the centre button and before the pause button, past a new separator (`angleSeparator`), in the same bar and arrow-key order, so the map's controls stay one tab stop. The screen holds `tilted` (default `false`), which the toggle's `aria-pressed` and its inverse on fill follow, and `heading` (default `0`, degrees clockwise from north), by which the compass's needle turns to point north on the map. New owned strings `view3d` ("3D view") and `resetNorth` ("Reset to north"), in all four locales (a caller that supplies its own dictionaries adds them too), overridden by the new `view3dLabel` and `resetNorthLabel` props. Without `onTiltedChange` and `onResetNorth` the bar renders as before.
