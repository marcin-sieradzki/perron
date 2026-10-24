# ADR Format

ADRs live in `docs/adr/`. A decision a foundation page already explains in its prose stays there; an ADR is for the why that has no page to live on and use sequential numbering: `0001-slug.md`, `0002-slug.md`, etc.

Create the `docs/adr/` directory lazily: only when the first ADR is needed.

## Template

```md
# {Short title of the decision}

{1-3 sentences: what's the context, what did we decide, and why.}
```

That's it. An ADR can be a single paragraph. The value is in recording _that_ a decision was made and _why_, not in filling out sections.

## Optional sections

Only include these when they add genuine value. Most ADRs won't need them.

- **Status** frontmatter (`proposed | accepted | deprecated | superseded by ADR-NNNN`): useful when decisions are revisited
- **Considered Options**: only when the rejected alternatives are worth remembering
- **Consequences**: only when non-obvious downstream effects need to be called out

## Numbering

Scan `docs/adr/` for the highest existing number and increment by one.

## When to offer an ADR

All three of these must be true:

1. **Hard to reverse**: the cost of changing your mind later is meaningful
2. **Surprising without context**: a future reader will look at the tokens or docs and wonder "why on earth did they do it this way?"
3. **The result of a real trade-off**: there were genuine alternatives and you picked one for specific reasons

If a decision is easy to reverse, skip it: you'll just reverse it. If it's not surprising, nobody will wonder why. If there was no real alternative, there's nothing to record beyond "we did the obvious thing."

### What qualifies

- **The shape of the tokens.** "Only colour tokens read the palette." "Base, then a theme, then a motion context, combined by the resolver."
- **How Perron meets Mylder.** "Mylder loads one file, `@mylder/perron/perron.css`, and reads tokens only through `--perron-*` properties."
- **Formats and tools that carry lock-in.** The token format, the build, the design tool. Not every dependency: just the ones that would take a quarter to swap out.
- **Boundary and scope decisions.** "One brand only, no brand modifier." "Components wait on their own branch until the foundations settle." The explicit no-s are as valuable as the yes-s.
- **Deliberate deviations from the obvious path.** "A custom token build instead of Style Dictionary because X." Anything where a reasonable reader would assume the opposite. These stop the next person from "fixing" something that was deliberate.
- **Constraints not visible in the sources.** "Line colours are the operators' own, even where they miss contrast." "Every vehicle shows how fresh its data is."
- **Rejected alternatives when the rejection is non-obvious.** If you considered a second sample brand and kept one for subtle reasons, record it; otherwise someone will suggest it again in six months.
