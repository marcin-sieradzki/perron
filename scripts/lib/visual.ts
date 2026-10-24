// The visual stage's comparison, browser-free: what each part of a rendered story should measure,
// from the read-back's layer sizes and bound tokens, whether what Chromium measured matches, the
// pixel difference against Penpot's export, and the report. scripts/visual.ts does the browsing.
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import type { CodeMap, Layer } from '../checks/penpot.ts'
import type { Theme } from './design.ts'

/** How far a part's size may be from its layer's, in px. */
export const TOLERANCE = 1

const SIDES = ['top', 'right', 'bottom', 'left']

/**
 * The CSS longhands each Penpot token property lands on (penpot/README.md, "What the plugin API can
 * do"). A text layer's fill is its `color`; any other layer's is its background.
 */
function cssOf(property: string, layer: Layer): string[] | undefined {
  if (property === 'fill') return [layer.type === 'text' ? 'color' : 'background-color']
  if (property === 'strokeColor') return SIDES.map((s) => `border-${s}-color`)
  if (property === 'strokeWidth') return SIDES.map((s) => `border-${s}-width`)
  if (property === 'rowGap') return ['row-gap']
  if (property === 'columnGap') return ['column-gap']
  const padding = /^padding(Top|Right|Bottom|Left)$/.exec(property)
  if (padding) return [`padding-${padding[1].toLowerCase()}`]
  const radius = /^borderRadius(Top|Bottom)(Left|Right)$/.exec(property)
  if (radius) return [`border-${radius[1].toLowerCase()}-${radius[2].toLowerCase()}-radius`]
  return undefined
}

/** One thing to measure on one part. */
export interface Expectation {
  /** The part name, from the code map */
  part: string
  selector: string
  /** `width`, `height`, or the Penpot token property */
  check: string
  /** The bound token, for a token check */
  token?: string
  /** A length or colour in CSS */
  expected: string
  /** The computed-style longhands that must all equal `expected`, or `width`/`height` for size */
  properties: string[]
}

/**
 * What each visible layer under `root` should measure once rendered: its size, and each bound
 * token's value in the theme, on the part's class (`pn-<Name>` for the root, `pn-<Name>-<part>`
 * for the rest). `tokenValue` gives a token's CSS value in that theme. Token properties with no
 * CSS twin here are left out.
 */
export function expectations(
  name: string,
  root: Layer,
  map: CodeMap,
  tokenValue: (token: string) => string | undefined,
): Expectation[] {
  const out: Expectation[] = []
  const visit = (layer: Layer) => {
    if (layer.hidden) return
    const part = map.layers[layer.name] ?? layer.name
    const selector = part === 'root' ? `.pn-${name}` : `.pn-${name}-${part}`
    for (const dim of ['width', 'height'] as const)
      out.push({ part, selector, check: dim, expected: `${layer.size[dim]}px`, properties: [dim] })
    for (const [check, token] of Object.entries(layer.tokens)) {
      const properties = cssOf(check, layer)
      if (properties)
        out.push({ part, selector, check, token, expected: tokenValue(token) ?? '?', properties })
    }
    layer.children?.forEach(visit)
  }
  visit(root)
  return out
}

/** What the browser measured: each selector's box and computed styles; a missing one wasn't rendered. */
export type Measured = Record<
  string,
  { width: number; height: number; styles: Record<string, string> } | undefined
>

/** One row of the report. */
export interface Row {
  part: string
  check: string
  expected: string
  measured: string
  pass: boolean
}

/** A colour as [r, g, b, a], or nothing when `value` is not one. */
function colour(value: string): number[] | undefined {
  const hex = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(value.trim())
  if (hex) {
    const n = parseInt(hex[1], 16)
    const a = hex[2] ? parseInt(hex[2], 16) / 255 : 1
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a]
  }
  const fn = /^rgba?\(([^)]+)\)$/.exec(value.trim())
  if (!fn) return undefined
  const parts = fn[1]
    .split(/[\s,/]+/)
    .filter(Boolean)
    .map(Number)
  if (parts.length < 3 || parts.some(Number.isNaN)) return undefined
  return [parts[0], parts[1], parts[2], parts[3] ?? 1]
}

/** Whether a token's CSS value equals a computed style: colours by channel, lengths by px. */
export function sameCss(expected: string, measured: string) {
  const [a, b] = [colour(expected), colour(measured)]
  if (a && b)
    return a.slice(0, 3).every((c, i) => Math.abs(c - b[i]) < 0.5) && Math.abs(a[3] - b[3]) <= 0.01
  const px = (v: string) => (/^-?[\d.]+px$/.test(v.trim()) ? parseFloat(v) : undefined)
  const [x, y] = [px(expected), px(measured)]
  if (x !== undefined && y !== undefined) return Math.abs(x - y) < 0.01
  return expected.trim() === measured.trim()
}

/** Each expectation against what was measured: sizes within `TOLERANCE`, tokens on their value. */
export function compare(list: Expectation[], measured: Measured): Row[] {
  return list.map((e) => {
    const check = e.token ? `${e.check} (${e.token})` : e.check
    const row = { part: e.part, check, expected: e.expected }
    const box = measured[e.selector]
    if (!box) return { ...row, measured: 'not rendered', pass: false }
    if (e.check === 'width' || e.check === 'height') {
      const size = box[e.check]
      return {
        ...row,
        measured: `${Math.round(size * 100) / 100}px`,
        pass: Math.abs(size - parseFloat(e.expected)) <= TOLERANCE,
      }
    }
    const values = e.properties.map((p) => box.styles[p] ?? '')
    return {
      ...row,
      measured: [...new Set(values)].join(' / '),
      pass: values.every((v) => sameCss(e.expected, v)),
    }
  })
}

const PSEUDO = new Set(['hover', 'focus', 'focus-visible', 'focus-within', 'active'])

/**
 * The pseudo-classes to force on the root for a variant: those its state property maps to in the
 * code map, such as `:hover`. An attribute state, such as `[data-disabled]`, is the story's to set.
 */
export function forcedStates(map: CodeMap, props: Record<string, string>) {
  return Object.entries(props).flatMap(([property, value]) => {
    const entry = map.properties[property]
    const selector = entry && 'state' in entry ? entry.state[value] : null
    return (selector?.match(/:([\w-]+)/g) ?? []).map((s) => s.slice(1)).filter((s) => PSEUDO.has(s))
  })
}

/**
 * The share of pixels that differ between Penpot's export and the story's screenshot, in percent
 * to two places, and the diff image. Both are padded to the larger size first.
 */
export function pixelDiff(expected: Buffer, actual: Buffer) {
  const [a, b] = [PNG.sync.read(expected), PNG.sync.read(actual)]
  const width = Math.max(a.width, b.width)
  const height = Math.max(a.height, b.height)
  const pad = (img: PNG) => {
    const out = new PNG({ width, height })
    PNG.bitblt(img, out, 0, 0, img.width, img.height, 0, 0)
    return out
  }
  const diff = new PNG({ width, height })
  const changed = pixelmatch(pad(a).data, pad(b).data, diff.data, width, height, { threshold: 0.1 })
  return {
    percent: Math.round((changed / (width * height)) * 10000) / 100,
    diff: PNG.sync.write(diff),
  }
}

/** One story in one theme. */
export interface Run {
  variant: string
  theme: Theme
  story: string
  pass: boolean
  rows: Row[]
  pixelDiff?: number
  /** The diff image, by path from the report */
  diffImage?: string
  /** Why the story could not be measured */
  error?: string
}

/** `components/<name>/visual/report.json`. */
export interface Report {
  component: string
  generatedAt: string
  storybook: string
  /** Every part of every variant, in both themes, within 1 px and on its tokens */
  pass: boolean
  /** Variants whose light export no longer matches the read-back's hash */
  stale: string[]
  runs: Run[]
}

/** `report.md`: a summary, then a table per variant and theme. */
export function renderReport(r: Report) {
  const failed = r.runs.filter((x) => !x.pass).length
  const lines = [
    `# Visual report: ${r.component}`,
    '',
    `${r.pass ? 'Passes' : `Fails in ${failed} of ${r.runs.length} stories`}: every part within ${TOLERANCE} px of its Penpot layer and on its tokens, in light and dark. Stories from ${r.storybook}, at ${r.generatedAt}. The pixel difference is reported, not gated.`,
    '',
  ]
  for (const v of r.stale)
    lines.push(
      `- The light export of ${v} does not match the read-back: export it again with the design.`,
      '',
    )
  for (const run of r.runs) {
    lines.push(`### ${run.variant}, ${run.theme}: ${run.pass ? 'passes' : 'fails'}`, '')
    lines.push(`Story \`${run.story}\`.`, '')
    if (run.error) lines.push(`Not measured: ${run.error}`, '')
    if (run.pixelDiff !== undefined)
      lines.push(`Pixel difference: ${run.pixelDiff}% ([diff](${run.diffImage}))`, '')
    if (run.rows.length) {
      lines.push('| Part | Check | Expected | Measured | Pass |', '| --- | --- | --- | --- | --- |')
      for (const row of run.rows)
        lines.push(
          `| \`${row.part}\` | ${row.check} | ${row.expected} | ${row.measured} | ${row.pass ? 'yes' : '**no**'} |`,
        )
      lines.push('')
    }
  }
  return lines.join('\n')
}
