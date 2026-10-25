---
name: component-docs
description: The docs stage. Writes a reviewed component's or pattern's Storybook docs page and turns its entry stable.
disable-model-invocation: true
argument-hint: '<Name>'
---

The docs stage of the factory loop, for one component or pattern, `<Name>` (`<name>` in kebab-case). It runs in a fresh context once review has passed, so the page shows the API the reviewer accepted. It writes the docs page, `<Name>.mdx` beside the code, turns the registry entry `stable` and rebuilds what follows from that. It ends by returning its outcome (see [Returns](#returns)), which the factory records; `npm run factory`, which only the `factory` skill runs, is the only writer of `components/<name>/pipeline.yaml`.

The page reads its sources live: the spec's prose through the `SpecProse` block, the stories, and the props table through the `PropsTable` block, which reads the component's docgen. So the page's quality is the sources' quality. The docs stage writes the page and the registry entry, and the spec, the code and the stories stay as the brief and the build wrote them. So does the **shared tooling** [`component-build`](../component-build/SKILL.md) names, the `PropsTable` and `SpecProse` blocks among it: when a tool draws a source wrong, return `failed` with `failing` starting "Shared tooling:", naming the tool, its line and the gap, and the maintainer changes it for every component. A **fault in a source** is the outcome: return `failed`, naming the source, its line, the mismatch and the stage it belongs to (the brief for the spec, the build for the code, its types and JSDoc, and the stories). The factory sends a first failed docs run back to build, whose fresh run reads your `failing` text as its first work; a second stops the loop for the maintainer. Every page has the one shape in step 2; once phase 5 has built Button, Button's page is that shape applied, the reference to compare with.

For a pattern, read `docs/patterns/<name>.md` for the spec, `packages/perron/src/patterns/<Name>/` for the folder, and `patterns-<name>` for the Storybook id, everywhere this skill says otherwise.

## Steps

1. **Pre-flight.** Read, before the first write:
   - the spec, `docs/components/<name>.md`;
   - the stories, `packages/perron/src/components/<Name>/<Name>.stories.tsx`;
   - the props API: `<Name>Props` in `packages/perron/src/components/<Name>/<Name>.tsx`, each member with its JSDoc and its default where the component takes the prop apart. Its **members**, everywhere in this skill, are those it declares and those it inherits from Base UI, such as `render` or `nativeButton`, which keep Base UI's JSDoc and `@default`; the HTML element's attributes, from React's types, are not members here and get no row, as in MUI's tables, but for `className`, `style` and `ref`, which every table shows;
   - `components/<name>/review.md`, whose `## P1` and `## P2` say `None.`;
   - the contract's [Files](../../../docs/components/README.md#files) section, with its status table.

   Then hold the sources against each other:
   - every row of the spec's Props table is a member of `<Name>Props` with the same default and a type that agrees, and every member is a row, an inherited one reading `inherited` under Base UI prop (the contract's [Props](../../../docs/components/README.md#props)); `npm run gates -- docs` holds the rows and members to each other;
   - every story the spec's Stories table names is an export of the stories file;
   - the spec has the sections the page shows: `Keyboard and ARIA`, `Owned strings` and `Do and don't`, and no `[PENDING]`.

   Done when every check holds. A check that fails is a fault in a source, found before the first write: return `failed`, naming the source, its stage, the line and the mismatch.

2. **Write the page** at `packages/perron/src/components/<Name>/<Name>.mdx`, in exactly this shape, line for line, with `<Name>` and `<name>` filled in:

   ```mdx
   import { Meta, Stories, Title } from '@storybook/addon-docs/blocks'
   import { PropsTable } from '../../../../../storybook/blocks/PropsTable.tsx'
   import { SpecProse } from '../../../../../storybook/blocks/SpecProse.tsx'
   import * as <Name>Stories from './<Name>.stories.tsx'

   <Meta of={<Name>Stories} />

   <Title />

   <SpecProse path="docs/components/<name>.md" intro />

   <Stories title="Examples" />

   <PropsTable of={<Name>Stories} />

   <SpecProse
     path="docs/components/<name>.md"
     sections={['Keyboard and ARIA', 'Owned strings', "Do and don't"]}
   />
   ```

   A compound component, whose parts `<Name>.tsx` exports beside the root (Toolbar's `ToolbarButton`, `ToolbarGroup`, `ToolbarSeparator`), adds `import { <Part>, … } from './<Name>.tsx'` and, after the root's `<PropsTable>`, one block per part in the order of the spec's Props tables: an `<h2>` naming the part inside `<Unstyled><div className="pd-page">`, then `<PropsTable of={<Part>} />`, which reads the part's docgen with no stories file of its own. Toolbar's page is that shape applied.

   What each block draws, in order: the component's name; the spec's opening sentence; every story, live, with its code; the props table in MUI's layout (name, type, default, description, a required prop marked `*`), then a slots table with one row per `slotProps` key; then the three spec sections under their own headings. A prop's description is its JSDoc, and a slot's is "Props for the `<part>` part". Done when the file matches the shape line for line.

3. **Turn the entry stable.** In `packages/perron/components.json`, set the entry's `status` to `stable`, then run `npm run registry` and `npm run api`. Done when `packages/perron/api.json` holds `<Name>` with every member `<Name>Props` declares itself (the API leaves out the members Base UI owns).

4. **Look at the page.** Start `npm run storybook` and open `iframe.html?viewMode=docs&id=<id>--docs` on its port, where `<id>` is the stories' title lowercased, `/` as `-` and no hyphen inside the name (`components-alertdialog`, `patterns-datastatepanel`), as `index.json` there lists it ([design-qa/rendering.md](../design-qa/rendering.md)) with Playwright, once with its `colorScheme` set to `light` and once to `dark`, and take a full-page screenshot of each. The page shows each story's first render and runs no `play` (the contract's [Stories](../../../docs/components/README.md#stories)), so an overlay's story shows it open, in its own frame; a story that shows only its trigger, or an overlay drawn over the page, is a fault in the stories, the build's. Done when, in both themes, every story renders, the props table has a row for every member of `<Name>Props`, inherited ones included, with the default the spec gives and a type that agrees with the spec's (an inherited member shows Base UI's own type and JSDoc), the slots table has every `slotProps` key the spec's Anatomy gives, and each spec section shows under its heading. A row that is wrong is a fault in a source, the code's types or JSDoc: return `failed`, naming the prop and the build as its stage.

5. **Gates.** Run `npm run gates -- docs`, then `npm run check`. Done when both pass. A red check that the page or the registry change caused is this stage's to fix; any other is a fault in a source: return `failed` with the check, its output and the stage it belongs to.

6. **Return** `done`, in the shape of [Returns](#returns). Done when the summary names the page's path and the entry's status, `stable`.

## Returns

The run ends with one outcome and a short summary. Whatever the outcome, a Direction finding met on the way, a choice the maintainer may want to revisit, goes in `direction`, one line each, for the PR.

- **`done`**: the page's path, and the entry now `stable`.
- **`failed`**, from shared tooling: `failing` starts "Shared tooling:" and names the tool, its line and the gap; the factory stops for the maintainer without a build rerun.
- **`failed`**: the fault in a source, with the source or the red check, the line or the output, the mismatch, and the stage it belongs to. The build's next run fixes it from this text, so name the fix where you can ("add `@default 'plain'` to `tone`'s JSDoc").
