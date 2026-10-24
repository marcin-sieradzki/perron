# Roadmap

How Perron grows from foundations into Mylder's full design system. It has three layers: foundations, components on [Base UI](https://base-ui.com) with APIs shaped like [MUI](https://mui.com/material-ui/)'s, and patterns built from those components for Mylder's own screens. Each component and pattern is designed in Penpot before it is built, by a small loop of agents that a local software factory drives, with the maintainer holding two gates. It keeps what Perron already has: DTCG tokens as the source, one brand, and Mylder's colours and voice.

The decisions behind the plan are in [docs/adr/](docs/adr/), and the words it uses are in [docs/glossary.md](docs/glossary.md).

## How to follow it

Work the phases in order. Steps inside a phase can run in parallel unless one names another. Each step says what to make, how, where it runs, and when it is **done**. Tick its box in the PR that finishes it.

- **Local** steps run in a Claude Code session on the maintainer's machine, directly or through Remote Control. That is where the Penpot MCP is. The "Perron Design System" file must be open in Chrome and connected (File → MCP Server → Connect), with the tab kept active. The whole component loop runs here by default.
- **Any** steps run locally or in a cloud session on the repo. The cloud is the fallback when the maintainer's machine is offline. base-ui.com and mui.com are on the cloud environment's allowed domains, so the hosted docs work there too.
- **Maintainer** steps need a person: an account, a setting or an approval.

Write every agent-facing file a step creates (a skill, an agent, `CLAUDE.md`, a spec template) with the `writing-for-agents` skill. Every step ends with `npm run check` passing.

## Phase 1: Repo and release rails

- [x] **1.1 Workspace.** Any. Move to npm workspaces: `packages/perron`, published as `@mylder/perron` (tokens, styles, icons, logos and their build), and an empty `packages/mcp`, published as `@mylder/perron-mcp`. Storybook, the docs and the repo skills stay at the root. Move the folders with `git mv`, keep the `exports` paths the same under the new package, and update the paths in `scripts/`, the tests, `.storybook/` and `CLAUDE.md`. **Done** when `npm run check` and `npm run storybook:build` pass, and `npm pack -w @mylder/perron --dry-run` lists `tokens.css`, `perron.css` and the icons.
- [x] **1.2 npm org.** Maintainer. Create the free npm organisation `mylder`, and add the repository as a trusted publisher for both packages. **Done** when both names show as yours on npmjs.com.
- [x] **1.3 Releases.** Any, after 1.1 and 1.2.
  - Add Changesets (`@changesets/cli`) for versions and changelogs.
  - Add a `release.yml` workflow that publishes from CI with npm trusted publishing and `--provenance`.
  - Before publishing, `scripts/smoke-consumer.ts` packs the tarball and installs it in a scratch Vite app that imports `perron.css` and `tokens.ts`.

  **Done** when `@mylder/perron@0.1.0` (foundations only) is on npm and Mylder can install it.

- [x] **1.4 Docs site.** Any. Deploy Storybook to GitHub Pages from CI. From the same sources, the build also writes:
  - `llms.txt`, one line per page;
  - a `.md` twin of every page;
  - a consumer `AGENTS.md`: install, rules, where to look.

  **Done** when the site is live and `llms.txt` lists every page in `PAGES`.

- [x] **1.5 Perron MCP, foundations and references.** Any. A stdio MCP server in `packages/mcp`, run with `npx @mylder/perron-mcp`. It reads only generated data shipped in `@mylder/perron`, plus, in the repo, the docs bundled in the installed libraries. First tools:
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
  - **State and events:** MUI's names, with Base UI's details passed through.
    - `value`, `defaultValue` and `onChange(event, value, details)`, where `details` carries Base UI's reason and `cancel()`. A component that renders a native `<input>` or `<textarea>` passes the native `onChange(event)` itself, so React Hook Form's `register()` and Formik work unchanged.
    - `open`, `defaultOpen`, `onOpen(event)` and `onClose(event, reason)`.
    - Each component adapts Base UI's `onValueChange` and `onOpenChange` to these names once, inside the component.
    - Composite controls such as Select, Checkbox and Slider carry a `name`, so Base UI's hidden input reaches a native form and `FormData`; form libraries connect to them through their controller.
  - **Customising:**
    - Base UI's `render` prop swaps the element.
    - `slotProps`, keyed by Base UI part, is the only way inside.
    - There is no `sx`, `classes`, `component`, `styled` or theme object.
  - **Styling:**
    - a stable class (`pn-Button`, `pn-Button-icon`);
    - `data-variant`, `data-color` and `data-size`, plus Base UI's own `data-*` states;
    - plain CSS that reads them and uses only `--perron-*` tokens;
    - tokens stay on `:root`, because popups render in a portal.
  - **Root:** `ref` and the rest props reach the root element, with `{...rest}` written before the component's own attributes so they win. A prop that is invalid on the rendered element is dropped, never spread. Every prop has JSDoc.
  - **Change:** deprecate, never remove. An old prop keeps working, marked `@deprecated` with its replacement named.
  - **Design states are CSS states.** Hover, focus, pressed and disabled come from pseudo-classes and Base UI's `data-*`, never from a `state` prop.
  - **Shared parts, drawn once:** a list of the parts every component reuses (the checkbox indicator, the selected mark, the close button, visually hidden text), each drawn in one place. A component composes them and never draws its own.
  - **What axe won't catch:** a checklist written into every component from the start.
    - Everything the eye is told, the ear is told: an `aria-hidden` mark has a text equivalent, for every shape the prop accepts.
    - Every landmark and named region has an accessible name, from the component's own heading through `aria-labelledby` where it has one.
    - Every default label can be overridden.
    - A shape the type accepts is never silently dropped by one rendering.
    - A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`.
    - Native semantics first, and no ARIA added for its own sake.
  - **CSS:** tokens only. Icons are sized through `icon.size.*`, motion through `duration.*` and `easing.*`, and stacking through `z-index.*`. No dark-theme overrides, since the semantic tokens carry both themes. A family of components (rows, fields, popups) shares one fill, border, radius, hover and selected treatment, written in the contract.
  - **Stories:** `satisfies Meta<typeof Name>` with `component` set, one story per variant and state the Penpot design shows, named as in Penpot, and a `play` test for every behaviour the component promises (dismissal, focus, keyboard), ending in the resting state.
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
  - **Shared parts:** no second drawing of a part on the 2.2 list.
  - **Docs:** every registered component has its docs page (4.4).
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

- [ ] **3.1 Smoke test.** Local. On a scratch page of the library file, check with `execute_code` that the plugin API on today's Penpot can:
  1. bind a colour, a padding and a radius token to a shape, and read them back from `shape.tokens`;
  2. build a variant container with `penpotUtils.createVariantContainer`;
  3. export a board as PNG bytes (base64) and as SVG;
  4. switch the active token theme and switch it back.

  Recent Penpot releases fixed bugs in exactly these. Write what works, and the workarounds, to `penpot/README.md`. **Done** when each of the four has a yes, or a no with a workaround.

- [ ] **3.2 Helpers and conventions.** Local, after 3.1. Write `penpot/helpers.js`, loaded into the MCP's `storage` at the start of every Penpot session:
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
  - every token name exists in `packages/perron/tokens/`;
  - the code map covers every variant value and named layer;
  - no layer has an unbound fill, stroke, radius, padding or gap.

  **Done** when a fixture with an unbound fill fails.

## Phase 4: The agent loop

After the design step, three agent contexts run in sequence, rather than as an agent team. The maintainer holds two gates, approving the design in Penpot and merging the component's PR, and code checks everything between them. Every skill starts with a **pre-flight**: the files it must read before it may write, named so that no agent can skip them.

| Stage  | Runs                        | Reads                                                                 | Writes                                                           | Gate                                                             |
| ------ | --------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| Design | Local                       | The contract, the foundations, tokens through the MCP                 | The Penpot page, `penpot/<name>.json`, the code map, the exports | 3.3 checks; **the maintainer approves the design in Penpot**     |
| Brief  | Local                       | The read-back, `get_reference` for the Base UI parts, the contract    | `docs/components/<name>.md`, with `[PENDING]` questions          | Template complete; every `[PENDING]` question answered           |
| Build  | Any                         | The approved spec, the read-back and the reference component          | Component, CSS, stories (one per variant, named as in Penpot)    | `npm run check` and story tests; 3 attempts, then stop           |
| Review | Any, fresh-context subagent | The spec, the diff and the gate output, never the builder's reasoning | `review.md`, with P1, P2 and P3 findings                         | No P1; 2 rounds, then `needs-human`                              |
| Docs   | Any                         | The spec, the stories, the props API                                  | The component's docs page                                        | The docs check of 2.5                                            |
| Visual | Any, with the local exports | Storybook and the read-back                                           | A geometry and colour report, and pixel-diff images              | Parts within 1 px and on their tokens; the report goes on the PR |

- [ ] **4.1 `component-design` skill.** Local. Draws a component or pattern in Penpot from the contract with the 3.2 helpers, checks it, exports PNGs in light and dark, and writes the read-back and the code map. Penpot's own prompting guides apply: read before writing, make small reversible changes, and never assume a missing value.
- [ ] **4.2 `component-brief` skill.** Local. Turns the read-back into the spec:
  - the anatomy, mapped to Base UI parts;
  - the props table in MUI's layout: name, type, default, and the Base UI prop it maps to;
  - the tokens per part and state;
  - the keyboard and ARIA contract, from the Base UI reference;
  - the component rules, such as `CR-1`: Base UI's Select already handles typeahead, so don't rebuild it.

  A question the sources can't answer goes in as `[PENDING]` and is put to the maintainer: as a comment on the component's issue once 5.4 is in, and with the `grilling` skill before that.

- [ ] **4.3 `component-build` skill.** Any. Steps:
  1. **Pre-flight:** the contract, the spec, the read-back, and the reference component. That is Button once 5.1 has built it: its `.tsx`, `.css` and stories show the contract applied.
  2. **Write** the three files to the contract, and register the component in `components.json`.
  3. **Self-gate**, looped until clean before the reviewer sees anything:
     - a design-quality pass on every story in both themes, fixing every Defect and Polish finding;
     - the accessibility tree of the rendered stories listed (each landmark and control with its name and state, and any text inside `aria-hidden` or `inert`) and checked against the 2.2 checklist;
     - `api-consistency` scoped to the component's family.
  4. **Gates:** `npm run check` and the story tests. Three attempts at a red gate, then it stops and says what is failing.
- [ ] **4.4 `component-docs` skill.** Any. Runs after Review passes, so the page shows the final API. It writes the component's Storybook docs page:
  - the spec's prose;
  - the stories as live examples;
  - an autodocs props table in MUI's layout (name, type, default, description), with slots after it.

  Button's page is the reference. In phase 9 the same skill writes the website page.

- [ ] **4.5 `component-reviewer` agent.** Any. `.claude/agents/component-reviewer.md`, with read-only tools plus the test commands. Its rubric covers:
  - a design-quality pass on the rendered stories in both themes (alignment, spacing, contrast, states that don't move geometry), with findings sorted into Defect, Polish or Direction;
  - the 2.2 checklist of what axe won't catch, plus focus order, reduced motion and target size;
  - API consistency with sibling components;
  - misuse of Base UI: rebuilt behaviour, a lost `render` or ref;
  - the owned strings and docs, against `docs/content-design.md`.
- [ ] **4.6 `factory` orchestrator skill.** Local. `/factory <Name>` runs one component through the loop:
  - It owns `components/<name>/pipeline.yaml` (stage, approvals, attempts, open P1s, and the scorecard of 5.5) and is the only one that writes it.
  - It starts each stage (design, brief, build, review, docs, visual) in order, and refuses one whose input is missing or unapproved.
  - It drives the component through every stage it can, and stops only at a gate, a `[PENDING]` question or a cap.
  - Each stage runs in a fresh context, as a resumable Claude Code workflow, so an interrupted run picks up where it stopped.

  5.4 connects it to GitHub Issues.

  **Done**, for the whole phase, when a dry run on a made-up component reaches each gate and stops there.

- [ ] **4.7 Library audits.** Any. Skills that run across the whole library:
  - `design-qa`, the design-quality pass of 4.3 and 4.5 on its own, for any component or screen;
  - `api-consistency`;
  - `component-consistency-audit`, which finds a shared part drawn twice, or a family member with a surface of its own;
  - `accessibility-audit`;
  - `content-audit`;
  - `drift-audit`, which checks that docs and skills still match the repo by running what they say;
  - `release`.

## Phase 5: Tracer bullet, Button

- [ ] **5.1 Button through the whole loop.** Local. Run `/factory Button` from Penpot to a released `@mylder/perron@0.2.0`, and switch Mylder's own buttons to it. Log every place where the loop stalled or an agent guessed, and keep every stage's transcript: the log and the transcripts are what 5.2 checks the scorers against.
- [ ] **5.2 Retro.** Local, where the transcripts are. Fix the skills, checks and templates the log points at, before the next component starts, running the `retro` skill on each stage's transcript to find where each fix goes. Write the three scorers of 5.5 and run them on Button's transcripts: a scorer that misses a log entry it should catch, or fails a run the log is happy with, gets its rubric rewritten. **Done** when every log entry is fixed, or written down as a known gap in the contract, and the scorers agree with the log.
- [ ] **5.3 Perron MCP, components.** Any.
  - Add `list_components`, `get_component` (spec, props, code map) and `get_design` (read-back and exports) to the server.
  - Generate a `.md` prop contract per component for the docs site and `llms.txt`.
- [ ] **5.4 The factory.** Local, after 5.2. Puts `/factory` behind GitHub Issues, as [ADR 0008](docs/adr/0008-local-component-factory.md) describes, so a component goes from a filed issue to a ready PR with the maintainer acting only at the two gates.
  - **Identity.** At first the factory acts as the maintainer's own `gh` login, and the board shows which component waits at a gate. Its `gh` and `git push` calls all read the token from `GH_TOKEN`, so changing identity later means changing that token only.
  - **Labels.** One per stage (`design`, `brief`, `build`, `review`, `docs`, `visual`), plus `design-approved`, `needs-human`, and `factory:running`, the claim.
  - **Dependencies.** `dependsOn` in `components.json` is the source. A dependency is done when its PR is merged to main.
  - **Decompose run.** Files one issue per registry entry, with its category, Base UI parts, dependencies as "Blocked by #n", and the matching component from the extracted prototype as a behaviour reference. A second run syncs the issues to the registry and files nothing twice.
  - **`/factory` with no name** picks the next issue whose dependencies are all done and which carries no claim. With a name, it takes that one. It claims the issue, drives it as far as it can, posts one summary comment per stage, removes the claim, and stops when:
    - the design is drawn: the PNGs in light and dark go on the issue, the maintainer is mentioned, and the brief starts once `design-approved` is added;
    - a `[PENDING]` question is asked as an issue comment;
    - a cap is hit: `needs-human`, with a comment saying what is failing;
    - the PR is marked ready.
  - **The PR.** The build stage opens one draft PR per component, holding the spec, code, stories, docs page, read-back and visual report. It is marked ready once review and the visual check pass.
  - **Penpot.** When the tab isn't connected, the design run opens the file and presses File → MCP Server → Connect through Claude in Chrome. If that fails, it adds `needs-human` and stops.
  - **Throttle.** One component in flight at first. Raise it once five components in a row pass through without `needs-human`.
  - **More than one in flight.** Raising the throttle brings in two things:
    - **The App.** Maintainer, then Any. The factory gets its own GitHub App, `perron-factory`, installed on this repository only, with write access to contents, issues and pull requests, so its comments notify the maintainer and its PRs can be approved. Its private key lives in the macOS Keychain. `scripts/factory-token.ts` mints a one-hour installation token into `GH_TOKEN`, so the maintainer's own login stays as it is.
    - **Tracing.** Claude Code's runs go to a self-hosted Langfuse on the maintainer's machine through its Claude Code hook, with each run's scorecard attached to its trace as scores.
  - **Retro run.** After every fifth merged component, as 5.5 describes.
  - **Visibility.** A GitHub Project board in this repository's Projects, with one column per stage, which adds every new issue through its built-in workflow.

  **Done** when `/factory` takes a made-up component from a filed issue to a ready PR in a fresh session, stopping at the design gate and resuming from the label alone.

- [ ] **5.5 Scored retros.** Local, built with 5.4, so the first component the factory takes is scored. The factory improves the way a component does, through a PR the maintainer merges ([ADR 0009](docs/adr/0009-factory-improves-through-scored-retros.md)).
  - **Scorecard.** At the end of each stage run, `scripts/factory-score.ts` reads the run's transcript, gate output and review, and the factory writes the result into `pipeline.yaml`:
    - the attempts, and the check that failed on each;
    - the pre-flight: whether each named file was read before the first write;
    - the review findings, by P1, P2 and P3, per round;
    - the `[PENDING]` questions asked;
    - the tool calls, the files read more than twice, the tokens and the minutes;
    - the model, and where the transcript is archived.

    Claude Code deletes transcripts older than `cleanupPeriodDays` (30 by default), and five components can take longer than that, so the factory copies each stage's transcript, with its subagents' transcripts, to an archive on the maintainer's machine, outside the repo. Their format is internal to Claude Code and changes between versions, so the script reads only what it needs and says which fields it could not find.

  - **Scorers.** One rubric file each in `.claude/skills/factory-retro/scorers/`, naming the stages it reads, its levels (pass, fail, insufficient evidence) and an example of each. Every verdict gives a one-sentence reason and the transcript lines behind it. Three to start, written in 5.2:
    - `guess`: the run used a value, token, prop or behaviour its sources don't give, instead of reading it or asking a `[PENDING]` question;
    - `efficiency`: the run lost effort to reworking its own mistakes, reading files again, running calls one by one that could run together, or repeating checks that had passed;
    - `reviewability`: what the maintainer reads (comments, the PR, the spec, code comments and tests) says what changed in as few words as it can.

    Code quality has no scorer: the gates and the reviewer judge it, and the scorecard keeps their findings. No stage skill points at the scorers.

  - **Memory.** Each stage's summary comment ends with a **Learned** line when the run found something a later run will need, such as a Base UI quirk, a Penpot workaround or a token the spec forgot. Nothing else carries a fact from one run to the next: the repo's `.claude/settings.json` sets `autoMemoryEnabled` to `false`, so Claude Code keeps no memory of its own on the maintainer's machine, where a fact would skip review and the cloud fallback could never read it.

  - **Retro run.** When five components have merged since the last retro, `/factory` runs the `factory-retro` skill before it takes the next component. It reads the `retro` skill, which reviews one session, for the categories of fix:
    1. **Pre-flight:** the last retro PR, and the five components' scorecards, issues and PRs.
    2. **Check the last retro.** For each prediction in its PR, did the failure come back? A change that didn't hold is revised or reverted in this PR.
    3. **Score.** Each scorer runs over the whole batch in a fresh context of its own, on a smaller model than the stages use.
    4. **Pick.** A run is worth a look when a scorer failed it, it hit a cap, or it cost a touch. Group those runs by cause. A cause needs two runs, or one touch, before anything changes.
    5. **Fix.** For each cause, find the line that is missing, wrong or unclear, and fix it on the highest rung that prevents the failure:
       1. a check in `npm run check`;
       2. a rule in the contract, or a line in the spec template;
       3. a skill's pre-flight, steps or completion criteria;
       4. a fact, in its one home;
       5. a factory setting: a cap, or a stage's model.

       Rewrite the line with the `writing-for-agents` skill rather than adding a paragraph beside it. The **Learned** lines from the stage summaries go to their homes the same way, and an answer the maintainer gave to the same `[PENDING]` question twice becomes a rule in the contract.

    6. **Replay.** For a change to a stage skill or a stage's model, run that stage again on the frozen inputs of the batch's worst run, from the retro branch, and put both scorecards in the PR.
    7. **Open one PR**, labelled `retro`. For each change, it gives the runs it cites (each with the scorer's reason and a short excerpt, secrets removed), the rung, and a prediction of what the next batch will show. A table follows, comparing this batch with the last: touches per component, build attempts, review rounds, P1s in the first round, escapes (problems the maintainer found that review missed), `needs-human`, each scorer's pass rate, tokens and minutes.

  - **Limits.**
    - The retro never merges, and never opens a second retro PR while one is open. The factory keeps building in the meantime.
    - It may edit the skills, the agents, the contract and template, the checks, `penpot/README.md` and the factory's settings. It files a token gap as an issue for the `design-tokens` skill, and never touches component code, the ADRs or the vendored skills, the ones with a `LICENSE` file.
    - A failure no scorer caught, or a verdict the maintainer disagrees with, changes a scorer in a PR of its own, never beside an instruction change.

  **Done** when a retro on a made-up batch, with one failure planted in two runs, opens a PR that cites both runs, rewrites the line behind them and makes a prediction, and a replay of Button's build stage writes a scorecard.

## Phase 6: Components, in waves

Rebuild the components extracted from the Mylder prototype, each through the factory, in the order their dependencies allow. Use the old code only as a reference for behaviour and for how Mylder uses it. Each wave ends with a release that Mylder adopts.

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

- [ ] **8.2 Blueprints.** Any. Three files that anyone, person or agent, can download and hand to a builder, each shown as a page with a download link in a "Blueprints" section of the docs:
  - **`CLAUDE.md`:** the context for extending Perron. The repo's `CLAUDE.md` with the contract's rules and the steps to add a component, built from those files, never edited by hand.
  - **`DESIGN.md`:** the design spec in one file, generated from the tokens, the foundation pages and the component specs, with the tokens as front matter in the DESIGN.md format.
  - **`content-design.md`:** the voice, as it is.

  They are generated, so they never drift from their sources, and the drift check of 2.4 covers them. **Done** when each downloads from Storybook and matches its sources.

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
