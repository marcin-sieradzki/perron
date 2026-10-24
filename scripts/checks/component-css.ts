// The component-css rule: the CSS of components, patterns and shared parts reads tokens only, as
// the contract's "CSS" section says (docs/components/README.md).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import postcss, { type AtRule, type Declaration, type Node, type Rule } from 'postcss'
import { readSources } from '../build-tokens.ts'
import { PACKAGE } from '../lib/paths.ts'
import { cssVarName, loadTokens } from '../lib/tokens.ts'
import { excuse, walk, type Check, type Problem } from './lib.ts'

export type CssLayer = 'component' | 'pattern' | 'part'

const RULE = 'component-css'

const COMPONENT_FAMILIES = [
  'color.text',
  'color.surface',
  'color.border',
  'color.status',
  'color.scrim',
  'typography',
  'font',
  'space',
  'size',
  'radius',
  'border.width',
  'focus',
  'icon.size',
  'shadow',
  'effect',
  'duration',
  'easing',
  'z-index',
]
const PATTERN_FAMILIES = [
  ...COMPONENT_FAMILIES,
  'color.map',
  'map',
  'color.transit',
  'color.data-state',
  'color.chart',
  'opacity',
  'prik',
]

/** The one `--perron-*` property a component sets, and reads back. */
const ICON_SIZE = '--perron-icon-size'

const MEDIA = ['(hover: hover)', '(prefers-reduced-motion: reduce)', '(forced-colors: active)']
const FORCED_COLOURS = new Set(
  ['Canvas', 'CanvasText', 'Highlight', 'HighlightText', 'ButtonText', 'GrayText'].map((c) =>
    c.toLowerCase(),
  ),
)
const SYSTEM_COLOURS = new Set(
  `Canvas CanvasText LinkText VisitedText ActiveText ButtonFace ButtonText ButtonBorder Field
  FieldText Highlight HighlightText SelectedItem SelectedItemText Mark MarkText GrayText AccentColor
  AccentColorText ActiveBorder ActiveCaption AppWorkspace Background ButtonHighlight ButtonShadow
  CaptionText InactiveBorder InactiveCaption InactiveCaptionText InfoBackground InfoText Menu
  MenuText Scrollbar ThreeDDarkShadow ThreeDFace ThreeDHighlight ThreeDLightShadow ThreeDShadow
  Window WindowFrame WindowText`
    .toLowerCase()
    .split(/\s+/),
)
const NAMED_COLOURS = new Set(
  `aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet
  brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue
  darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange
  darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise
  darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen
  fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred
  indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan
  lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen
  lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta
  maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue
  mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin
  navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen
  paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple
  red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue
  slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet
  wheat white whitesmoke yellow yellowgreen`.split(/\s+/),
)
const COLOUR_FUNCTIONS =
  /(?<![\w-])(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark|device-cmyk)\(/gi
const LENGTH_UNITS = new Set(
  `px em rem ex rex ch rch cap rcap ic ric lh rlh vw vh vi vb vmin vmax svw svh svi svb svmin svmax
  lvw lvh lvi lvb lvmin lvmax dvw dvh dvi dvb dvmin dvmax cqw cqh cqi cqb cqmin cqmax cm mm q in pt
  pc`.split(/\s+/),
)
const DURATION_UNITS = new Set(['s', 'ms'])
const FONT_KEYWORDS = new Set(
  `inherit initial unset revert revert-layer normal italic oblique bold bolder lighter small-caps`.split(
    ' ',
  ),
)
/** Properties whose identifiers are names, not colours: `animation-name: tomato` is no colour. */
const NAME_PROPERTIES =
  /^(animation(-name)?|transition(-property)?|will-change|grid(-area|-template(-areas)?|-row|-column)?(-start|-end)?|container(-name)?|counter-(reset|increment|set)|view-transition-name|font-family|font)$/i

/** What component CSS can read: each `--perron-*` name a token defines, with its token. */
export interface DefinedTokens {
  /** CSS name to token name; a typography role's `-tracking` twin maps to the role */
  names: Map<string, string>
  /** Typography roles, by CSS name */
  typography: Set<string>
}

/** The names `packages/perron/tokens/` defines, read through the token build. */
export function definedTokens(): DefinedTokens {
  const tokens = loadTokens(readSources())
  const all = [...tokens.base, ...Object.values(tokens.themes).flat()]
  const names = new Map<string, string>()
  const typography = new Set<string>()
  for (const t of all) {
    names.set(cssVarName(t.name), t.name)
    if (t.type === 'typography') {
      names.set(`${cssVarName(t.name)}-tracking`, t.name)
      typography.add(cssVarName(t.name))
    }
  }
  return { names, typography }
}

let cached: DefinedTokens | undefined
const defaults = () => (cached ??= definedTokens())

const media = (params: string) =>
  params
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\(\s*/g, '(')
    .replace(/\s*\)/g, ')')
    .replace(/\s*:\s*/g, ': ')
    .trim()

const inMedia = (node: Node, query: string) => {
  for (let p = node.parent; p; p = p.parent)
    if (p.type === 'atrule' && (p as AtRule).name.toLowerCase() === 'media')
      if (media((p as AtRule).params).includes(query)) return true
  return false
}

/** Each `var()` in a value: its name and whether it has a fallback. */
function vars(value: string) {
  const out: { name: string; fallback: boolean }[] = []
  for (const m of value.matchAll(/var\(/gi)) {
    let depth = 1
    let comma = false
    let i = m.index + m[0].length
    for (; i < value.length && depth; i++) {
      if (value[i] === '(') depth++
      else if (value[i] === ')') depth--
      else if (value[i] === ',' && depth === 1) comma = true
    }
    const name = value
      .slice(m.index + m[0].length, i)
      .split(/[,)]/)[0]
      .trim()
    out.push({ name, fallback: comma })
  }
  return out
}

/** A value without its strings, `url()`s and `var()` names, so only its literals are left. */
const literals = (value: string) =>
  value
    .replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g, ' ')
    .replace(/url\([^)]*\)/gi, ' ')
    .replace(/--[\w-]+/g, ' ')

const NUMBER = /(?<![\w.-])[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?(%|[a-z]+)?/gi
const IDENT = /(?<![\w#.-])-?[a-z_][\w-]*(?![\w(-])/gi

/**
 * The problems of one CSS file, against the contract: tokens only, no fallback, the media
 * queries and families its layer may use. `file` names the file in each problem.
 */
export function cssProblems(
  file: string,
  css: string,
  layer: CssLayer,
  tokens: DefinedTokens = defaults(),
): Problem[] {
  const problems: Problem[] = []
  const at = (node: Node, message: string) =>
    problems.push({ file, line: node.source?.start?.line, message })
  const families = layer === 'pattern' ? PATTERN_FAMILIES : COMPONENT_FAMILIES
  const root = postcss.parse(css, { from: file })
  let stopsMotion = false
  root.walkAtRules('media', (rule) => {
    const query = media(rule.params)
    if (!MEDIA.includes(query))
      at(
        rule,
        `@media ${rule.params} is not one of the queries components use: ${MEDIA.join(', ')}`,
      )
    if (query === MEDIA[1]) stopsMotion ||= (rule.nodes?.length ?? 0) > 0
  })
  root.walkRules((rule: Rule) => {
    if (/data-theme/.test(rule.selector))
      at(rule, `${rule.selector} selects a data-theme; the semantic tokens carry both themes`)
    const decls = rule.nodes.filter((n): n is Declaration => n.type === 'decl')
    if (/\[data-disabled\]|:disabled/.test(rule.selector))
      for (const d of decls.filter((s) => s.prop.toLowerCase() === 'opacity'))
        at(d, 'disabled is a colour, color.text.tertiary, never an opacity')
    for (const d of decls.filter((s) => s.prop.toLowerCase() === 'font'))
      for (const v of vars(d.value).filter((r) => tokens.typography.has(r.name))) {
        const twin = `var(${v.name}-tracking)`
        if (!decls.some((s) => s.prop === 'letter-spacing' && s.value.includes(twin)))
          at(d, `${v.name} comes with letter-spacing: ${twin}`)
      }
  })
  root.walkDecls((d) => {
    const prop = d.prop.toLowerCase()
    const value = d.value
    if (d.prop.startsWith('--perron-')) {
      if (d.prop !== ICON_SIZE)
        at(d, `sets ${d.prop}; component CSS never redefines a token, and sets only ${ICON_SIZE}`)
      else if (!/^var\(--perron-icon-size-[\w-]+\)$/.test(value.trim()))
        at(d, `${ICON_SIZE} takes an icon.size.* token, as var(--perron-icon-size-…)`)
    }
    for (const v of vars(value)) {
      if (v.fallback) at(d, `var(${v.name}) has a fallback; read the token alone`)
      if (!v.name.startsWith('--perron-') || v.name === ICON_SIZE) continue
      const token = tokens.names.get(v.name)
      if (!token) at(d, `${v.name} is not a token in ${PACKAGE}/tokens/`)
      else if (!families.some((f) => token === f || token.startsWith(`${f}.`)))
        at(d, `${v.name}: ${token} is outside the families ${layer} CSS reads`)
      else if (layer !== 'pattern' && token.startsWith('z-index.') && token !== 'z-index.dialog')
        at(
          d,
          `${v.name}: a component takes z-index.dialog; the other z-index tokens are for patterns`,
        )
    }
    const bare = literals(value)
    for (const m of bare.matchAll(/#[\w-]+/g)) at(d, `raw colour ${m[0]}; read a color token`)
    for (const m of bare.matchAll(COLOUR_FUNCTIONS))
      at(d, `raw colour ${m[0]}…); read a color token`)
    for (const m of bare.matchAll(NUMBER)) {
      const unit = m[3]?.toLowerCase()
      if (!unit || Number(m[1]) === 0) continue
      if (LENGTH_UNITS.has(unit)) at(d, `raw length ${m[0]}; read a space, size or other token`)
      else if (DURATION_UNITS.has(unit)) at(d, `raw duration ${m[0]}; read a duration token`)
    }
    if (prop === 'font-family' || prop === 'font') {
      const raw = [
        ...value.matchAll(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g),
        ...literals(value).matchAll(IDENT),
      ].filter((m) => !FONT_KEYWORDS.has(m[0].toLowerCase()) && m[0].toLowerCase() !== 'var')
      if (raw.length)
        at(d, `raw font ${raw.map((m) => m[0]).join(', ')}; read a typography or font token`)
    } else if (!NAME_PROPERTIES.test(prop)) {
      for (const m of bare.matchAll(IDENT)) {
        const word = m[0].toLowerCase()
        if (NAMED_COLOURS.has(word)) at(d, `raw colour ${m[0]}; read a color token`)
        else if (SYSTEM_COLOURS.has(word) && !(FORCED_COLOURS.has(word) && inMedia(d, MEDIA[2])))
          at(
            d,
            `system colour ${m[0]}: only ${[...FORCED_COLOURS].join(', ')}, inside @media ${MEDIA[2]}`,
          )
      }
    }
    if (/^animation(-iteration-count)?$/.test(prop) && /\binfinite\b/i.test(value))
      if (!inMedia(d, MEDIA[1]) && !stopsMotion)
        at(d, `an infinite animation stops inside @media ${MEDIA[1]}`)
  })
  problems.sort((a, b) => (a.line ?? 0) - (b.line ?? 0))
  return excuse(problems, RULE, () => css)
}

const LAYERS: [string, CssLayer][] = [
  [`${PACKAGE}/src/components`, 'component'],
  [`${PACKAGE}/src/patterns`, 'pattern'],
  [`${PACKAGE}/src/parts`, 'part'],
]

export default {
  rule: RULE,
  run(root) {
    return LAYERS.flatMap(([dir, layer]) =>
      walk(root, dir, (n) => n.endsWith('.css')).flatMap((file) =>
        cssProblems(file, readFileSync(join(root, file), 'utf8'), layer),
      ),
    )
  },
} satisfies Check
