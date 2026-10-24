# Mylder's screen pieces are patterns, a third layer

Perron is Mylder's own system, so the pieces of Mylder's screens (a departure row, a vehicle table, a stop timeline) live in Perron rather than in the app, as **patterns**: built only from Perron components, never from Base UI directly, with Mylder's domain props, exported from `@mylder/perron/patterns`. Keeping them in Perron puts their designs in Penpot and their checks in one place; keeping them a separate layer stops domain props from leaking into the components, which stay generic.
