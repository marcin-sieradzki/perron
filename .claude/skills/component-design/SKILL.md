---
name: component-design
description: 'Draw a component or pattern in Penpot, check it, and write its read-back, code map and light and dark exports, up to the design gate.'
disable-model-invocation: true
argument-hint: '<Name>'
---

The design stage of the component loop ([ROADMAP](../../../ROADMAP.md), "Phase 4: The agent loop"). It draws one component or pattern in the "Perron Design System" Penpot file with the helpers in `penpot/helpers.js`, reads the drawing back into the repo, and exports every variant in both themes. Penpot owns the anatomy and the repo owns the values ([ADR 0002](../../../docs/adr/0002-penpot-owns-anatomy-repo-owns-values.md)).

It runs Local, through the Penpot MCP, in the tab the maintainer has connected. It ends at the **design gate**: it returns `done`, and the maintainer approves the design in Penpot, which the `factory` skill records; `npm run factory`, which only the `factory` skill runs, is the only writer of `components/<name>/pipeline.yaml`. This skill draws, checks and reports; the approval is the maintainer's.

## Names

- `<Name>` is the skill's argument, in PascalCase; `<name>` is the same in kebab-case.
- A component's page is `Components/<Name>`; a pattern's is `Patterns/<Name>`. Everything else below is the same for both.
- A **variant name**, such as `SolidHover`, follows the Conventions of [penpot/README.md](../../../penpot/README.md).

## Writes

- The Penpot page and the variant container on it, named `<Name>`.
- `penpot/<name>.json`, the read-back, and `penpot/<name>.code-map.json`, the code map ([penpot/README.md](../../../penpot/README.md), "Read-back").
- `penpot/<name>/<Variant>.light.png` and `penpot/<name>/<Variant>.dark.png` for every variant: PNG, scale 1. The light one holds the bytes the read-back hashes.

## Working in Penpot

Penpot's own prompting guidance, applied to every `execute_code` call:

- **Read before writing.** Start each session with `high_level_overview`. Read a page or shape before changing it. A plugin API member that `penpot/README.md` doesn't name (creating a page, a text layer, a component, an SVG shape, the token catalogue) gets a `penpot_api_info` lookup before its first use.
- **Small, reversible changes.** One call does one thing (opens a page, draws one variant, binds one shape's tokens) and returns what it made: ids, names, bound tokens. Check that result before the next call. Name every shape as you create it, for the part it becomes. A page that already holds work is changed in place, shape by shape; the shapes you remove are only ones this run made.
- **Never assume a missing value.** Every fill, stroke, radius, padding and gap is a token, bound with `storage.bind`, whose name you read from the Perron MCP's `list_tokens`. A value no token holds becomes a question (see [Returns](#returns)). A mechanism this skill marks as unverified is checked on first use, and the working way goes into the quirks of `penpot/README.md`, so the next run reads it.

## Steps

1. **Pre-flight.** Read, before the first write:
   - the [contract](../../../docs/components/README.md): Props, Design states, Token families, Families, Shared parts and, for a pattern, Patterns;
   - the [brand](../../../docs/foundations/README.md) and [content design](../../../docs/content-design.md), then the foundation page for each choice: [Semantic colours](../../../docs/foundations/semantic-colours.md), [Typography](../../../docs/foundations/typography.md), [Semantic spacing](../../../docs/foundations/semantic-spacing.md) (its focus ring too), [Elevation](../../../docs/foundations/elevation.md) for anything on glass, [Icons](../../../docs/foundations/icons.md) for any icon;
   - [penpot/README.md](../../../penpot/README.md), whole: conventions, read-back, what the plugin API does and its quirks;
   - the entry for `<Name>` in `packages/perron/components.json`, if there is one: its layer, category, `baseUiParts` and `dependsOn`;
   - for a component, the Perron MCP's `get_reference` (`library: 'base-ui'`) for each Base UI part, so each layer takes its part's name in camelCase, the name `slotProps` uses;
   - `penpot/<name>.json` and `penpot/<name>.code-map.json`, if an earlier run wrote them;
   - the Perron MCP's `list_tokens` for every value the drawing needs, by its job (`surface raised`, `text secondary`, `radius`).

   Done when you can name, from these sources: whether it is a component or a pattern, its family (or none), its shared parts, its parts and their layer names, its variant properties with their values, its `State` values (the contract's design states that its Base UI parts produce), and the token for every value on every part in every state. Each one the sources leave open is a question; with any open, return `pending` before drawing.

2. **Connect.** Call `high_level_overview`. Done when it answers from the "Perron Design System" file. When the Penpot MCP's tools are missing, or it answers that no plugin is connected, stop and return `failed`: "connect the Penpot tab".

3. **Load the helpers.** Read `penpot/helpers.js` and pass its whole content, unchanged, as the code of one `execute_code` call. Then run `return [typeof storage.bind, typeof storage.readBack]`. Done when that returns two `'function'`. Any later call that finds `storage.bind` missing means the tab reloaded: load the file again.

4. **Open the page.** Find the page by name in the overview, or create it and name it. Open it with `penpot.openPage(page)` and, in a later call, read `penpot.currentPage`. Done when `penpot.currentPage.id` is the page's id: pages switch asynchronously, and a shape drawn earlier lands on the old page.

5. **Draw**, one variant per call, to the conventions of `penpot/README.md`:
   - Each variant is a board laid out with flex, its children named for their parts, every value bound with `storage.bind` and read back from `shape.tokens` in the next call (binding is asynchronous).
   - Text layers bind their fill, and their typography role where the token catalogue holds it; check the token property name with `penpot_api_info` on first use and record it in the quirks.
   - Icons come from `packages/perron/icons/`, at an `icon.size.*` token.
   - Every state of a variant keeps its rest geometry: the same size, padding and layout. Only colours change, and a focus ring drawn outside the bounds.
   - Make each board a component, then combine their main instances with `penpotUtils.createVariantContainer`, each with its property values, and name the container `<Name>`. A component without variants stays one main instance.

   Done when the container holds one variant per combination the pre-flight named, each with its property values.

6. **Read back.** In one call, `return JSON.stringify(await storage.readBack(container), null, 2)`, with the container found by name on the page. Write the result to `penpot/<name>.json` and run `npx prettier --write` on it. Done when the file has one entry per variant and every state of a variant has its rest's `size` at the root. A difference is a drawing to fix in Penpot, then read back again; the file is only ever a fresh read-back, never edited by hand.

7. **Write the code map**, `penpot/<name>.code-map.json`, in the shape `penpot/README.md` shows: each variant property to its prop and values; `State` to `state`, each value to its selector from the contract's Design states (`default` is `null`); every layer name in the read-back to its part, `root` to `root`. Run `npx prettier --write` on it. Done when every property value and layer name in the read-back has an entry.

8. **Gate.** Run `npm run gates -- penpot`. Fix each problem in Penpot and go back to step 6; fix a code map problem in the code map. Done when it passes.

9. **Export**, every variant in both themes, the files named by variant name. The way out is unverified: check it on the first variant, then do the rest the same way.
   - **Light.** With `Light` the active theme, one call per variant returns the base64 of its PNG: `await main.export({ type: 'png', scale: 1 })`, where `main` is the variant's main instance, turned into a binary string with `String.fromCharCode` in a loop, then `btoa`. Write it with Bash, `base64 -d > penpot/<name>/<Variant>.light.png`, the base64 in a quoted heredoc. Its `sha256sum` matches that variant's `exports.png` in the read-back, which proves the bytes are the drawing's. A mismatch after a fresh read-back means PNG export is not deterministic: record that in the quirks and say so in your summary.
   - **Dark.** Find the token themes (`penpot.library.local.tokens.themes`, checked with `penpot_api_info`) and call `toggleActive()` on `Dark`. In the next call, read a bound fill: done switching when it shows the token's dark value from `list_tokens`. Export each variant the same way to `<Variant>.dark.png`.
   - **Back to light.** Toggle `Light` on, and read the same fill until it shows the light value again.
   - The first run records in the quirks of `penpot/README.md` where the themes live and how the bytes reached the file. When the MCP's `export_shape` tool writes a file whose hash matches the read-back, record that too: it is the cheaper way.

   Done when every variant has both files, every light file's hash matches the read-back, and the file is back on `Light`.

10. **Look.** Read every export, light and dark, and run the `design-qa` skill over them. A Defect or Polish finding is fixed in Penpot, and the run goes back to step 6, since the read-back, the gate and the exports all follow the drawing. Done when a pass finds no Defect and no Polish. Direction findings go in your summary for the maintainer.

## Returns

The run ends with one outcome and a short summary.

- **`done`**: the page, `penpot/<name>.json`, `penpot/<name>.code-map.json` and the path of every export. List each choice the sources left to you (a variant property, a state left out, a part's layout) and every Direction finding, so the maintainer weighs them at the gate.
- **`pending`**: the questions, numbered, each with your recommended answer. A value no token holds is one: "needs a token for `<what>`", answered through the `design-tokens` skill. Whatever the run drew stays on the page.
- **`failed`**: what stopped it, such as "connect the Penpot tab", with the last error.

Run by the maintainer by hand, the skill asks its questions as they come up, with the `grilling` skill, and carries on with the answers.
