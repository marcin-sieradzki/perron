---
'@mylder/perron': minor
---

VehicleTable gains sortable headers, a hideable Delay column and an optional Last seen column. `sort` marks the order the caller has put `vehicles` in, with `aria-sort` and an arrow on that column's header alone, and `onSortChange(event, sort)` makes every header a button that asks the caller for a sort; the table still reorders no row. `delayColumnHidden` leaves the Delay column out, and `lastSeenColumnVisible` shows Last seen before it, from a new optional `lastSeen` time on each vehicle, with `lastSeenColumnLabel` and `unknownLabel` to override its words. The pattern now exports the types `VehicleTableSort` and `VehicleTableColumn`. Adds the owned string `lastSeenColumn` ("Last seen") and the `arrow-down` icon, under Controls.
