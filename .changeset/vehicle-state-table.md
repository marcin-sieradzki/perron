---
'@mylder/perron': patch
---

VehicleDotLegend's dots no longer take a placeholder `line='m1'` recoloured by the legend's CSS: they take no line and draw in the legend's ink, as VehicleDot does with no line, so the dots lose their `data-line` and look the same. VehicleDot, VehicleDotLabel, VehicleDotLegend, DepartureRow and ReportStrip now read the five data states and their owned strings from one internal table; their markup is unchanged.
