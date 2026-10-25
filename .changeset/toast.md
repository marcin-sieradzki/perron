---
'@mylder/perron': minor
---

Adds `Toast`, and the owned string `notifications`, in all four locales, and the tokens `size.toast-width` (360 px), the width of the toast column, and `duration.toast` (200 ms, 0.01 ms with reduced motion), its slide in and out.

`PerronProvider` now holds the app's one list of toasts and renders the region at the bottom of the screen that shows them, an empty "Notifications" region until a toast arrives, and takes `notificationsLabel` to rename it.
