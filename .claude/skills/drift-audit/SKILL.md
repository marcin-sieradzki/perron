---
name: drift-audit
description: Check that the docs and skills still match the repo, by running the commands and following the steps they name, and fix what drifted.
disable-model-invocation: true
---

A doc drifts when the repo changes under it. The `paths` gate already fails a path that no longer exists; this audit checks everything else a doc claims, by doing what it says.

## Scope

All the Markdown the `paths` gate reads (the list heads `scripts/checks/paths.ts`), or one file or folder of it. `ROADMAP.md` is a plan: only its ticked steps make claims. The vendored skills, `writing-for-agents` and `software-factory`, are upstream copies: report their drift and leave them as they are.

## Pre-flight

Read these before changing anything:

- The head comment of `scripts/checks/paths.ts`: which files are in scope.
- `package.json`'s scripts, and the gate rules, which `npm run gates -- --help` lists.
- `.claude/skills/writing-for-agents/SKILL.md`, before editing a skill or `CLAUDE.md`.
- Every file in scope, to the end.

## Steps

1. **Run** `npm run gates -- paths`. Done when it passes, after fixing any path it names.
2. **List the claims** each file in scope makes that the repo can confirm: commands and their flags, script names, gate rules, token names, component and prop names, MCP tools, skill and agent names, labels, counts ("the sixteen roles"), versions, field names, sections named in prose ("the contract's Families table"), "a test checks" sentences, and each step of a skill. Done when every file has its list.
3. **Check each claim** by doing it. Done when every claim is marked holds or drifted.
   - A command that only reads (`gates`, `test`, a `--check` script, `--help`): run it and compare its result with what the doc says it does.
   - A command that writes (`npm run tokens`, `registry`, `api`, `format`): run its `--check` form, or run it and confirm `git status` shows nothing new.
   - A command that acts outside the repo (`changeset version`, `changeset publish`, `gh issue create`): confirm it exists with `--help`, and leave it unrun.
   - A name, count or version: find it in its source (`package.json`, `package-lock.json`, `packages/perron/tokens/`, `packages/perron/components.json`, the heading it names).
   - "A test checks": find the test with `git grep` and read that it asserts it.
   - A skill's step: walk it once without writing. Each file it reads says what the step expects, and its completion criterion can be seen with the tools it names.
4. **Fix or raise** each drifted claim. Where the repo is plainly right (a renamed script, a moved section, a new count), change the doc to match it. Where the doc records a decision, an ADR or a contract rule, the code may be what drifted: raise it as a finding for the maintainer. A table between `<!-- tokens -->`, `<!-- contrast -->` or `<!-- files -->` markers is rebuilt by `npm run tokens`, never edited. Done when every drifted claim is fixed or raised.
5. **Deliver.** Run `npm run check`. Commit the fixes on a branch and open a PR whose body lists what was fixed and what needs a decision, by file and line. A page in `PAGES` (`scripts/lib/pages.ts`) ships inside `@mylder/perron`'s docs data, so a fix there takes a changeset. Done when the check passes and the PR is open, or, with nothing drifted, when the maintainer has the count of claims checked.
