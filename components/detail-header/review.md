# Review: DetailHeader, round 1

## P1

None.

## P2

None.

## P3

- **P3-1.** `docs/patterns/detail-header.md` CR-2, `packages/perron/src/patterns/DetailHeader/DetailHeader.css:6`: CR-2 says the CSS selects on `data-variant`, as in `.pn-DetailHeader[data-variant='stop']`, but no rule in `DetailHeader.css` does. Both variants share every style, so no such rule is needed. The question for the maintainer is whether to cut that clause from CR-2, so the next patterns that copy this spec don't add an empty variant selector just to meet it.
- **P3-2.** `packages/perron/src/patterns/DetailHeader/DetailHeader.css:15`: these are the library's first `:has()` selectors. They pick the grid columns and rows from which parts are rendered, and line 62 adds a child combinator (`:has(> …-subheader) > .pn-DetailHeader-title`). The contract's Styling "Selectors: one class, then attributes" line doesn't cover either form. The question is whether the contract should allow structural `:has()` selectors, or whether the root should set the columns some other way. The spec's Tokens prose, "a grid of three columns", also describes a fixed three-column grid, not this one whose columns change with the parts.
- **P3-3.** `packages/perron/src/patterns/DetailHeader/DetailHeader.css:35`, story `patterns-detailheader--stop`, light and dark, `mark` part: the 18 px marker is centred on the title and subheader together, as the spec's Tokens prose asks. Its centre (y 39.3) therefore sits on the line between the title (centre y 27.5) and the subheader, beside neither. StationIcon's `large` size is documented as the marker "beside a panel title". The question is whether the `stop` mark should line up with the title's first line instead, while the 34 px LineBadge keeps spanning both rows.
