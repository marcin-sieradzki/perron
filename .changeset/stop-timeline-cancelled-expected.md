---
'@mylder/perron': minor
---

`StopTimeline`'s stops gain two optional fields. `cancelled` keeps a call the vehicle won't make in the list, "Cancelled" under its name in the danger colour, its time and expected time struck through and no delay, and sets `data-cancelled` on its `<li>`, as `DepartureRow` marks a cancelled departure. `expected` takes the time real-time data expects at the stop, `HH:MM`, shown after the timetabled time as "~08:16" in a column of its own and heard as "Expected 08:16"; an empty one shows nothing. New label props `cancelledLabel` and `expectedTimeLabel`. Reuses the owned string `cancelled` and adds the owned string `expectedTime` ("Expected {time}"), a template each locale fills with the time, to every locale; a caller that supplies its own dictionaries adds it too.
