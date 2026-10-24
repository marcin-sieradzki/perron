# Review: Surface, round 2

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/components/Surface/Surface.tsx:26` Surface now follows the contract's [Props](docs/components/README.md#props) rule: it inherits `render` from `useRender.ComponentProps<'div'>` and types `ref` as `Ref<HTMLElement>`. The two stable `useRender` siblings in `packages/perron/api.json` take another form. They declare `render` again with Perron's JSDoc and `@default <span />` (`packages/perron/src/components/Delay/Delay.tsx:44`, `packages/perron/src/components/StationIcon/StationIcon.tsx:31`), and type `ref` as `Ref<HTMLSpanElement>` (`Delay.tsx:75`, `StationIcon.tsx:37`). So the library now has two forms for a `render`-able root. The maintainer may want to pick one: bring Delay and StationIcon in line with the contract in a later change, or write the redeclared form into the contract (the api-consistency rule "One name, one type and default").
