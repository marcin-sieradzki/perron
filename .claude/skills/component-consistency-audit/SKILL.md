---
name: component-consistency-audit
description: Audit the library for a shared part drawn twice, or a family member with a surface of its own.
disable-model-invocation: true
---

The contract draws each shared part once and gives each family one treatment. `npm run gates -- shared-parts` already fails a listed part's class, icon or declarations outside its folder. This audit finds what no gate can name: a part drawn twice under two names before it joins the table, and a family member that looks like no sibling.

## Pre-flight

Read these before writing anything:

- The contract, `docs/components/README.md`: Files, Families, Shared parts and Design states.
- `packages/perron/components.json`: every entry past `designing`, with its `category` and `dependsOn`.
- For each of those entries: its spec's Anatomy (its family and shared parts), its `.tsx` and `.css` in `packages/perron/src/components/<Name>/` or `packages/perron/src/patterns/<Name>/`, and its read-back `penpot/<name>.json` where it exists.
- Each shared part's folder, `packages/perron/src/parts/<Part>/`.
- [`rendering.md`](../design-qa/rendering.md), how to render, and [`format.md`](../design-qa/format.md), how to report.

## Steps

1. **List** the entries past `designing`, each with its family and the shared parts its spec names. With none, the report is "Checked: nothing; no entry is past designing", and the audit ends. Done when every entry has its row.
2. **Run** `npm run gates -- shared-parts component-css`. Done when they pass, or each failure is a Defect.
3. **Parts drawn twice.** For each entry, list what it draws itself rather than composes: each element with a rule of its own in its CSS, and each icon it imports. Compare the lists across entries: one icon in two entries' own markup, one block of declarations in two stylesheets, one structure (an icon button that closes, a tick beside a choice) built twice. Done when every entry's list has been compared with every other's.
4. **Family surfaces.** Render each family member's stories, and read the root's computed fill, border, radius, text and height at rest, hover and selected. Compare them with the family's row in the contract and with the other members, and compare the tokens each member's read-back binds. Done when every member of every family has been compared in every state its row names.
5. **Report** in [`format.md`](../design-qa/format.md). A listed part drawn outside its folder, or a member off its family's row, is a Defect. A shape two entries draw that the table does not list yet is Direction, proposing its row for Shared parts, since a new part joins that table first. An entry whose spec says "Family: none" but which looks like a member is Direction. Done when every finding names both entries, or the entry and its row.
6. **File** the findings the maintainer picks, one GitHub issue each, as `docs/agents/issue-tracker.md` says, titled `<Name>: <what>`. Done when each picked finding links its issue.
