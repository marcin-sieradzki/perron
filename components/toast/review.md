# Review: Toast, round 1

## P1

None.

## P2

- **P2-1.** `packages/perron/src/components/Toast/Toast.stories.tsx:337` The plays of Info (ends line 337), Neutral (410), Stack (520) and Warning (689) end with their toasts still open. Stack also leaves focus on the "Live positions are delayed" toast root, because the swipe step's pointerdown on its `tabindex=0` root (lines 506-518) focuses it. Measured after each play ran: info, neutral, warning and three Stack toasts open, `document.activeElement` `.pn-Toast` in Stack. This breaks the contract's Stories rule (an overlay's `play` "closes it at the end", ending in the resting state with focus back where it started). The fix also changes `docs/components/toast.md:248`, whose "ends with every toast it mounted closed and focus on the trigger" must give way to the contract's "focus back where it started", which Danger and Success already meet by `trigger.blur()`.
- **P2-2.** `docs/components/toast.md:250` The test-coverage checklist has unticked lines, all promised by the spec and pressed or checked by no `play` step. This breaks the contract's Stories rule of a `play` test for every behaviour the component promises:
  - (a) Keyboard `Shift+Tab` row, "Moves back through them": Shift+Tab is only pressed from the region itself, never from a toast or its close button back to the toast before it. It works when driven by hand.
  - (b) Keyboard `Escape` row and `Enter`, `Space` row, "focus moves to the next toast": each close is tested only on a lone toast, where focus goes back to the trigger. It works by hand in Stack: Escape on the middle toast focuses "Link copied".
  - (c) Base UI's timer pause "while the window is in the background" (line 62 and the `autoHideDuration` row).
  - (d) Base UI's swipe never starting on a `button` or an `a` (lines 41 and 62), which the `action` part's design relies on.
  - (e) CR-5: an open Toast updates its toast when its props change (a new `title` or `color` re-rendered while open).
  - (f) CR-5: a Toast unmounted while open takes its toast away without calling `onClose`.
  - (g) The checklist line "Every shape the type accepts renders" (line 209): `title`, `children`, `icon` and `action` each as a string, an element and an array. Only a string `title` and `children`, an element `icon` and an element `action` render in any story.
  - (h) The `slotProps.title` row and Anatomy line 39: `render: <h3 />` makes the title a heading.
  - (i) CR-11's starting and ending `translate` and `opacity`, and a swiped toast leaving `100%` further in its `data-swipe-direction`. Only the transition's properties and duration are checked.

## P3

- **P3-1.** `docs/components/toast.md:108` The line says `z-index.dialog` gives the region the stacking the contract gives everything in a portal, but the contract's reason, "so the one opened last paints on top", fails for a region whose portal `PerronProvider` mounts first (`packages/perron/src/components/Toast/Toast.css:12`). Any Dialog or Popover opened later paints over every toast at the same z-index, so a toast fired from inside a modal dialog ("Link copied" from a share dialog) sits under its backdrop. Should the region take a stacking token above `z-index.dialog`, through the `design-tokens` skill, or is this accepted?
- **P3-2.** `packages/perron/src/components/Toast/ToastRegion.tsx:160` `slotProps.description` is merged under Toast's own `render: <div />`, so a caller's `render` there is silently dropped. `slotProps.title.render` wins at line 152, and Alert's description, built by `usePart`, takes the caller's `render`, which CR-1's "built the same way" suggests Toast should match. Should the description honour the caller's `render` as the title does?
- **P3-3.** `packages/perron/src/components/Toast/ToastRegion.tsx:72` `toast.data!` assumes every toast in the provider's list came from a Toast. A toast added inside `PerronProvider` through Base UI's own `Toast.useToastManager().add()` would throw while the region renders, and since the region wraps the whole app, the app would crash. A guard that skips toasts with no `data` would contain this.
- **P3-4.** `packages/perron/src/components/Toast/Toast.tsx:183` The effect has no dependencies, so every re-render of a Toast's parent calls `list.update` while the toast is open. That bumps Base UI's `updateKey` and re-renders every toast in the shared region, whether or not a prop changed. Comparing the view's props before updating would avoid it.
- **P3-5.** `packages/perron/src/PerronProvider.tsx:9` `PerronProvider` imports `ToastRegion.tsx`, which imports `useOwnedStrings` back from `PerronProvider.tsx` (`ToastRegion.tsx:10`). This is the library's first import cycle, and it holds only while neither side reads the other at module top level. Moving `LocaleContext` and `useOwnedStrings` into a module of their own would break the cycle.
- **P3-6.** `docs/components/toast.md:7` The run note still lists `Toast.Action` among the registry's `baseUiParts`, which line 41 and `packages/perron/components.json` have since dropped.
