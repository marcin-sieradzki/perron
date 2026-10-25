---
'@mylder/perron': patch
---

Stat, FactList, EmptyState, Section, Toolbar, MapControls, DetailHeader, DisruptionCard, DataStatePanel and KioskBar share one internal copy of their helpers, with no change to their props or what they render. The contract in the docs data now lists the shared helpers, and says a part a second component needs moves to the shared parts.
