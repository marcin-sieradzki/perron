---
'@mylder/perron': minor
---

`DepartureRow` gains the optional `expected` prop, the time real-time data expects the departure to leave, `HH:MM`, as `StopTimeline`'s stops take it. For a `live`, `ageing` or `estimated` row it shows in the timetabled time's place, after a "~" when `estimated`, with the timetabled `time` struck through before it when the two differ, "~~08:14~~ 08:16", heard as "Timetabled 08:14" and then the time; a `timetable-only`, `no-signal` or cancelled row, or one with an `interval`, shows `time` as before. New `slotProps.expected` and the label prop `timetabledTimeLabel`. Adds the owned string `timetabledTime` to every locale; a caller that supplies its own dictionaries adds it too.
