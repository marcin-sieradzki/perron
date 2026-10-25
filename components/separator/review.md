# Review: Separator, round 2

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/components/Separator/Separator.tsx:13` The `className` JSDoc reads "Joined after `pn-Separator` on the root". That matches Kbd, Count, Text, Tag, Meter and FactList. It does not match its sibling separators, "Reaches the root. Merged after `pn-ToolbarSeparator`." (`Toolbar.tsx:172`) and "Reaches the root, the hairline. Merged after `pn-MenuSeparator`." (`Menu.tsx:583`), or its Layout sibling Surface. api-consistency's JSDoc rule says one prop is described the same way in every member, and both forms are well established across the library. This is a question for the maintainer, not a fix: pick one form for the template and the contract's Props section.
- **P3-2.** `docs/components/separator.md:97` CR-7 says the four dividers look alike, but only Separator clears the user agent's border (`Separator.css:10`, `border: 0`). `ToolbarSeparator` (`Toolbar.css:40-53`), `MenuSeparator` (`Menu.css:223`) and Select's separator (`Select.css:144`) each set one border side and leave the others alone. So a `render={<hr />}`, which their props pass through, still draws the 1px inset grey border that round 1's P2-2 fixed here. CR-7 binds only the two tokens, so this branch is not wrong, but the maintainer may want a follow-up that gives the three siblings `border: 0` too, so the four stay alike under `render`.
