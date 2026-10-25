# Review: Dialog, round 3

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/components/Dialog/Dialog.tsx:44` This is round 2's P3-2, still open and still a question for the maintainer (api-consistency, "One idea, one name"). Dialog calls its row of controls `actions`, plural, like MUI's `DialogActions`. EmptyState, Section, DataStatePanel and DetailHeader each take a singular `action`, and DetailHeader's already holds "the panel's controls", which can be more than one. Sheet, the next member of the Panels family, will copy whichever form this one sets. The choice is to keep `actions` for a row of several Buttons, or to use the singular `action` the siblings use.
