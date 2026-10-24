---
name: component-docs
description: The docs stage. Writes a reviewed component's or pattern's Storybook docs page and turns its entry stable.
disable-model-invocation: true
---

The docs stage of the factory loop, for one component or pattern, `<Name>`. It runs in a fresh context once review has passed, so the page shows the API the reviewer accepted. It writes the docs page, `<Name>.mdx` beside the code, turns the registry entry `stable` and rebuilds what follows from that. It ends by returning an outcome to the `factory` skill, which owns `components/<name>/pipeline.yaml`: `done`, or `failed` with what is wrong.

The page is drawn from sources, never copied from them: the spec's prose through the `SpecProse` block, the stories live, and the props table through the `PropsTable` block, which reads the component's docgen. So the page's quality is the sources' quality, and a fault in a source goes back to its stage. The docs stage changes the page and the registry, and nothing the build or the brief wrote. Every page has the one shape in step 2; once phase 5 has built Button, Button's page is that shape applied, the reference to compare with.

For a pattern, read `docs/patterns/<name>.md` for the spec, `packages/perron/src/patterns/<Name>/` for the folder, and `patterns-<name>` for the Storybook id, everywhere this skill says otherwise.

## Steps

1. **Pre-flight.** Read, before the first write:
   - the spec, `docs/components/<name>.md`;
   - the stories, `packages/perron/src/components/<Name>/<Name>.stories.tsx`;
   - the props API: `<Name>Props` in `packages/perron/src/components/<Name>/<Name>.tsx`, each member with its JSDoc and its default where the component takes the prop apart;
   - `components/<name>/review.md`, whose `## P1` says `None.`;
   - the contract's [Files](../../../docs/components/README.md#files) section, with its status table.

   Then hold the sources against each other:
   - every row of the spec's Props table is a member of `<Name>Props` with the same default and a type that agrees, and every member is a row;
   - every story the spec's Stories table names is an export of the stories file;
   - the spec has the sections the page shows: `Keyboard and ARIA`, `Owned strings` and `Do and don't`, and no `[PENDING]`.

   Done when every check holds. A check that fails is the outcome: return `failed`, naming the source, the line and the mismatch, and write nothing.

2. **Write the page** at `packages/perron/src/components/<Name>/<Name>.mdx`, in exactly this shape, with `<Name>` and `<name>` filled in and nothing added:

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

   What each block draws, in order: the component's name; the spec's opening sentence; every story, live, with its code; the props table in MUI's layout (name, type, default, description, a required prop marked `*`), then a slots table with one row per `slotProps` key; then the three spec sections under their own headings. A prop's description is its JSDoc, and a slot's is "Props for the `<part>` part". Done when the file matches the shape line for line.

3. **Turn the entry stable.** In `packages/perron/components.json`, set the entry's `status` to `stable`, then run `npm run registry` and `npm run api`. Done when `packages/perron/api.json` holds `<Name>` with every member of `<Name>Props`.

4. **Look at the page.** Start `npm run storybook` and open `http://localhost:6006/iframe.html?viewMode=docs&id=components-<name>--docs` with Playwright, once with its `colorScheme` set to `light` and once to `dark`, and take a full-page screenshot of each. Done when, in both themes, every story renders, the props table has a row for every member of `<Name>Props` with the type and default the spec gives, the slots table has every `slotProps` key the spec's Anatomy gives, and each spec section shows under its heading. A row that is wrong is a fault in the code's types or JSDoc: return `failed`, naming the prop.

5. **Gates.** Run `npm run gates -- docs`, then `npm run check`. Done when both pass. A red check that the page or the registry change caused is this stage's to fix; any other is the outcome: return `failed` with the check and its output.

6. **Return** `done` with a two-line summary: the page's path, and the entry now `stable`.
