// The component-css rule: the CSS of components, patterns and shared parts reads tokens only, as
// the contract's "CSS" section says (docs/components/README.md). The token families of each layer,
// the media queries and the forced-colours system colours come from the contract's tables.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss, { type Declaration, type Node, type Rule } from 'postcss'
import { PACKAGE } from '../lib/paths.ts'
import { readSources } from '../lib/token-sources.ts'
import { cssVarName, loadTokens } from '../lib/tokens.ts'
import {
  byFileLine,
  codeSpans,
  CONTRACT,
  CSS_LAYERS,
  excuse,
  inMedia,
  media,
  section,
  selector,
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

/** What every rule inside a pattern-only query selects: a pattern's `size='responsive'`. */
const RESPONSIVE = /\[data-size=(['"]?)responsive\1\]/

/** `sel` without what its `:not(…)` hold, so a selector that leaves a size out never reads as selecting it. */
function withoutNot(sel: string) {
  let out = ''
  for (let i = 0; i < sel.length;) {
    if (sel.slice(i, i + 5).toLowerCase() !== ':not(') {
      out += sel[i++]
      continue
    }
    let depth = 1
    for (i += 5; i < sel.length && depth; i++)
      if (sel[i] === '(') depth++
      else if (sel[i] === ')') depth--
  }
  return out
}

/**
 * The query a pattern lays out its phone layout in: `breakpoint.phone` less 0.02 px, so the
 * breakpoint itself is above it, a breakpoint being the width below which the screen changes
 * (docs/foundations/layout.md). A media query can't read the token, so the contract writes it out.
 */
export const phoneQuery = (phonePx: number) =>
  `(max-width: ${Number((phonePx - 0.02).toFixed(2))}px)`

/**
 * The contract's pattern-only queries that aren't `breakpoint.phone`'s, each at its line of
 * `contract`: a token changed without its query would leave a pattern switching at the old width.
 */
export function patternMediaProblems(contract: string, rules: CssRules, phonePx: number) {
  const want = phoneQuery(phonePx)
  return rules.patternMedia
    .filter((query) => query !== want)
    .map((query): Problem => {
      const at = contract.indexOf(`\`${query}\``)
      return {
        file: CONTRACT,
        line: at < 0 ? undefined : contract.slice(0, at).split('\n').length,
        message: `"Media queries" gives a pattern ${query}, but breakpoint.phone is ${phonePx}px, so its query is ${want}: the token's value less 0.02 px`,
      }
    })
}

/** What the contract lets CSS read and query. */
export interface CssRules {
  /** Per layer, the tokens it reads: `color.text.*` is a family, `z-index.dialog` one token */
  families: Record<CssLayer, string[]>
  /** The media queries CSS may use */
  media: string[]
  /** The media queries only a pattern's CSS may use: the rows whose use starts "In a pattern only" */
  patternMedia: string[]
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
  const patternOnly = ([, use]: string[]) => /^In a pattern only\b/.test(use)
  const media = queries.filter((row) => !patternOnly(row)).map(([query]) => codeSpans(query)[0])
  const patternMedia = queries.filter(patternOnly).map(([query]) => codeSpans(query)[0])
  for (const needed of [REDUCED_MOTION, FORCED_COLORS])
    if (!media.includes(needed)) throw new Error(`${CONTRACT}, "Media queries", has no ${needed}`)
  const forced = queries.find(([query]) => query.includes(FORCED_COLORS))!
  return {
    families: { component, part: component, pattern: [...component, ...reads(/^Pattern/)] },
    media,
    patternMedia,
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

/** `breakpoint.phone` in pixels, from the tokens of the repo at `root`. */
export function breakpointPhone(root: string) {
  const token = loadTokens(readSources(root)).base.find((t) => t.name === 'breakpoint.phone')
  const value = token?.value as { value?: unknown; unit?: unknown } | undefined
  if (typeof value?.value !== 'number' || value.unit !== 'px')
    throw new Error('breakpoint.phone is not a px dimension, so no pattern query can follow it')
  return value.value
}

/** The context of the repo at `root`. */
export function cssContext(root: string): CssContext {
  const contract = readFileSync(join(root, CONTRACT), 'utf8')
  return { tokens: definedTokens(root), rules: readCssRules(contract) }
}

let cached: CssContext | undefined
const repo = () => (cached ??= cssContext(join(dirname(fileURLToPath(import.meta.url)), '../..')))

/**
 * A declaration that decides what a word longer than its line does: it breaks (`overflow-wrap` or
 * `word-break`), or the text stays on one line (`white-space: nowrap` or `pre`, a choice its spec
 * names). `pre-wrap` and `pre-line` wrap at spaces only, so a long word still overflows.
 */
const LONG_WORD =
  /^(overflow-wrap|word-wrap):\s*(anywhere|break-word)|^word-break:\s*(break-all|break-word)|^white-space:\s*(nowrap|pre)\s*$/i

/** The first `pn-` class of a selector, and its root's: `pn-Button-label` has `pn-Button`. */
const pnClass = (sel: string) => {
  const m = /\.(pn-[A-Za-z0-9]+)(-[A-Za-z0-9]+)?/.exec(sel)
  return m ? { own: `${m[1]}${m[2] ?? ''}`, root: m[1] } : undefined
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
  const queries = layer === 'pattern' ? [...rules.media, ...rules.patternMedia] : rules.media
  const root = postcss.parse(css, { from: file })
  // the selectors whose animation a reduced-motion block sets, so their loops stop
  const stopped = new Set<string>()
  root.walkAtRules('media', (rule) => {
    const query = media(rule.params)
    if (!queries.includes(query))
      report(
        rule,
        `@media ${rule.params} is not one of the queries ${layer === 'pattern' ? 'patterns' : 'components'} use: ${queries.join(', ')}`,
      )
    if (layer === 'pattern' && rules.patternMedia.includes(query))
      rule.walkRules((inner) => {
        for (const sel of inner.selectors)
          if (!RESPONSIVE.test(withoutNot(sel)))
            report(
              inner,
              `${selector(sel)} is inside @media ${rule.params}, which only lays out a pattern's size='responsive': select [data-size='responsive']`,
            )
      })
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
            `${selector(sel)} sets a typography role but not what a long word does: overflow-wrap: anywhere (a box as wide as its container) or break-word (a box sized to its content in a row) to break it, or white-space: nowrap to keep it on one line, on this rule or on .${cls.own === cls.root ? cls.own : `${cls.own} or .${cls.root}`} (${CONTRACT}, "CSS", "Long words")`,
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

export default {
  rule: RULE,
  run(root) {
    const context = cssContext(root)
    const contract = readFileSync(join(root, CONTRACT), 'utf8')
    return [
      ...patternMediaProblems(contract, context.rules, breakpointPhone(root)),
      ...CSS_LAYERS.flatMap(([dir, layer]) =>
        walk(root, dir, (n) => n.endsWith('.css')).flatMap((file) =>
          cssProblems(file, readFileSync(join(root, file), 'utf8'), layer, context),
        ),
      ),
    ].sort(byFileLine)
  },
} satisfies Check
