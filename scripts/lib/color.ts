const channel = (v: number) => {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** WCAG relative luminance of a `#RRGGBB` colour, 0 (black) to 1 (white). */
export function relativeLuminance(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) throw new Error(`Expected #RRGGBB, got ${hex}`)
  const n = parseInt(m[1], 16)
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  )
}

/** WCAG contrast ratio between two `#RRGGBB` colours, 1 to 21. */
export function contrastRatio(a: string, b: string) {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * Text colour for a label on a coloured fill. This is the prototype's rule (dark text above 0.4
 * luminance), kept so badges match it. It is not a contrast check: several official line
 * colours fall below 4.5:1 with either label colour.
 */
export const isLightFill = (hex: string) => relativeLuminance(hex) > 0.4
