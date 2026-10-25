---
'@mylder/perron': minor
---

`line` is now optional on `VehicleDot` and `VehicleDotLabel`, with no default. Left out, the root sets no `data-line` and the dot draws in the colour of the text around it, for a dot that stands for a state across many lines, such as ReportStrip's counts; in forced colours it draws in the system's text colour, as every dot does.
