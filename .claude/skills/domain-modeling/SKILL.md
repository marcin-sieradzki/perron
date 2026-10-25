---
name: domain-modeling
description: Build and sharpen Perron's domain model. Use when discussing the design system's terminology, writing or editing docs/glossary.md, or recording or editing an ADR.
---

# Domain Modeling

Actively build and sharpen Perron's domain model as you design. This is the _active_ discipline: challenging terms, inventing edge-case scenarios, and writing the glossary and decisions down the moment they crystallise. (Merely _reading_ `docs/glossary.md` for vocabulary is not this skill: that's a one-line habit any skill can do. This skill is for when you're changing the model, not just consuming it.)

## Where things live

Perron is one context: the design system's foundations. Mylder, the app, is its own repository with its own model.

```
/
├── CLAUDE.md
├── packages/perron/tokens/     ← the values, each with a $description
└── docs/
    ├── glossary.md             ← the terms
    ├── adr/                    ← decisions and why
    │   └── 0001-slug.md
    ├── content-design.md       ← the words Mylder shows its riders
    ├── renames.md              ← token names that changed
    └── foundations/            ← one page of rules per foundation
```

Each meaning has one home. The glossary defines a term; a foundation page gives the rules for using it; a token's `$description` says where that value is used; `docs/content-design.md` decides the words a rider reads on screen. A glossary entry points at the page that owns the rules instead of repeating them.

Create files lazily: only when you have something to write. If `docs/glossary.md` doesn't exist, create it when the first term is resolved. If `docs/adr/` doesn't exist, create it when the first ADR is needed.

## During the session

### Challenge against the glossary

When the user uses a term that conflicts with the existing language in `docs/glossary.md`, call it out immediately. "Your glossary defines 'stale' as X, but you seem to mean Y. Which is it?"

### Sharpen fuzzy language

When the user uses vague or overloaded terms, propose a precise canonical term. "You're saying 'state': do you mean a vehicle dot data state or a component's hover state? Those are different things."

### Discuss concrete scenarios

When relationships between concepts are being discussed, stress-test them with specific scenarios: a vehicle whose data is an hour old, a line colour that fails contrast in the dark theme, a token one theme needs and the other doesn't. Invent scenarios that probe edge cases and force the user to be precise about the boundaries between concepts.

### Cross-reference with the sources

When the user states how something works, check whether `packages/perron/tokens/`, `docs/foundations/`, `packages/perron/icons/icons.json` and `packages/perron/logos/logos.json` agree. If you find a contradiction, surface it: "The data-states page lists five vehicle dot states, but you just described four. Which is right?"

### Update docs/glossary.md inline

When a term is resolved, update `docs/glossary.md` right there. Don't batch these up: capture them as they happen. Use the format in [GLOSSARY-FORMAT.md](./GLOSSARY-FORMAT.md).

`docs/glossary.md` holds definitions and nothing else: no token values, no usage rules, no implementation decisions. Those belong on the foundation page, in the token, or in an ADR. When a resolved term renames something that is also a token name, change the token through the `design-tokens` skill so the name in the sources matches the glossary.

### Offer ADRs sparingly

Only offer to create an ADR when all three are true:

1. **Hard to reverse**: the cost of changing your mind later is meaningful
2. **Surprising without context**: a future reader will wonder "why did they do it this way?"
3. **The result of a real trade-off**: there were genuine alternatives and you picked one for specific reasons

If any of the three is missing, skip the ADR. Use the format in [ADR-FORMAT.md](./ADR-FORMAT.md).
