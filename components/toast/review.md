# Review: Toast, round 2

## P1

None.

## P2

None.

## P3

- **P3-1.** `docs/components/toast.md:250` These test-coverage lines have no `play` step that ticks them. Round 1's checklist could have listed them and did not. All of them work when driven by hand. (a) The Keyboard `Escape` row says "With focus in a toast", but Escape is only pressed on a toast's root. Pressed by hand on "Try again" and on "Close", it closes the toast. (b) CR-6 and the `defaultOpen` row say a toast that closed itself is not shown again while `open` stays `true`. No step re-renders the Toast between its close and `open: false`. (c) CR-12 says the HTML `title` attribute never reaches the root. By hand it is `null` on every root. (d) Nothing checks that the root's `render` reaches `Toast.Root`, or that a `swipeDirection` other than the default dismisses. (e) Nothing checks that `slotProps.icon`, `slotProps.content`, `slotProps.action` and `slotProps.close` reach their parts with the caller's `className` merged. The contract's Stories rule asks for a `play` test for every behaviour the component promises.
- **P3-2.** `docs/components/toast.md:242` CR-12 now says the caller's `render` wins over the part's own tag only for `slotProps.title` and `slotProps.description`. But `slotProps.icon.render` and `slotProps.action.render` win too, through `usePart` (`packages/perron/src/internal/use-part.ts:21`), as the contract's Shared helpers row for `usePart` intends. The line should name every inner part whose `render` the caller gives, so it agrees with the code.
- **P3-3.** `docs/components/toast.md:244` CR-14 says a toast past the limit is mounted beside the story in its `play`, with `mounted`. The Stack row (line 255) and `Toast.stories.tsx:669` instead put the fourth toast, "Filters cleared", in the story's own render, closed, and show it with its trigger. One of the two lines should change so they agree. The Stack row matches the code.
- **P3-4.** `packages/perron/src/components/Toast/ToastRegion.tsx:66` The new guard stops a toast with no `data` from rendering, but the toast stays in Base UI's list. Base UI's `applyLimited` (`node_modules/@base-ui/react/toast/store.mjs:38`) counts every active toast toward the limit of 3, so a toast added through Base UI's own manager takes a slot. It hides an older Perron toast as `data-limited`, while nothing shows in its place and nothing can close it. CR-2's "so it never throws" leaves this out. Should the spec say so, or should the region close such a toast?
- **P3-5.** `docs/components/toast.md:108` (carried from round 1, P3-1, unanswered) The region is mounted first by `PerronProvider` and stacks at `z-index.dialog`. A Dialog or Popover opened later therefore paints over every toast, so a toast fired from inside a modal sits under its backdrop. Should the region take a stacking token above `z-index.dialog`, or is this accepted?
- **P3-6.** `packages/perron/src/components/Toast/Toast.tsx:183` (carried from round 1, P3-4) The effect has no dependency list. Every re-render of a Toast's parent calls `list.update` while the toast is open, which re-renders every toast in the shared region whether or not a prop changed.
- **P3-7.** `packages/perron/src/PerronProvider.tsx:9` (carried from round 1, P3-5) `PerronProvider` imports `ToastRegion.tsx`, and `ToastRegion.tsx:10` imports `useOwnedStrings` back from `PerronProvider.tsx`. This is the library's first import cycle. Moving the locale context and `useOwnedStrings` into a module of their own would break it.
