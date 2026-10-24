---
name: content-audit
description: "Content audit of the owned strings in all four locales and of the docs, against content design. Use when owned strings or a doc's prose change, in a review, or to audit the library's words."
---

Every word a component owns, in all four locales, and every page of the docs, held to content design. The locale tests already hold the dictionaries to one another and to content design's table of data-state words; this reads what no test can.

## Scope

One argument:

- `strings`: the four dictionaries and every component's use of them.
- `<Name>`: that entry's owned strings, the words in its spec, its stories' args and its `<Name>.mdx`.
- A doc's path, or a folder of them.
- `all`: all of the above, over every entry past `designing` and every page in `docs/`. The default when run by hand.

## Pre-flight

Read these before judging anything:

- `docs/content-design.md`, the rules, and `docs/glossary.md`, the terms.
- The contract's Words section, `docs/components/README.md`.
- The dictionaries: `packages/perron/src/locale/en.ts`, `da.ts`, `sv.ts` and `nb.ts` beside it. Each key's JSDoc in `en.ts` says where the string is seen or heard.
- Every file in scope.
- [`format.md`](../design-qa/format.md), how to report.

## Steps

1. **Run** the locale tests: `npx vitest run --project unit packages/perron/src/locale`. Done when they pass, or each failure is a Defect.
2. **Owned strings.** Read each key in all four locales against content design: sentence case; no exclamation mark or emoji; its numbers, units, minus sign, "—", "≈" and "~" as content design writes them; the data-state and delay words from its table; no more certainty than the data has. Each translation says what the English says, as a native speaker of that language would write it in that place, and fits where its JSDoc says it is seen: a button label that doubles in Danish is a finding. Done when every key has been read in every locale.
3. **Words in code.** In each entry's `.tsx` in scope, every word shown or announced comes from the caller or from `useOwnedStrings`, and each owned string has its `<key>Label` override, as the contract's Words section says. A literal in the markup, an `aria-label` or a `title` is a Defect. Done when every entry in scope has been searched.
4. **Docs.** Read each page in scope for content design and the house voice: sentence case headings, plain short sentences, British spelling, the glossary's terms, role words rather than names. A spec's Owned strings table gives the English `en.ts` has. Done when every page in scope has been read to the end.
5. **Report** in [`format.md`](../design-qa/format.md). A broken content-design or Words rule is a Defect. A sentence that keeps the rules but reads stiffly, or a translation a native speaker would phrase otherwise, is Polish, with the better wording. A new data-state word, or a term the glossary lacks, is Direction. Done when every finding gives its locale or file and line.

Return the report to the caller. Run by hand, fix the findings the maintainer agrees to and run step 1 again. A word changed in content design's table changes in the dictionaries in the same commit, and a changed owned string ships, so it takes a changeset.
