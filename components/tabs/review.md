# Review: Tabs, round 2

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/components/Tabs/Tabs.css:104` The rule `.pn-TabsPanel[data-ending-style]` sets `position: absolute` and `visibility: hidden` on the panel being left. Base UI keeps that panel mounted, without `hidden`, for a frame after the switch; the rule makes it invisible during that frame, and the build measured that this works. The spec names this rule nowhere: not in the Tokens table, not in a `CR-n`, and not in the "Base UI already does" line (`docs/components/tabs.md:36`), which says only that a hidden panel is unmounted. The CSS comment cites CR-10, but CR-10 covers transitions. A question for the maintainer: should a CR (or a line in CR-6) record the ending frame and this rule, so the next build keeps it?
- **P3-2.** `packages/perron/src/components/Tabs/Tabs.stories.tsx:262` The `Controlled` story wraps Tabs in a flex column with `alignItems: 'start'`. The root and the list therefore shrink to the tab row, 272 px wide in a 768 px box, and the hairline ends at the last tab. In every other story they span the container, as CR-14 says ("the root and the list are as wide as the box that holds them"). The component's CSS leaves its width to the parent, which a flex or grid parent that aligns to the start overrides. Two options: stretch the story's wrapper, or give `.pn-Tabs` an `inline-size` or `align-self` so that CR-14 holds in any parent.
- **P3-3.** `packages/perron/src/components/Tabs/Tabs.tsx:160` This question is still open from round 1. `Tab` draws its own count pill (`pn-Tab-count`, `typography.data-sm` on `color.surface.inset`), and the registry plans a `Count` component (Display, `designing`). Should `Tab` use `Count` once `Count` is built, so that every count in the library has one shape, or should the tab keep its own pill?
- **P3-4.** `packages/perron/src/components/Tabs/Tabs.tsx:137` This question is still open from round 1. The four exports mix two naming schemes. `TabsList` and `TabsPanel` follow Base UI and Toolbar's `<Name><Part>` prefix, while `Tab` follows MUI (`Tab`, `TabList`, `TabPanel`), and the next compound component will copy one of them. Keep `Tab` next to `TabsList` and `TabsPanel`, or settle on one scheme while changing the API is still free?
