// What the contract's "Pointer feedback" reads as a state's paint and as its hover query, shared by
// the pointer-feedback check (scripts/checks/pointer-feedback.ts) and the stories' pressedAfterHover
// (stories.ts), so the two read one rule alike. Not shipped: the build leaves src/testing out.

/** The properties that paint a state: a fill, a layer over it, an edge, the ink, a shadow. */
export const PAINTS = [
  'background',
  'background-color',
  'background-image',
  'border',
  'border-color',
  'color',
  'box-shadow',
  'outline-color',
] as const

/**
 * Whether a media query, with its spacing collapsed, holds `feature` and doesn't negate it:
 * `not all and (hover: hover)` and `(not (hover: hover))` hold on the devices `(hover: hover)`
 * leaves out.
 */
export const holds = (query: string, feature: string) => {
  const q = query.toLowerCase()
  return (
    q.includes(feature) &&
    !/(^|,)\s*not\s/.test(q) &&
    !q.includes(`not ${feature}`) &&
    !q.includes(`not${feature}`)
  )
}
