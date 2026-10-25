# Review: AlertDialog, round 2

## P1

None.

## P2

- **P2-1.** `docs/components/alert-dialog.md:3` The spec's opening line says the alert dialog "wraps Tab inside the popup until it closes", and the file header at `packages/perron/src/components/AlertDialog/AlertDialog.tsx:2-3` says the same. The round-1 fix to P2-2 rewrote lines 44, 127 and 151 to say what Base UI really does: after a press on the backdrop, focus moves to `<body>`, Tab lands on the confirming action, and Shift+Tab lands on the trigger, outside the popup. I measured this again in `components-alertdialog--default`. Lines 3 and 2-3 still deny it, so the spec now disagrees with itself (rubric 6: a fix that one line now says and another still denies). The Keyboard row (spec:127) and line 44 hold. Rewrite line 3 and the header comment to say Tab wraps inside the popup while focus is in it.
- **P2-2.** `docs/components/alert-dialog.md:65` The `defaultOpen` row says "Uncontrolled, the alert dialog closes only by Esc", and its JSDoc at `packages/perron/src/components/AlertDialog/AlertDialog.tsx:48-50` says the same. Line 44 and the Keyboard row at spec:128 disagree: Enter or Space on the trigger, reached by Shift+Tab after a press on the backdrop, also closes it, with reason `trigger-press`. I measured this in `components-alertdialog--default` (uncontrolled): after a backdrop press, Shift+Tab focuses "Clear all filters", and Enter closes the alert dialog. The Keyboard row and line 44 hold, as Base UI's behaviour. Rewrite the row and its JSDoc so they no longer say Esc is the only way out.

## P3

- **P3-1.** `docs/components/alert-dialog.md:127` After a press on the backdrop, focus goes to `<body>`. From there, a stray Tab then Enter confirms the destructive action. Shift+Tab then Enter on the aria-hidden trigger closes the alert dialog with `trigger-press`, so a keyboard user can leave a modal alert dialog without answering it. The spec now documents both as Base UI's behaviour, and CR-1 rules out pointer or focus handling of Perron's own. The question for the maintainer: keep Base UI's behaviour, or add a `CR-n` that sends focus back to Cancel after a backdrop press?
- **P3-2.** `packages/perron/src/components/AlertDialog/AlertDialog.stories.tsx:42` The `Default` story is the subject story and the first one on the docs page. It is uncontrolled (`defaultOpen`), as spec:187 asks, so its Cancel and Clear filters do nothing when pressed. That goes against the Do row at spec:201, "Control the alert dialog with `open`". The question for the maintainer: should AlertDialog support uncontrolled use at all, or should its subject story show the controlled shape that `Actions` shows?
- **P3-3.** `packages/perron/src/components/AlertDialog/AlertDialog.css:52` In `components-alertdialog--long-words`, in both themes, `overflow-wrap: anywhere` breaks "trafikinformationsoversigten" in `typography.heading-lg` mid-word with no hyphen ("trafikinformationsovers" / "igten?"). The contract's Long words rule allows this. `hyphens: auto` with the locale's `lang` would read better, but that is a choice for the whole contract.
