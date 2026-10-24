# Review: Surface, round 1

## P1

- **P1-1.** `packages/perron/src/components/Surface/Surface.tsx:24` `SurfaceProps` drops `render` from `useRender.ComponentProps<'div'>` (line 10) and then declares it again with Perron's own JSDoc, so Perron's text replaces Base UI's on the docs page. That is a redeclared Base UI prop, which breaks the contract's [Props](docs/components/README.md#props) rule: "the props type inherits it and declares only its own members". There are two ways to fix it. One is to take `render` out of the `Omit` and change the spec's Props row to `inherited`. The other is to extend `HTMLAttributes<HTMLDivElement>`, as stable Text does, so that `render` becomes Surface's own member.

## P2

- **P2-1.** `packages/perron/src/components/Surface/Surface.stories.tsx:110` The `Default` story is not a row in the spec's Stories table, and it repeats `Raised`. The contract's [Stories](docs/components/README.md#stories) rule asks for one story per variant, named as Penpot names it. The design will have no `Default` variant, and the spec avoids `default` because it clashes with Penpot's `State` value. The contract story already falls back to the first export, so `Default` can be removed.
- **P2-2.** `packages/perron/src/components/Surface/Surface.stories.tsx:135` The story text "No disruptions on the M2 line" describes a line's service state without content design's fixed word for it. Content design's [Data-state and delay words](docs/content-design.md) table gives "Running normally" for that state. The same text is at lines 200 and 218, and it becomes example copy on the docs page.

## P3

- **P3-1.** `packages/perron/src/components/Surface/Surface.tsx:32` `ref` is typed `Ref<HTMLDivElement>`, but `render` can make the root a `<section>`, `<aside>` or `<article>`. The `Nested` story's `createRef<HTMLDivElement>` (`Surface.stories.tsx:228`) in fact holds a `<section>`. Stable Text, the other `useRender` component, types its ref as `Ref<HTMLElement>`. The maintainer may want one form for both, in the code and in the spec's Props row.
