const channel = (v: number) => {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** The linear red, green and blue of a `#RRGGBB` colour, 0 to 1 each. */
function linear(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) throw new Error(`Expected #RRGGBB, got ${hex}`)
  const n = parseInt(m[1], 16)
  return [16, 8, 0].map((shift) => channel((n >> shift) & 255))
}

/** WCAG relative luminance of a `#RRGGBB` colour, 0 (black) to 1 (white). */
export function relativeLuminance(hex: string) {
  const [r, g, b] = linear(hex)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
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

/** The opaque `#RRGGBB` a CSS colour (`#RRGGBB` or `rgba(r, g, b, a)`) shows over an opaque background. */
export function composite(color: string, background: string) {
  const rgba = /^rgba\((\d+), (\d+), (\d+), ([\d.]+)\)$/.exec(color)
  if (!rgba) return color
  const bg = parseInt(background.slice(1), 16)
  const alpha = Number(rgba[4])
  return `#${[16, 8, 0]
    .map((shift, i) => {
      const mixed = alpha * Number(rgba[i + 1]) + (1 - alpha) * ((bg >> shift) & 255)
      return Math.round(mixed).toString(16).padStart(2, '0')
    })
    .join('')
    .toUpperCase()}`
}

/** A `#RRGGBB` colour in OKLab, where equal distances look about equally different. */
function oklab(hex: string) {
  const [r, g, b] = linear(hex)
  const [l, m, s] = [
    0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b,
    0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b,
    0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b,
  ].map(Math.cbrt)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

/**
 * How different two `#RRGGBB` colours look: their distance in OKLab, 0 for the same colour. The
 * eye just tells apart about 0.02.
 */
export function colourDistance(a: string, b: string) {
  const [p, q] = [oklab(a), oklab(b)]
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])
}
