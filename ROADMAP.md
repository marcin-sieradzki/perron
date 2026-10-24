# Roadmap

How Perron grows from foundations into Mylder's full design system. It has three layers: foundations, components on [Base UI](https://base-ui.com) with APIs shaped like [MUI](https://mui.com/material-ui/)'s, and patterns built from those components for Mylder's own screens. Each component and pattern is designed in Penpot before it is built, by a small loop of agents, with Marcin holding two gates. It keeps what Perron already has: DTCG tokens as the source, one brand, and Mylder's colours and voice.

The decisions behind the plan are in [docs/adr/](docs/adr/), and the words it uses are in [docs/glossary.md](docs/glossary.md).

## How to follow it

Work the phases in order. Steps inside a phase can run in parallel unless one names another. Each step says what to make, how, where it runs, and when it is **done**. Tick its box in the PR that finishes it.

- **Mac** steps run in a Claude Code session on Marcin's Mac, local or through Remote Control. That is where the Penpot MCP is. The "Perron Design System" file must be open in Chrome and connected (File → MCP Server → Connect), with the tab kept active. The whole component loop runs here by default.
- **Any** steps run on the Mac or in a cloud session on the repo. The cloud is the fallback when the Mac is offline. base-ui.com and mui.com are on the cloud environment's allowed domains, so the hosted docs work there too.
- **Marcin** steps need a person: an account, a setting or an approval.

Write every agent-facing file a step creates (a skill, an agent, `CLAUDE.md`, a spec template) with the `writing-for-agents` skill. Every step ends with `npm run check` passing.

## Phase 1: Repo and release rails

- [ ] **1.1 Workspace.** Any. Move to npm workspaces: `packages/perron`, published as `@mylder/perron` (tokens, styles, icons, logos and their build), and an empty `packages/mcp`, published as `@mylder/perron-mcp`. Storybook, the docs and the repo skills stay at the root. Move the folders with `git mv`, keep the `exports` paths the same under the new package, and update the paths in `scripts/`, the tests, `.storybook/` and `CLAUDE.md`. **Done** when `npm run check` and `npm run storybook:build` pass, and `npm pack -w @mylder/perron --dry-run` lists `tokens.css`, `perron.css` and the icons.
- [ ] **1.2 npm org.** Marcin. Create the free npm organisation `mylder`, and add the repository as a trusted publisher for both packages. **Done** when both names show as yours on npmjs.com.
- [ ] **1.3 Releases.** Any, after 1.1 and 1.2.
  - Add Changesets (`@changesets/cli`) for versions and changelogs.
  - Add a `release.yml` workflow that publishes from CI with npm trusted publishing and `--provenance`.
  - Before publishing, `scripts/smoke-consumer.ts` packs the tarball and installs it in a scratch Vite app that imports `perron.css` and `tokens.ts`.

  **Done** when `@mylder/perron@0.1.0` (foundations only) is on npm and Mylder can install it.

- [ ] **1.4 Docs site.** Any. Deploy Storybook to GitHub Pages from CI. From the same sources, the build also writes:
  - `llms.txt`, one line per page;
  - a `.md` twin of every page;
  - a consumer `AGENTS.md`: install, rules, where to look.

  **Done** when the site is live and `llms.txt` lists every page in `PAGES`.

- [ ] **1.5 Perron MCP, foundations and references.** Any. A stdio MCP server in `packages/mcp`, run with `npx @mylder/perron-mcp`. It reads only generated data shipped in `@mylder/perron`, plus, in the repo, the docs bundled in the installed libraries. First tools:
  - `list_tokens`: name, type, value per theme, description;
  - `search_docs`: foundation pages and content design;
  - `get_reference(library, component, part)`: only the API reference section of a Base UI or MUI page, from `node_modules/@base-ui/react/docs/` or `node_modules/@mui/material/docs/material-ui/`. It is exact for the pinned version and small enough to read; Base UI's Select page is 180 KB, mostly demos.

  `.mcp.json` lists three servers:
  - the Perron server;
  - `@mui/mcp`, version pinned;
  - Base UI's hosted `llms.txt` through `mcpdoc`.

  Skills read `get_reference` first. They use the hosted ones for usage and examples, which describe the latest release rather than ours. A test holds the server's tool list to its registrations, so a doc never names a tool that does not exist. **Done** when, with the server in `.mcp.json`, Claude Code answers "which token is the warning surface in dark?" and "what props does Base UI's Select.Positioner take?" from the tools.

## Phase 2: The component contract

Nothing here builds a component. It builds what every component is checked against.

- [ ] **2.1 Dependencies.** Any.
  - Add `@base-ui/react`, pinned exactly (1.9.0 today), with `react` and `react-dom` 19 as peers.
  - Add `@mui/material` as an exact dev dependency, used only for its bundled docs.
  - Add one line to `CLAUDE.md`: library API questions go to `get_reference`.
  - Lint (`oxlint` `no-restricted-imports`) bans:
    - `@mui/*` at runtime;
    - the old `@base-ui-components/*` name;
    - `@base-ui/react/internals/*`.

  **Done** when a test import of `@base-ui/react/button` builds and a banned import fails `npm run check`.

- [ ] **2.2 The contract.** Any. Write `docs/components/README.md`, the rules every component follows, and beside it the spec template `docs/components/TEMPLATE.md`. The rules, from the ADRs:
  - **Props:** Base UI underneath, MUI-shaped props on top.
    - `variant`, and `color` limited to token-backed intents;
    - `size`: `small | medium | large`;
    - adjective booleans: `disabled`, `fullWidth`;
    - `startIcon` and `endIcon`.
  - **State and events:** Base UI's, not MUI's.
    - `value`, `defaultValue` and `onValueChange(value, details)`;
    - `open`, `defaultOpen` and `onOpenChange`.
  - **Customising:**
    - Base UI's `render` prop swaps the element.
    - `slotProps`, keyed by Base UI part, is the only way inside.
    - There is no `sx`, `classes`, `component`, `styled` or theme object.
  - **Styling:**
    - a stable class (`pn-Button`, `pn-Button-icon`);
    - `data-variant`, `data-color` and `data-size`, plus Base UI's own `data-*` states;
    - plain CSS that reads them and uses only `--perron-*` tokens;
    - tokens stay on `:root`, because popups render in a portal.
  - **Root:** `ref` and the rest props reach the root element, and every prop has JSDoc.
  - **Words:** visible content, such as a button's text, comes from the caller. Every string a component owns, such as a pagination button's "Previous page", comes from the locale dictionaries of 2.3, and a `*Label` prop can override it on one instance.
  - **Files:**
    - code: `packages/perron/src/components/<Name>/<Name>.tsx`, `<Name>.css` and `<Name>.stories.tsx`;
    - spec: `docs/components/<name>.md`.

  Add the pages to `PAGES`, to Storybook, and to its sort order under a "Components" section. **Done** when:
  - every rule above has a home in the contract;
  - the template has a section each for anatomy, Base UI parts, props, tokens per part and state, keyboard and ARIA, owned strings, and do and don't.

- [ ] **2.3 Locales.** Any.
  - `PerronProvider`, with `locale` set to `en` (the default), `da`, `sv` or `nb`.
  - One dictionary per locale in `packages/perron/src/locale/`.
  - A test fails when a key is missing from any locale, or when a component renders an owned string that is not in the dictionary.
  - Agents write the Danish, Swedish and Norwegian.
  - Add the Swedish and Norwegian data-state and delay words to `docs/content-design.md`, beside the English and Danish.

  **Done** when the provider switches a sample string in all four languages.

- [ ] **2.4 Registry.** Any. `components.json` lists each component and pattern:
  - name, layer (`component | pattern`) and category;
  - status: `designing | building | stable | deprecated`;
  - Base UI parts and Penpot path.

  Generators fill:
  - the barrels `src/index.ts` and `src/patterns.ts`;
  - the package `exports`;
  - the Storybook sort order and the page lists.

  A drift check (`git diff --exit-code` after generating) fails when a generated file is stale. **Done** when adding a dummy entry fails `npm run check` until the generators run.

- [ ] **2.5 Gates as code.** Any. Add checks to `npm run check`, one script per rule, a test with a failing fixture for each, and an in-place `/* perron-allow(<rule>): reason */` for a deliberate exception. The rules:
  - **Component CSS:** no raw colour, length or duration, no `var()` fallback, and no `--perron-*` name that the tokens don't define.
  - **Props:** the vocabulary of 2.2, and JSDoc on every prop, read with the TypeScript compiler API.
  - **Patterns:** a pattern imports only Perron components, never Base UI.
  - **API compatibility:** the generated props API of each `stable` component may only grow against the last release tag. Deliberate breaks go in a table.
  - **Paths:** every path a doc or skill names exists.

  **Done** when every check fails on its fixture.

- [ ] **2.6 Story tests.** Any.
  - Add `@storybook/addon-vitest` and `@storybook/addon-a11y`, with axe in `error` mode, run headless in Chromium in CI.
  - A contract story renders every component with a `ref` and a `data-testid`, and fails unless both land on one element.
  - `play` functions test the keyboard behaviour.

  **Done** when a story with an unlabelled button fails CI.

## Phase 3: Penpot rails

Penpot owns each component's anatomy and variants. The repo owns the token values, and the token build already feeds Penpot.

- [ ] **3.1 Smoke test.** Mac. On a scratch page of the library file, check with `execute_code` that the plugin API on today's Penpot can:
  1. bind a colour, a padding and a radius token to a shape, and read them back from `shape.tokens`;
  2. build a variant container with `penpotUtils.createVariantContainer`;
  3. export a board as PNG bytes (base64) and as SVG;
  4. switch the active token theme and switch it back.

  Recent Penpot releases fixed bugs in exactly these. Write what works, and the workarounds, to `penpot/README.md`. **Done** when each of the four has a yes, or a no with a workaround.

- [ ] **3.2 Helpers and conventions.** Mac, after 3.1. Write `penpot/helpers.js`, loaded into the MCP's `storage` at the start of every Penpot session:
  - `bind(shape, property, tokenName)`, which throws on a token that doesn't exist;
  - `readBack(container)`.

  The conventions, in `penpot/README.md`:
  - one page per component, `Components/<Name>` or `Patterns/<Name>`;
  - variant property names and values are the React prop names and values;
  - layer names are the part names: `root`, `label`, `startIcon`;
  - interaction states are a `State` property mapped to CSS states, not props;
  - every value is bound to a token, never a literal.

  **Done** when a scratch component drawn with the helpers passes the checks of 3.3.

- [ ] **3.3 Read-back and checks.** Any.
  - `penpot/<name>.json` holds the file and component ids, the variant properties, a layer tree with the layout, size and bound tokens of each layer, and a hash of each export.
  - `penpot/<name>.code-map.json` maps each Penpot property and layer to a React prop or a CSS state.

  The checks, in `npm run check`:
  - every token name exists in `tokens/`;
  - the code map covers every variant value and named layer;
  - no layer has an unbound fill, stroke, radius, padding or gap.

  **Done** when a fixture with an unbound fill fails.

## Phase 4: The agent loop

After the design step, three agent contexts run in sequence, rather than as an agent team. Marcin holds two gates, and code checks everything between them. Every skill starts with a **pre-flight**: the files it must read before it may write, named so that no agent can skip them.

| Stage  | Runs                        | Reads                                                                 | Writes                                                                   | Gate                                                        |
| ------ | --------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------- |
| Design | Mac                         | The contract, the foundations, tokens through the MCP                 | The Penpot page, `penpot/<name>.json`, the code map, the exports         | 3.3 checks; **Marcin approves the design in Penpot**        |
| Brief  | Mac                         | The read-back, `get_reference` for the Base UI parts, the contract    | `docs/components/<name>.md`, with `[PENDING]` questions                  | Template complete; Marcin answers the `[PENDING]` questions |
| Build  | Any                         | The approved spec and the read-back only                              | Component, CSS, stories (one per variant, named as in Penpot), docs page | `npm run check` and story tests; 3 attempts, then stop      |
| Review | Any, fresh-context subagent | The spec, the diff and the gate output, never the builder's reasoning | `review.md`, with P1, P2 and P3 findings                                 | No P1; 2 rounds, then Marcin                                |
| Visual | Any, with the Mac's exports | Storybook and the read-back                                           | A geometry and colour report, and pixel-diff images                      | Parts within 1 px and on their tokens; **Marcin signs off** |

- [ ] **4.1 `component-design` skill.** Mac. Draws a component or pattern in Penpot from the contract with the 3.2 helpers, checks it, exports PNGs in light and dark, and writes the read-back and the code map. Penpot's own prompting guides apply: read before writing, make small reversible changes, and never assume a missing value.
- [ ] **4.2 `component-brief` skill.** Mac. Turns the read-back into the spec:
  - the anatomy, mapped to Base UI parts;
  - the props table in MUI's layout: name, type, default, and the Base UI prop it maps to;
  - the tokens per part and state;
  - the keyboard and ARIA contract, from the Base UI reference;
  - the component rules, such as `CR-1`: Base UI's Select already handles typeahead, so don't rebuild it.

  A question the sources can't answer goes in as `[PENDING]`, and the `grilling` skill puts it to Marcin.

- [ ] **4.3 `component-build` skill.** Any. Its pre-flight reads the spec and the read-back. It builds to the contract and runs the gates. It gets three attempts at a red gate, then stops and says what is failing.
- [ ] **4.4 `component-reviewer` agent.** Any. `.claude/agents/component-reviewer.md`, with read-only tools plus the test commands. Its rubric covers:
  - a design-quality pass on the rendered stories in both themes (alignment, spacing, contrast, states that don't move geometry), with findings sorted into Defect, Polish or Direction;
  - the accessibility checks axe can't make: focus order, announcements, reduced motion, target size;
  - API consistency with sibling components;
  - misuse of Base UI: rebuilt behaviour, a lost `render` or ref;
  - the owned strings and docs, against `docs/content-design.md`.
- [ ] **4.5 `build-component` orchestrator skill.**
  - It owns `components/<name>/pipeline.yaml` (stage, approvals, attempts, open P1s) and is the only one that writes it.
  - It starts each stage and refuses one whose input is missing or unapproved.
  - It runs every stage in one session on the Mac. In the cloud it runs Build, Review and Visual, and stops at a Mac stage to tell Marcin what to start.

  **Done**, for the whole phase, when a dry run on a made-up component reaches each gate and stops there.

- [ ] **4.6 Library audits.** Any. Skills that run across the whole library:
  - `api-consistency`;
  - `accessibility-audit`;
  - `content-audit`;
  - `drift-audit`, which checks that docs and skills still match the repo by running what they say;
  - `release`.

## Phase 5: Tracer bullet, Button

- [ ] **5.1 Button through the whole loop.** Mac. Run `build-component Button` from Penpot to a released `@mylder/perron@0.2.0`, and switch Mylder's own buttons to it. Log every place where the loop stalled or an agent guessed.
- [ ] **5.2 Retro.** Any. Fix the skills, checks and templates the log points at, before the next component starts. **Done** when every log entry is fixed, or written down as a known gap in the contract.
- [ ] **5.3 Perron MCP, components.** Any.
  - Add `list_components`, `get_component` (spec, props, code map) and `get_design` (read-back and exports) to the server.
  - Generate a `.md` prop contract per component for the docs site and `llms.txt`.

## Phase 6: Components, in waves

Rebuild the components extracted from the Mylder prototype, each through the loop. Use the old code only as a reference for behaviour and for how Mylder uses it. Each wave ends with a release that Mylder adopts.

- [ ] **Wave 1, actions and primitives:** IconButton, LinkButton, Text, VisuallyHidden, Surface, Section, Kbd, Tag, Count, EmptyState.
- [ ] **Wave 2, Mylder's vocabulary:** Prik, PrikLabel, PrikLegend, LineBadge, StationIcon, Delay, SeverityLabel, Stat, FactList, NormalService, Attribution, Brand.
- [ ] **Wave 3, interactive, on Base UI:**
  - SegmentedControl (ToggleGroup);
  - Tabs;
  - FilterChip and HighlightChip (Toggle);
  - SearchField (Field, Autocomplete);
  - Dialog;
  - Sheet (Drawer);
  - Meter;
  - MapTooltip (Tooltip);
  - Toolbar;
  - MapControls.

## Phase 7: Patterns

Patterns are built only from Perron components, take Mylder's domain props (a departure, a line), and ship from `@mylder/perron/patterns` with their own Storybook section. They go through the same loop, designs in Penpot first.

- [ ] **7.1 Pattern contract.** Any. Add a pattern section to the contract and the template: domain props are allowed, Base UI and new tokens are not, and a value a pattern needs goes through the `design-tokens` skill.
- [ ] **7.2 Patterns:** DepartureRow, DetailHeader, DetailPanel, DisruptionCard, DataStatePanel, StopTimeline, ReportStrip, VehicleTable, DayProfileChart, ScaleBar, KioskBar.

## Phase 8: Perron for other agents

- [ ] **8.1 Consumer skill.** Any.
  - Generate a `perron-ui` skill from the registry and the tokens, with `references/components.md` and `references/tokens.md`.
  - Add `npx @mylder/perron init`, which installs the skill and the MCP entry into a project.

  **Done** when a fresh Vite app, after `init`, gets a correct Perron screen from one prompt.

- [ ] **8.2 DESIGN.md.** Any. Generate a `DESIGN.md` for the brand from the tokens and foundation pages, in the token front-matter DESIGN.md format, for design agents working outside the repo.
- [ ] **8.3 Evals.** Any. A small `evals/` set of agent prompts with checks, such as "build a departures list with Perron", run before each release. A change to a skill or the MCP then shows up as a better or worse score.

## Phase 9: Website

- [ ] **9.1 Next.js site.** Any. A workspace `website/` that reads the same `docs/`, registry and generated data as Storybook. Its sections: Foundations, Components, Patterns, Get started, Skills, Release log. Storybook stays as the workbench.
- [ ] **9.2 HTTP MCP.** Any. The site serves the Perron MCP's tools over Streamable HTTP, at `/api/mcp`, sharing its tool code with the stdio package, so agents with no npm can use it.

## Not on the roadmap

Left out on purpose, so it isn't suggested again:

- brand presets and a theme gallery;
- a shadcn registry;
- AI chat components and a site chatbot;
- a single large `design.md`. Perron keeps one short page per foundation and one spec per component or pattern.
