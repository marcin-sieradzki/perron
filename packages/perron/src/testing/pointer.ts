// What the contract's "Pointer feedback" reads as a state's paint and as its hover query, shared by
// the pointer-feedback check (scripts/checks/pointer-feedback.ts) and the stories' pressedAfterHover
// (stories.ts), so the two read one rule alike. Not shipped: the build leaves src/testing out.

/**
 * Whether a property paints a state: a fill, a layer over it, an edge or one side of it, an outline,
 * the ink, an underline's ink, an icon's fill or a shadow.
 */
export const isPaint = (prop: string) =>
  /^(background(-color|-image)?|border(-(block|inline|top|right|bottom|left)(-(start|end))?)?(-color)?|outline(-color)?|color|text-decoration-color|fill|stroke|box-shadow)$/i.test(
    prop,
  )

/**
 * Whether a media query, with its spacing collapsed, holds `feature` and doesn't negate it:
 * `not all and (hover: hover)` and `(not (hover: hover))` hold on the devices `(hover: hover)`
 * leaves out.
 */
export const holds = (query: string, feature: string) =>
  query
    .toLowerCase()
    .split(',')
    .some(
      (entry) =>
        // `(hover)` is the boolean form of `(hover: hover)`
        (entry.includes(feature) || entry.includes(feature.replace(/:.*\)/, ')'))) &&
        !/^\s*not\s/.test(entry) &&
        !entry.includes(`not ${feature}`) &&
        !entry.includes(`not${feature}`),
    )
