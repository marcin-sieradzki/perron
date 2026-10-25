# Review: AlertDialog, round 3

## P1

None.

## P2

- **P2-1.** `docs/components/alert-dialog.md:44` The spec says that after a press on the backdrop, Shift+Tab lands "on the trigger". The same claim appears at spec:65 (`defaultOpen`), spec:67 (`onClose`), spec:127 (`Tab`, `Shift+Tab` row) and spec:151 (checklist), and in the JSDoc at `packages/perron/src/components/AlertDialog/AlertDialog.tsx:48-51` and `:61-64`. Base UI does not send focus to the trigger. The browser moves it from the press point to the last tabbable element before the portal, which is the trigger only when nothing focusable follows it in the DOM, as in the stories. I measured this in `components-alertdialog--actions` with Playwright: I added a page button after the trigger before opening, pressed the backdrop, and pressed Shift+Tab. Focus landed on that button, inside an `aria-hidden` ancestor. Enter then ran its `onClick` behind the still-open modal. So the line misstates where Base UI sends focus, which rubric 6 asks the spec to match. The JSDoc ships that wrong account to callers. Rewrite these lines to say that Shift+Tab reaches the page's tabbable elements before the portal, each `aria-hidden` but focusable and operable; the trigger is one of them, and in the stories the only one.

## P3

- **P3-1.** `docs/components/alert-dialog.md:44` This widens round 2's P3-1. After a press on the backdrop, focus goes to `<body>`. A stray Tab then Enter confirms the destructive action. Shift+Tab then Enter operates whatever page control precedes the portal behind the modal; I measured an added button's `onClick` running while the alert dialog stayed open. CR-1 leaves all of this to Base UI. The question for the maintainer: keep Base UI's behaviour, or add a `CR-n` that sends focus back into the popup, to Cancel, after a backdrop press? Either choice may need a contract-wide rule for the Panels family.
- **P3-2.** `packages/perron/src/components/AlertDialog/AlertDialog.stories.tsx:42` The subject story `Default` is uncontrolled (`defaultOpen`), as spec:187 asks, so pressing its Cancel or Clear filters does nothing. That shows the shape the Do row at spec:201, "Control the alert dialog with `open`", advises against. The question for the maintainer: should AlertDialog support uncontrolled use at all, or should the subject story be controlled, as `Actions` is?
- **P3-3.** `packages/perron/src/components/AlertDialog/AlertDialog.css:52` In `components-alertdialog--long-words`, in both themes, `overflow-wrap: anywhere` breaks "trafikinformationsoversigten" in `typography.heading-lg` mid-word with no hyphen ("trafikinformationsovers" / "igten?"). The contract's Long words rule allows this. `hyphens: auto` with the locale's `lang` would read better, but that is a choice for the whole contract.
