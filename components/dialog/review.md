# Review: Dialog, round 2

## P1

- **P1-1.** `packages/perron/src/components/Dialog/Dialog.css:77` `.pn-Dialog-content` sets `typography.body` on the caller's `children` but not `overflow-wrap: anywhere`. So in `components-dialog--default` at 320 px (light and dark), a string child holding one long Danish word, such as "Kortvisningsnavigationstastaturgenvejsbeskrivelse", runs past the popup's padding: the popup measures `scrollWidth` 351 against `clientWidth` 294 and scrolls sideways. The title and the description wrap the same word. This breaks the design-qa Text line ("Long words, Danish and Swedish strings and a 320 px width wrap ... never overflow") and the contract's What axe won't catch line "Every shape the type accepts renders". It also asks for two-dimensional scrolling at 320 px, which WCAG 1.4.10 forbids. EmptyState puts this rule on its root and Text on its own root. The fix is to give the content part the rule too, and to widen CR-9 (`docs/components/dialog.md:192`) and its checklist copy (`docs/components/dialog.md:165`), which name only the title and the description.

## P2

None.

## P3

- **P3-1.** `docs/components/dialog.md:13` Round 1's P3-2 is still open. The spec still describes the run and its branches rather than the component: "the Dialog build adds it exactly as the Sheet build (branch `component/sheet`) draws it". The same goes for line 5 ("not in any branch this run can reach"), lines 130 and 134 ("as the Sheet build does", "drawn file for file as the Sheet build draws it") and line 199 ("which the Dialog branch takes from `main`"). Once merged, these lines point at a run rather than at the `CloseButton` part's folder. The maintainer may want them to say only what the part draws and where it lives.
- **P3-2.** `packages/perron/src/components/Dialog/Dialog.tsx:44` Dialog names its row of controls `actions`, which is MUI's `DialogActions`. EmptyState, Section, DataStatePanel and DetailHeader each take a singular `action`, and DetailHeader's holds "the panel's controls", which may be several. Sheet, the next Panels member, will copy one of the two forms. This is a question for the maintainer (api-consistency, "One idea, one name"): keep `actions` for a row of several Buttons, or take the library's `action`.
