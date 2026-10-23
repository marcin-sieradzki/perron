# Motion

Motion explains a change of place. The sheet slides, the camera eases to a selection, and meters ease to new values. Vehicles glide between reports instead of jumping.

## Durations

- **Transitions** move something from one place or value to another, once: `duration.sheet`, `duration.meter`, `duration.camera` and `duration.follow`.
- **Loops** repeat while something is true. A new report pulses once around its vehicle (`duration.report-pulse`), a ring pulses around the selected vehicle (`duration.selection-pulse`), and the follow indicator blinks while the camera follows (`duration.blink`).

<!-- tokens: duration.* -->

| Token                      | Value    | Reduced motion | Use                                                   |
| -------------------------- | -------- | -------------- | ----------------------------------------------------- |
| `duration.sheet`           | `320ms`  | `0.01ms`       | Bottom sheet open and close                           |
| `duration.meter`           | `800ms`  | `0.01ms`       | Meter fill change                                     |
| `duration.camera`          | `750ms`  | `0.01ms`       | Map camera fly-to                                     |
| `duration.follow`          | `500ms`  | `0.01ms`       | Camera fly-to when following starts                   |
| `duration.blink`           | `1400ms` |                | Recording dot blink while following                   |
| `duration.report-pulse`    | `1100ms` |                | Ring that expands when a vehicle reports its position |
| `duration.selection-pulse` | `1600ms` |                | Ring around the selected vehicle                      |

<!-- /tokens -->

## Easing

The sheet has its own curve, which settles slowly so a long slide doesn't stop abruptly. Everything else eases with `easing.standard`, the browser's `ease`.

<!-- tokens: easing.* -->

| Token             | Value                              | Use               |
| ----------------- | ---------------------------------- | ----------------- |
| `easing.sheet`    | `cubic-bezier(0.2, 0.8, 0.2, 1)`   | Bottom sheet      |
| `easing.standard` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | CSS ease (meters) |

<!-- /tokens -->

## Reduced motion

When the system asks for less motion, the transition tokens take 0.01 ms: their values under `prefers-reduced-motion: reduce` are in the table's Reduced motion column. The value is 0.01 ms rather than 0, so `transitionend` and animation events still fire. CSS that reads the tokens needs nothing more.

- **Loops** keep their durations in the tokens, because a loop at 0.01 ms would flicker. Each component that runs a loop stops it under reduced motion.
- Vehicles move to each new report without gliding.

The values come from the resolver's `motion` modifier. Its default context, `full`, is empty, because base already holds the full-motion values; its `reduced` context points at `tokens/motion-reduced.tokens.json`. The build writes the overrides into each output:

| Output               | Reduced motion                                                             |
| -------------------- | -------------------------------------------------------------------------- |
| `tokens.css`         | The overrides inside `@media (prefers-reduced-motion: reduce)`, on `:root` |
| `tokens.ts`          | `modifiers.motion.reduced`, as CSS text and as numbers                     |
| `penpot.tokens.json` | A `motion-reduced` set, and a Motion group with Full and Reduced themes    |

## Timings in script

Script that animates, such as the map camera's fly-to, reads `numeric` from `tokens.ts`, and `modifiers.motion.reduced.numeric` when `matchMedia('(prefers-reduced-motion: reduce)')` matches. Both hold durations in milliseconds.
