# Review: IconButton, round 1

## P1

None.

## P2

- **P2-1.** `packages/perron/src/components/IconButton/IconButton.css:7` A `children` string wider than the 34 px square spills out on both sides with nothing to clip it (`args=children:Zoom in now` puts the icon span 83 px wide from x −8.6, and the start of the text is cut off at the viewport), so the spec's What axe won't catch line at `docs/components/icon-button.md:124`, which says `children` "renders a string … centred in the square", is false, and the design-qa Text line ("never overflow") is broken; either clip the root or icon span, or narrow the `children` JSDoc and the spec line to say an icon only.
- **P2-2.** `packages/perron/src/components/IconButton/IconButton.stories.tsx:30` The `large` stories label their button "About", which is not "a verb and what it acts on" as the spec's own Do row asks (`docs/components/icon-button.md:183`), and the spec sets that label at `docs/components/icon-button.md:156`; give it a label of that shape, or reword the Do row so it allows a label that names the page the button opens.

## P3

- **P3-1.** `packages/perron/src/components/IconButton/IconButton.tsx:18` IconButton names an icon-only button with a required `label` in `VisuallyHidden`, but its Actions sibling ToolbarButton names its icon-only form with the caller's `aria-label` (`docs/components/toolbar.md`, ToolbarButton Props), so the library now has two ways to do one job (api-consistency, "One idea, one name"); the maintainer should pick one for the siblings to copy: `label` here, or MUI's `aria-label`.
- **P3-2.** `packages/perron/src/components/IconButton/IconButton.tsx:30` `size` on Button changes the button's height (`size.button` against `size.button-sm`), but on IconButton it changes only the icon's step and leaves the 34 px box alone, so `size="large"` means something different in each (api-consistency, "One name, one type and default"); the spec gives its reasons, but the maintainer may prefer a separate name such as `iconSize`, or `size` changing the box as MUI's does.
