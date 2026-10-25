// The component-css rule: the CSS of components, patterns and shared parts reads tokens only, as
// the contract's "CSS" section says (docs/components/README.md). The token families of each layer,
// the media queries and the forced-colours system colours come from the contract's tables.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss, { type AtRule, type Declaration, type Node, type Rule } from 'postcss'
import { PACKAGE } from '../lib/paths.ts'
import { readSources } from '../lib/token-sources.ts'
import { cssVarName, loadTokens } from '../lib/tokens.ts'
import {
  byFileLine,
  codeSpans,
  CONTRACT,
  excuse,
  section,
  tableRows,
  walk,
  type Check,
  type Problem,
} from './lib.ts'

export type CssLayer = 'component' | 'pattern' | 'part'

const RULE = 'component-css'

/** The one `--perron-*` property a component sets, and reads back. */
const ICON_SIZE = '--perron-icon-size'

/** The query a loop stops in, and the one system colours are allowed in. */
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'
const FORCED_COLORS = '(forced-colors: active)'

/** What the contract lets CSS read and query. */
export interface CssRules {
  /** Per layer, the tokens it reads: `color.text.*` is a family, `z-index.dialog` one token */
  families: Record<CssLayer, string[]>
  /** The media queries CSS may use */
  media: string[]
  /** The CSS system colours allowed inside `(forced-colors: active)`, lowercased */
  forcedColours: Set<string>
}

/** The rules of the contract's "Token families" and "Media queries" tables. */
export function readCssRules(contract: string): CssRules {
  const layers = tableRows(section(contract, 'Token families'))
  const reads = (label: RegExp) => {
    const row = layers.find(([layer]) => label.test(layer))
    if (!row) throw new Error(`${CONTRACT}, "Token families", has no row ${label.source}`)
    return codeSpans(row[1])
  }
  const component = reads(/^Component/)
  const queries = tableRows(section(contract, 'Media queries'))
  const media = queries.map(([query]) => codeSpans(query)[0])
  for (const needed of [REDUCED_MOTION, FORCED_COLORS])
    if (!media.includes(needed)) throw new Error(`${CONTRACT}, "Media queries", has no ${needed}`)
  const forced = queries.find(([query]) => query.includes(FORCED_COLORS))!
  return {
    families: { component, part: component, pattern: [...component, ...reads(/^Pattern/)] },
    media,
    forcedColours: new Set(codeSpans(forced[1]).map((c) => c.toLowerCase())),
  }
}

/** Whether `token` is one `family` names: `color.text.*`, or a token and its own members. */
const inFamily = (token: string, family: string) => {
  const name = family.replace(/\.\*$/, '')
  return token === name || token.startsWith(`${name}.`)
}

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

/** The names `packages/perron/tokens/` defines in the repo at `root`, read through the token build. */
export function definedTokens(root: string): DefinedTokens {
  const tokens = loadTokens(readSources(root))
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

/** What a run checks CSS against: the tokens and the contract's rules. */
export interface CssContext {
  tokens: DefinedTokens
  rules: CssRules
}

/** The context of the repo at `root`. */
export function cssContext(root: string): CssContext {
  const contract = readFileSync(join(root, CONTRACT), 'utf8')
  return { tokens: definedTokens(root), rules: readCssRules(contract) }
}

let cached: CssContext | undefined
const repo = () => (cached ??= cssContext(join(dirname(fileURLToPath(import.meta.url)), '../..')))

const media = (params: string) =>
  params
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\(\s*/g, '(')
    .replace(/\s*\)/g, ')')
    .replace(/\s*:\s*/g, ': ')
    .trim()

/**
 * A declaration that decides what a word longer than its line does: it breaks (`overflow-wrap` or
 * `word-break`), or the text stays on one line (`white-space: nowrap`, a choice its spec names).
 */
const LONG_WORD =
  /^(overflow-wrap|word-wrap):\s*(anywhere|break-word)|^word-break:\s*(break-all|break-word)|^white-space:\s*(nowrap|pre)\b/i

/** The first `pn-` class of a selector, and its root's: `pn-Button-label` has `pn-Button`. */
const pnClass = (sel: string) => {
  const m = /\.(pn-[A-Za-z0-9]+)(-[A-Za-z0-9]+)?/.exec(sel)
  return m ? { own: `${m[1]}${m[2] ?? ''}`, root: m[1] } : undefined
}

/** A selector with its whitespace collapsed, so two spellings of one selector compare equal. */
const selector = (text: string) => text.replace(/\s+/g, ' ').trim()

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
  { tokens, rules }: CssContext = repo(),
): Problem[] {
  const problems: Problem[] = []
  const report = (node: Node, message: string) =>
    problems.push({ file, line: node.source?.start?.line, message })
  const families = rules.families[layer]
  const root = postcss.parse(css, { from: file })
  // the selectors whose animation a reduced-motion block sets, so their loops stop
  const stopped = new Set<string>()
  root.walkAtRules('media', (rule) => {
    const query = media(rule.params)
    if (!rules.media.includes(query))
      report(
        rule,
        `@media ${rule.params} is not one of the queries components use: ${rules.media.join(', ')}`,
      )
    if (query === REDUCED_MOTION)
      rule.walkDecls(/^animation(-name|-iteration-count)?$/i, (d) => {
        if (d.parent?.type === 'rule') stopped.add(selector((d.parent as Rule).selector))
      })
  })
  // the plain classes whose rule decides long words, for the parts that inherit it (CSS, "Long words")
  const decided = new Set<string>()
  const decides = (rule: Rule) =>
    rule.nodes.some((n) => n.type === 'decl' && LONG_WORD.test(`${n.prop}: ${n.value}`))
  root.walkRules((rule: Rule) => {
    if (decides(rule))
      for (const sel of rule.selectors)
        if (/^\.pn-[A-Za-z0-9-]+$/.test(sel.trim())) decided.add(sel.trim().slice(1))
  })
  root.walkRules((rule: Rule) => {
    const typeset = rule.nodes.find(
      (n): n is Declaration =>
        n.type === 'decl' &&
        n.prop.toLowerCase() === 'font' &&
        vars(n.value).some((v) => tokens.typography.has(v.name)),
    )
    if (typeset && !decides(rule))
      for (const sel of rule.selectors) {
        const cls = pnClass(sel)
        if (cls && !decided.has(cls.own) && !decided.has(cls.root))
          report(
            typeset,
            `${selector(sel)} sets a typography role but not what a long word does: overflow-wrap: anywhere to break it, or white-space: nowrap to keep it on one line, on this rule or on .${cls.own === cls.root ? cls.own : `${cls.own} or .${cls.root}`} (${CONTRACT}, "CSS")`,
          )
      }
  })
  root.walkRules((rule: Rule) => {
    if (/data-theme/.test(rule.selector))
      report(rule, `${rule.selector} selects a data-theme; the semantic tokens carry both themes`)
    const decls = rule.nodes.filter((n): n is Declaration => n.type === 'decl')
    if (/\[data-disabled\]|:disabled/.test(rule.selector))
      for (const d of decls.filter((s) => s.prop.toLowerCase() === 'opacity'))
        report(d, 'disabled is a colour, color.text.tertiary, never an opacity')
    for (const d of decls.filter((s) => s.prop.toLowerCase() === 'font'))
      for (const v of vars(d.value).filter((r) => tokens.typography.has(r.name))) {
        const twin = `var(${v.name}-tracking)`
        if (!decls.some((s) => s.prop === 'letter-spacing' && s.value.includes(twin)))
          report(d, `${v.name} comes with letter-spacing: ${twin}`)
      }
  })
  root.walkDecls((d) => {
    const prop = d.prop.toLowerCase()
    const value = d.value
    if (d.prop.startsWith('--perron-')) {
      if (d.prop !== ICON_SIZE)
        report(
          d,
          `sets ${d.prop}; component CSS never redefines a token, and sets only ${ICON_SIZE}`,
        )
      else if (!/^var\(--perron-icon-size-[\w-]+\)$/.test(value.trim()))
        report(d, `${ICON_SIZE} takes an icon.size.* token, as var(--perron-icon-size-…)`)
    }
    for (const v of vars(value)) {
      if (v.fallback) report(d, `var(${v.name}) has a fallback; read the token alone`)
      if (!v.name.startsWith('--perron-') || v.name === ICON_SIZE) continue
      const token = tokens.names.get(v.name)
      if (!token) report(d, `${v.name} is not a token in ${PACKAGE}/tokens/`)
      else if (!families.some((f) => inFamily(token, f)))
        report(
          d,
          `${v.name}: ${token} is outside the families ${layer} CSS reads (${CONTRACT}, "Token families")`,
        )
    }
    const bare = literals(value)
    for (const m of bare.matchAll(/#[\w-]+/g)) report(d, `raw colour ${m[0]}; read a color token`)
    for (const m of bare.matchAll(COLOUR_FUNCTIONS))
      report(d, `raw colour ${m[0]}…); read a color token`)
    for (const m of bare.matchAll(NUMBER)) {
      const unit = m[3]?.toLowerCase()
      if (!unit || Number(m[1]) === 0) continue
      // `1lh` is the height of one line of the element's own typography token, a relation such as
      // `100%` is, so an icon can centre on a first line: calc((1lh - var(--perron-icon-size)) / 2).
      if (unit === 'lh' && Number(m[1]) === 1) continue
      if (LENGTH_UNITS.has(unit)) report(d, `raw length ${m[0]}; read a space, size or other token`)
      else if (DURATION_UNITS.has(unit)) report(d, `raw duration ${m[0]}; read a duration token`)
    }
    if (prop === 'font-family' || prop === 'font') {
      const raw = [
        ...value.matchAll(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g),
        ...literals(value).matchAll(IDENT),
      ].filter((m) => !FONT_KEYWORDS.has(m[0].toLowerCase()) && m[0].toLowerCase() !== 'var')
      if (raw.length)
        report(d, `raw font ${raw.map((m) => m[0]).join(', ')}; read a typography or font token`)
    } else if (!NAME_PROPERTIES.test(prop)) {
      for (const m of bare.matchAll(IDENT)) {
        const word = m[0].toLowerCase()
        if (NAMED_COLOURS.has(word)) report(d, `raw colour ${m[0]}; read a color token`)
        else if (
          SYSTEM_COLOURS.has(word) &&
          !(rules.forcedColours.has(word) && inMedia(d, FORCED_COLORS))
        )
          report(
            d,
            `system colour ${m[0]}: only ${[...rules.forcedColours].join(', ')}, inside @media ${FORCED_COLORS}`,
          )
      }
    }
    if (/^animation(-iteration-count)?$/.test(prop) && /\binfinite\b/i.test(value)) {
      const owner = d.parent?.type === 'rule' ? selector((d.parent as Rule).selector) : ''
      if (!inMedia(d, REDUCED_MOTION) && !stopped.has(owner))
        report(
          d,
          `an infinite animation stops inside @media ${REDUCED_MOTION}, in a rule for ${owner || 'its selector'} that sets its animation`,
        )
    }
  })
  return excuse(problems.sort(byFileLine), RULE, () => css)
}

const LAYER_DIRS: [string, CssLayer][] = [
  [`${PACKAGE}/src/components`, 'component'],
  [`${PACKAGE}/src/patterns`, 'pattern'],
  [`${PACKAGE}/src/parts`, 'part'],
]

export default {
  rule: RULE,
  run(root) {
    const context = cssContext(root)
    return LAYER_DIRS.flatMap(([dir, layer]) =>
      walk(root, dir, (n) => n.endsWith('.css')).flatMap((file) =>
        cssProblems(file, readFileSync(join(root, file), 'utf8'), layer, context),
      ),
    ).sort(byFileLine)
  },
} satisfies Check
