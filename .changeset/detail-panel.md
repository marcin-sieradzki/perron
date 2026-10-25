---
'@mylder/perron': minor
---

Adds `DetailPanel`. Sheet's `title` description now says how a pattern with a header of its own, DetailPanel, passes that header as `title`. DetailHeader's `action` description no longer offers it the panel's close button, which DetailPanel draws from the Sheet after the header. The contract in the docs data lists `withClass`, the shared helper that joins a Base UI part's class with the caller's, which Sheet, Dialog, MapTooltip and DetailPanel now import from one file.

The contract in the docs data also lists `closed` and `byTestId`, two story helpers Sheet, Dialog and DetailPanel now import from one file, and DetailPanel's `action` description names "Show on map" a button.
