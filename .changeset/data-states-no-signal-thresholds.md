---
'@mylder/perron': patch
---

Data states now says a vehicle with no signal keeps moving on the timetable plus its last known delay from where it was last seen, its cut glyph, not its place, carrying the doubt, and that the live and ageing thresholds are each app's to set from its feed's interval between reports. `vehicle-dot.live-threshold` (60 s) and `vehicle-dot.ageing-threshold` (5 min) keep their values as documented defaults, and their descriptions, `color.data-state.no-signal`'s, the JSDoc of the `live`, `ageing` and `noSignal` owned strings and ReportStrip's `counts` fields no longer state "under a minute" or 5 minutes as fixed facts. The docs of VehicleDot, VehicleDotLabel, VehicleDotLegend, DepartureRow, ReportStrip and VehicleTable point at the app's thresholds.
