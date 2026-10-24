# GLOSSARY.md Format

## Structure

```md
# Glossary

{One or two sentence description of what this context is and why it exists.}

## Language

**Prik**:
{A one or two sentence description of the term}
_Avoid_: Dot, marker

**Data state**:
How fresh a vehicle's position is, shown by the shape of its Prik. Rules on [Data states](foundations/data-states.md).
_Avoid_: Status, freshness

**Theme pair**:
A colour token with the same name in the light and the dark theme.
_Avoid_: Mode token
```

## Rules

- **Be opinionated.** When multiple words exist for the same concept, pick the best one and list the others under `_Avoid_`.
- **Keep definitions tight.** One or two sentences max. Define what it IS, not what it does. Link the foundation page that holds its rules rather than restating them.
- **Only include terms specific to this project's context.** General design-system concepts (spacing scale, breakpoint, component) don't belong even if Perron uses them extensively. Before adding a term, ask: is this a concept unique to Perron or Mylder, or a general design concept? Only the former belongs.
- **Group terms under subheadings** when natural clusters emerge. If all terms belong to a single cohesive area, a flat list is fine.

## Where it lives

Perron is one context, so it has one glossary: `docs/glossary.md`. Create it lazily, when the first term is resolved. Its title is `# Glossary`, and its opening sentence says it holds the words used to talk about Perron, and that the words Mylder shows its riders are in `content-design.md`.
