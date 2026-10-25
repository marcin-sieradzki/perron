---
'@mylder/perron': minor
---

`DepartureRow` gains three optional props. `cancelled` keeps a departure that won't run in the list, "Cancelled" in place of the dot and the state's word, its countdown and time struck through and no delay, and sets `data-cancelled` on the root. `interval` takes the minutes between departures, one number or a `[fewest, most]` pair, for a line that runs to a headway such as the Metro, and shows "Every 3 min" or "Every 3 to 4 min" in place of the countdown, the time and the delay. `platform` shows the caller's platform or track label, "Track 4", after the state's word. `countdown` is now optional, since an interval row has none; left out, it shows "—". New `slotProps` keys `platform` and `interval`, and new label props `cancelledLabel`, `everyLabel` and `rangeToLabel`. Adds the owned strings `cancelled`, `every` and `rangeTo` to every locale; a caller that supplies its own dictionaries adds them too.
