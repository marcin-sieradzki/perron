---
name: component-brief
description: 'Turn an approved Penpot design, or with the design deferred the contract and the prototype, into its spec, every template section filled, with the questions the sources leave open put to the maintainer.'
disable-model-invocation: true
argument-hint: '<Name>'
---

The brief stage of the component loop ([ROADMAP](../../../ROADMAP.md), "Phase 4: The agent loop"). It runs after the maintainer has approved the design, and turns the read-back into the spec the build and the review work from: `docs/components/<name>.md`, or `docs/patterns/<name>.md` for a pattern, copied from the [spec template](../../../docs/components/TEMPLATE.md). `<Name>` is the skill's argument, in PascalCase; `<name>` is the same in kebab-case.

The design is fixed by now: this skill reads Penpot's files and writes only the spec.

## With the design deferred

When `components/<name>/pipeline.yaml` says `deferred` ([ADR 0010](../../../docs/adr/0010-unattended-runs-with-design-deferred.md)), there is no read-back, code map or export, and the spec decides what the drawing would have: the variant properties and their values, the parts and their layer names, the design states, and the token for every part in every state. Its sources are the contract, the foundations, `list_tokens`, the Base UI reference, the specs of the entries in `dependsOn`, and the ROADMAP line that names the component. The extracted prototype components are not in any branch this machine can reach, so the spec rests on these alone. Each choice these leave open is a `[PENDING]` question like any other. Step 3 checks the spec against itself: every Stories row a combination of the Props values, every Tokens row a part and design state from Anatomy and the contract. A component already drawn and then deferred keeps its read-back as one more source, never the authority.

## Facts and decisions

Every cell of the spec is a fact or a decision.

- A **fact** comes from a source: the read-back, the code map, the contract, the Base UI reference, the tokens, the locale files. Finding facts is your job, to the end: when `get_reference` leaves one out, such as a key's behaviour, read the `base-ui` MCP (the hosted docs, which describe the latest release) and confirm it in the installed package under `node_modules/@base-ui/react/`.
- A **decision** is one the sources leave open: a default the contract doesn't set, a Base UI prop to expose or keep, an owned string's English, a value no token gives. It goes in place as `[PENDING] <the question> Recommended: <your answer>.`, worded so that "yes" accepts the recommendation. Its row or line stays in the spec, so the answer lands where it belongs.

## Steps

1. **Pre-flight.** Read, before the first write:
   - `penpot/<name>.json`, the read-back, and `penpot/<name>.code-map.json`, and look at every `penpot/<name>/<Variant>.light.png`;
   - the entry for `<Name>` in `packages/perron/components.json`: its layer, `baseUiParts` and `dependsOn`;
   - the [contract](../../../docs/components/README.md), whole, and the [spec template](../../../docs/components/TEMPLATE.md);
   - the [brand](../../../docs/foundations/README.md), [content design](../../../docs/content-design.md), [Accessibility](../../../docs/foundations/accessibility.md), and `packages/perron/src/locale/en.ts` for the keys that exist;
   - for a component, the Perron MCP's `get_reference` (`library: 'base-ui'`) for the component and for each of its parts, `Select` and then `Select.Positioner`; for a pattern, the specs of the Perron components it composes;
   - the Perron MCP's `list_tokens` for each token the read-back binds, for its description and both themes' values;
   - the spec itself, if an earlier run wrote it.

   Done when every layer name in the read-back has its part from the code map, every part of a component has its Base UI part or a reason it has none, and you hold the reference of every Base UI part you name.

2. **Write the spec.** Copy the template to the spec's path, or open the existing spec, and fill every section in the template's order, by the template's own instructions and these sources:

   | Section           | From                                                                                                                                                                                                                                                                                                                                                                                                                                            |
   | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | Anatomy           | The read-back's layers, through the code map's `layers`; the family and shared parts from the contract's tables; the Base UI part from the reference                                                                                                                                                                                                                                                                                            |
   | Base UI parts     | The reference: the element each part renders, the props Perron sets, the props passed through. "Base UI already does" lists the behaviour the reference promises                                                                                                                                                                                                                                                                                |
   | Props             | The code map's props and values (with the defaults the contract's Props table sets), the contract's shared props, the reference's props each one maps to, a `<key>Label` per owned string, a `slotProps.<part>` per part other than root, and a row reading `inherited` under Base UI prop for each prop the root's Base UI part gives beyond the HTML element's (`render`, `nativeButton`), with the reference's type, default and description |
   | Tokens            | Each layer's bound tokens in the read-back, per variant and state, the `State` value turned into its design state through the code map. Penpot's `fill` is `background`, or `color` on a text layer; `strokeColor` and `strokeWidth` are the border; the padding, radius and gap properties are their CSS twins                                                                                                                                 |
   | Keyboard and ARIA | The reference for each part; the contract's checklist, each line with how this component meets it                                                                                                                                                                                                                                                                                                                                               |
   | Owned strings     | Every word the design shows or the component announces that the caller doesn't give, reusing a key `en.ts` has                                                                                                                                                                                                                                                                                                                                  |
   | Component rules   | Behaviour Base UI already handles that the build must keep, a rule the design holds (such as states that keep their geometry), and each answer that binds the build                                                                                                                                                                                                                                                                             |
   | Stories           | One row per variant in the read-back, named by its variant name ([penpot/README.md](../../../penpot/README.md), "Conventions")                                                                                                                                                                                                                                                                                                                  |
   | Do and don't      | The contract, the family's treatment and the reference's own cautions                                                                                                                                                                                                                                                                                                                                                                           |

   Done when every section holds rows or a line saying why it doesn't apply, and no template placeholder or example row is left.

3. **Cross-check against the design.** Done when each of these holds: every layer name has an Anatomy row; every code map prop has a Props row, and so does every prop the root's Base UI part adds to the HTML element's; every variant has a Stories row; every token the read-back binds appears in Tokens; every `State` value is a design state the Tokens table covers; and every prop name in Props, and every name a `[PENDING]` question recommends, is one the contract's [Names from other libraries](../../../docs/components/README.md#names-from-other-libraries) table leaves free, its own column naming what to use in place of a banned one (`state` is CSS states, `as` is `render`). An unattended run takes each recommendation as the answer, so a banned name recommended reaches the build. The factory refuses a Props row with a banned name. A design state the component's Base UI parts produce but the design doesn't show is a `[PENDING]` question for the maintainer.

4. **Finish.** Run `npx prettier --write` on the spec, then `npm run gates -- paths`: the spec is a doc, so every repo path it names exists. Done when the gate passes, `grep '^## '` gives the same headings, in the same order, for the template and the spec, and every Markdown link in the spec goes to a page the docs site serves, by the template's rule on links.

5. **Put the questions.** Collect every `[PENDING]` in the spec, numbered, with its section. Done when the list is returned (see [Returns](#returns)), or, run by hand, when none is left.

## Returns

The run ends with one outcome and a short summary.

- **`done`**: the spec's path. The spec has every section and no `[PENDING]`.
- **`pending`**: the questions, numbered, each with its section and recommended answer. The `factory` skill puts them to the maintainer, writes each answer in place of its `[PENDING]` line, and runs this skill again.
- **`failed`**: what stopped it, such as a missing read-back, with the last error.

## Run again, or by hand

A run that finds the spec already written keeps every filled section and works from the answers in it: each one is carried into every section it touches (a token answer into Tokens, a prop answer into Props and Component rules), and steps 3 to 5 run again.

Run by the maintainer by hand, step 5 puts the questions with the `grilling` skill, in rounds, each with its recommended answer. Write each answer in place of its `[PENDING]` line, carry it through as above, and ask the next round until none is left.
