// ScaleBar's arithmetic, in its own folder: the round distance the scale shows and its bar's share
// of the longest length (CR-3). Not exported from the package: the barrel reads ScaleBar.tsx only.
// Spec: docs/patterns/scale-bar.md.

/** The round steps a distance takes, each times a power of ten, longest first. */
const STEPS = [5, 3, 2, 1] as const

/** The distance a scale shows and how long its bar is drawn. */
export interface Scale {
  /** The round distance in metres: 1, 2, 3 or 5 times a power of ten, never under 1 m */
  meters: number
  /** The bar's length as a share of its longest length, from 0.5 to 1 */
  share: number
}

/** Whether `value` is a positive finite number, the only kind that gives a distance (CR-7). */
export const measurable = (value: number) => Number.isFinite(value) && value > 0

/**
 * The scale for a map at `metersPerPixel` and a bar at most `longestPixels` long (CR-3): the
 * largest of 1, 2, 3 and 5 times a power of ten no longer than the longest distance, their
 * product, and never under 1 m; and that distance's share of the longest, held to the bar's
 * longest length. Undefined when either number is not positive and finite, so the scale says
 * "Unknown" (CR-7).
 */
export function scaleFor(metersPerPixel: number, longestPixels: number): Scale | undefined {
  if (!measurable(metersPerPixel) || !measurable(longestPixels)) return undefined
  const longest = metersPerPixel * longestPixels
  if (!measurable(longest)) return undefined
  let power = 10 ** Math.floor(Math.log10(longest))
  // Math.log10 may fall a hair under a whole power, as 2.9999… for 1000
  if (power * 10 <= longest) power *= 10
  const step = STEPS.find((s) => s * power <= longest) ?? 1
  const meters = Math.max(1, step * power)
  return { meters, share: Math.min(1, meters / longest) }
}

/** What a scale's label reads for `meters`: the figure and which unit follows it (CR-6). */
export function figureOf(meters: number): { figure: string; unit: 'meters' | 'kilometers' } {
  return meters < 1000
    ? { figure: String(meters), unit: 'meters' }
    : { figure: String(Math.round(meters / 1000)), unit: 'kilometers' }
}
