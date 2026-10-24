---
name: component-build
description: 'Build a component or pattern from its approved spec: code, CSS and stories, registered as building, self-gated until clean and green on npm run check.'
disable-model-invocation: true
argument-hint: '<Name>'
---

The build stage of the component loop ([ROADMAP](../../../ROADMAP.md), "Phase 4: The agent loop"). It turns the spec into code: `<Name>.tsx`, `<Name>.css` and `<Name>.stories.tsx` in `packages/perron/src/components/<Name>/`, and the entry in `packages/perron/components.json` at `building`. `<Name>` is the skill's argument, in PascalCase; `<name>` is the same in kebab-case.

For a pattern, read `docs/patterns/<name>.md` for the spec, `packages/perron/src/patterns/<Name>/` for the folder and `Patterns/<Name>` for the stories' title, everywhere this skill says otherwise, and hold the code to the contract's Patterns section too.

It runs in a fresh context the `factory` skill starts, so it cannot ask the maintainer: what the inputs leave open is a reason to return `failed`, never a guess. **Shared tooling** is the maintainer's, built for every component at once: `scripts/`, `.storybook/`, `storybook/blocks/`, the site tests such as `scripts/lib/site.test.ts`, and `.prettierignore`. A build never edits it to get its own run through: when a tool stands in the way, at any step, the run returns `failed`, naming the tool, its line and the gap, and the maintainer changes the tool for every component. It spends its own three attempts inside this one run (step 5); the factory records the run's outcome, and `npm run factory`, which only the `factory` skill runs, is the only writer of `components/<name>/pipeline.yaml`. Next comes the [`component-reviewer`](../../agents/component-reviewer.md) agent, from the spec, the diff and the gates only: its rubric is the bar, and the self-gate clears it before the reviewer sees anything.

## Steps

1. **Pre-flight.** Read, before the first write:
   - **the contract**, [docs/components/README.md](../../../docs/components/README.md), whole;
   - **the spec**, `docs/components/<name>.md`, whole;
   - **the read-back**, `penpot/<name>.json`, with the code map `penpot/<name>.code-map.json`, every export `penpot/<name>/<Variant>.light.png` and `penpot/<name>/<Variant>.dark.png`, and the Conventions of [penpot/README.md](../../../penpot/README.md), which name each variant. With the design deferred (`deferred` in `components/<name>/pipeline.yaml`, [ADR 0010](../../../docs/adr/0010-unattended-runs-with-design-deferred.md)), the spec stands in for all of these: its Stories table names the variants and its Tokens table their values;
   - **the reference component**: Button's `.tsx`, `.css` and stories, at the paths of the contract's Files table, once phase 5 has built it. Until then, the contract's own examples (Root, Customising, Styling, Words) and the `Keyboard` story in `storybook/contract/Contract.stories.tsx` for a `play` test.

   Then what the code reaches for: `packages/perron/src/PerronProvider.tsx`, `packages/perron/src/locale/en.ts` and `packages/perron/src/testing/owned-strings.ts`; the entry for `<Name>` in `packages/perron/components.json`, and the code of each entry in its `dependsOn` and each shared part the spec's Anatomy names; the Perron MCP's `get_reference` (`library: 'base-ui'`) for each Base UI part the spec names; and the [`vercel-react-best-practices`](../vercel-react-best-practices/SKILL.md) skill, whose re-render, rendering, JavaScript and advanced rules hold the React this run writes, the contract winning where they differ.

   **On a rerun**, `components/<name>/review.md` and `components/<name>/visual/report.md` are inputs too, when they exist, with the code already written, and so is `failing` under `build` in `components/<name>/pipeline.yaml` when it reads `docs failed: …`, the docs stage's send-back: each P1 and P2 finding in the review, each failure in the visual report and the fault the docs stage named is this run's first work, fixed at the line it names in step 2.

   Done when you can name, from these sources, every prop with its type and default, every part with its Base UI part, class and `slotProps` key, the token for every part in every state, every owned string, every `CR-n`, and every story with its `play` test. A `[PENDING]` left in the spec, or a section the code needs that the spec leaves open, is the outcome: return `failed`, naming the section.

2. **Write** the three files to the contract and the spec, the reference component's shape where it has one:
   - **`<Name>.tsx`**: each Props row a member of `<Name>Props`: a declared one with its description as the JSDoc, and one reading `inherited` under Base UI prop inherited from the Base UI props type as it is, keeping Base UI's JSDoc, so `<Name>Props` declares only its own members (the contract's [Props](../../../docs/components/README.md#props)); each Base UI part the spec's Base UI parts table names, with what Perron sets and what it passes through; each `CR-n` kept, and what "Base UI already does" left to Base UI.
   - **`<Name>.css`**: for each Tokens row, its part's class, its state's selector from the code map (with the design deferred, from the contract's Design states), and its token.
   - **Owned strings**: each new key in all four locale files in `packages/perron/src/locale/`, the English from the spec, the Danish, Swedish and Norwegian by [content design](../../../docs/content-design.md).
   - **`<Name>.stories.tsx`**: one story per variant in the read-back, or per row of the spec's Stories table with the design deferred, exported under its variant name, such as `SolidHover`, its props from the code map or the spec. The meta's `args` hold every required prop and caller word, so any story renders alone: the contract story renders `Default`, or else the first export in alphabetical order, as a module namespace lists them. A state a prop reaches (disabled, invalid, selected, `defaultOpen`) is set in its story's args; hover, focus and pressed render at rest, and the renderer drives them. A `play` test for each the spec's Stories table names, ending at rest; a render with more words, such as an open popup, gets its own `expectOwnedStrings` call. An overlay's stories follow the contract's [Stories](../../../docs/components/README.md#stories): open by `defaultOpen` with a trigger, each in its own docs frame, which shows the first render and leaves `play` to the tests.

   Run `npx prettier --write` on every file you wrote. Done when every row of the spec's Anatomy, Base UI parts, Props, Tokens, Owned strings and Stories, and every `CR-n`, has its line in code, and on a rerun every finding from the pre-flight is fixed.

3. **Register.** In `packages/perron/components.json`, set the entry's `status` to `building`, and its `baseUiParts` and `dependsOn` to what the code imports; when that changes either from what the brief read, rewrite each spec line that names it (the intro, Anatomy, Base UI parts) in step with it, since the spec is the component's page; with no entry, add one with every field `scripts/lib/entry.ts` lists, in its family's category. Run `npm run generate`, which runs `registry` (the barrels, the exports and the sort order), then `api` and `tokens`, which rebuild `packages/perron/data/docs.json` with the spec page `registry` adds to `PAGES`, so the first `npm run check` finds nothing stale. Then what it leaves to you:
   - the spec's Storybook page, `storybook/pages/<name>.mdx`, as `storybook/pages/contract.mdx` with `title="Specs/<Name>"` and the spec's path;
   - a changeset, `.changeset/<name>.md`, `'@mylder/perron': minor`, "Adds `<Name>`.", since a `building` entry ships in the barrel.

   Done when `npm run registry:check` passes, both files exist, and `npm run storybook` lists every story under `Components/<Name>` in `index.json` on its port ([design-qa/rendering.md](../design-qa/rendering.md)).

4. **Self-gate.** With Storybook still running, three passes over the rendered stories, each by its skill, rendering as [design-qa/rendering.md](../design-qa/rendering.md) says and reporting in [design-qa/format.md](../design-qa/format.md):
   - **Design quality**: [`design-qa`](../design-qa/SKILL.md) on `<Name>`, every story in light and dark, with hover, focus and pressed driven by Playwright from the code map's selectors.
   - **Accessibility**: [`accessibility-audit`](../accessibility-audit/SKILL.md) on `<Name>`. Its step 2 is the list this gate keeps: for every story and each state its `play` test reaches, each landmark and control with its role, name and state, then the text inside `aria-hidden` and `inert`, held line by line to the contract's What axe won't catch and the spec's copy of it.
   - **API consistency**: [`api-consistency`](../api-consistency/SKILL.md) on `<Name>`, which scopes it to the family.

   Fix every Defect and Polish finding at its line, then run all three passes again. Done when one round of all three finds no Defect and no Polish. Each Direction finding goes in the summary. A finding whose fix would break the spec, the read-back or a token is not the build's to make: return `failed`, naming the finding and the line it traces to.

5. **Gates.** Stop Storybook and run `npm run check`, which holds the gates and the story tests (axe and every `play`). A red run is an attempt: fix its first failing check, run the self-gate again on every story the fix changes, and run the check again. Between runs, `npx vitest run --project stories <path to the stories file>` tests the stories alone and counts no attempt. Done when the check passes. At the third red run, stop.

## Returns

The run ends with one outcome and a short summary.

- **`done`**: the files written, the entry at `building`, and every Direction finding, so the maintainer weighs them at the PR.
- **`failed`**: after the third red run, the failing check, its first failing line, and why the last fix missed. Before it, the spec section, the self-gate finding or the gap in shared tooling that stopped the run.

Run by the maintainer by hand, a section the spec leaves open is asked with the `grilling` skill, its answer written into the spec, and the run carries on.
