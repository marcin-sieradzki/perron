# Themes and modes

The token files combine through the resolver, `tokens/perron.resolver.json`: base always, then one context of each modifier. Perron has two modifiers. `theme` picks a set of colours; `motion` overrides a few base tokens when the system asks for less motion.

## Light and dark

- Light is the default. Dark comes from `data-theme="dark"` on any element or, without an explicit theme, from the system's dark mode. `data-theme="light"` keeps an element light inside a dark page, so one page can show both themes side by side.
- Both themes define the same colour names, and the build fails when one is missing.
- Dark colours are their own palette steps, chosen for the dark surfaces: 300 for status and brand fills and text, 900 for tints, the light neutrals for text. Shadows are set per theme too.
- Base tokens never point at a theme token. A custom property resolves where it is declared, so a base token built from a theme colour would keep the root theme's value inside a nested `data-theme`.

## Reduced motion

The `motion` modifier has two contexts. `full`, the default, is empty: base already holds the full-motion values. `reduced` points at `tokens/motion-reduced.tokens.json`, which overrides the transition durations.

| Output               | How reduced motion shows                                                   |
| -------------------- | -------------------------------------------------------------------------- |
| `tokens.css`         | The overrides inside `@media (prefers-reduced-motion: reduce)`, on `:root` |
| `tokens.ts`          | `modifiers.motion.reduced`, as CSS text and as numbers                     |
| `penpot.tokens.json` | A `motion-reduced` set, and a Motion group with Full and Reduced themes    |

What the values are, and which tokens they leave alone, is on [Motion](motion.md).

## Adding a mode

A new mode, such as more contrast, is one more modifier:

1. Add a modifier to the resolver with an empty default context, and a context that points at a new token file.
2. In that file, override only base tokens, each with its base token's type. The build fails on anything else.
3. Map the context to its media query in `MODIFIER_MEDIA`, in `scripts/lib/tokens.ts`.
4. Run `npm run tokens`. The CSS, TypeScript, Penpot file and the tables on these pages pick it up.
