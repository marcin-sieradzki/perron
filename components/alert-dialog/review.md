# Review: AlertDialog, round 4

## P1

None.

## P2

None.

## P3

- **P3-1.** `docs/components/alert-dialog.md:44` This carries over from round 3's P3-1. After a press on the backdrop, focus goes to `<body>`. I measured the rest in `components-alertdialog--default`: a stray Tab then Enter confirms the destructive action. Shift+Tab reaches the `aria-hidden` trigger, and Space there closes the alert dialog with `'trigger-press'`. On a page with other controls before the portal, Shift+Tab reaches those as well. CR-1 leaves all of this to Base UI, and the spec now describes it correctly at :44, :65, :67, :127, :128 and :151. The `Default` play test cannot press Shift+Tab after the backdrop press: user-event starts Tab from `<body>`, so `AlertDialog.stories.tsx:105` calls `trigger.focus()`. The question for the maintainer: keep Base UI's behaviour, or add a `CR-n`, possibly a contract-wide rule for the Panels family, that sends focus back to Cancel after a backdrop press?
- **P3-2.** `packages/perron/src/components/AlertDialog/AlertDialog.stories.tsx:42` This carries over from round 3's P3-2. The subject story `Default` is uncontrolled (`defaultOpen`), as spec:187 asks, so pressing its Cancel or Clear filters does nothing. That shows the shape the Do row at spec:201, "Control the alert dialog with `open`", advises against. The question for the maintainer: should AlertDialog support uncontrolled use at all, or should the subject story be controlled, as `Actions` is?
- **P3-3.** `packages/perron/src/components/AlertDialog/AlertDialog.css:52` This carries over from round 3's P3-3. In `components-alertdialog--long-words`, in both themes, `overflow-wrap: anywhere` breaks "trafikinformationsoversigten" in `typography.heading-lg` mid-word with no hyphen ("trafikinformationsovers" / "igten?"). The contract's Long words rule allows this. `hyphens: auto` with the locale's `lang` would read better, but that is a choice for the whole contract.
