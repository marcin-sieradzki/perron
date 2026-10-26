---
'@mylder/perron': minor
---

`MapControls` takes an optional pause button for the map's motion: given `onPausedChange(event, paused)`, the bar adds it after the centre button, past a second separator, in the same bar and arrow-key order, so the map's controls stay one tab stop. The screen holds `paused` (default `false`); the button shows the `pause` icon and is named "Pause" while the map moves, and the `play` icon and "Resume" while it is paused, with no `aria-pressed`. New owned strings `pause` and `resume`, in all four locales, overridden by the new `pauseLabel` and `resumeLabel` props. Without `onPausedChange` the bar renders as before.
