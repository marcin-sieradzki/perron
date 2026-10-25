// The pointer-feedback rule: every part a pointer presses answers it with hover, a pressed look a
// step past hover and a pointer cursor, as the contract's "Pointer feedback" says
// (docs/components/README.md). It reads each component, pattern and part CSS file: a hover rule
// sits inside `(hover: hover)`, and needs `:active` rules for the same selector, outside the query
// and after it, that change something it paints; the part a file hovers takes `cursor: pointer` in
// a rule of its own, and `cursor: default` in one for each disabled or read-only state the file
// styles. A part with no pressed look, such as a text box, says why in a
// `perron-allow(pointer-feedback)` on its hover rule, which also leaves its cursor alone.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import postcss, { type Declaration, type Rule } from 'postcss'
import { isPaint } from '../../packages/perron/src/testing/pointer.ts'
import {
  allowances,
  byFileLine,
  CONTRACT,
  CSS_LAYERS,
  excuse,
  inMedia,
  selector,
  walk,
  type Check,
  type Problem,
} from './lib.ts'

const RULE = 'pointer-feedback'
const WHERE = `(${CONTRACT}, "Pointer feedback")`
const HOVER = '(hover: hover)'
const FORCED = '(forced-colors: active)'

/**
 * What a rule paints: each painting property by the longhand it sets, so `background` is a fill and
 * a layer, `border` an edge and `outline` an outline's ink.
 */
const paintsOf = (rule: Rule) => {
  const out = new Map<string, string>()
  for (const n of rule.nodes)
    if (n.type === 'decl' && isPaint(n.prop)) {
      const prop = n.prop.toLowerCase()
      const value = selector(n.value)
      if (prop === 'background') {
        const layer = /gradient\(|url\(/.test(value)
        out.set('background-color', layer ? 'transparent' : value)
        out.set('background-image', layer ? value : 'none')
      } else if (
        /^(border(-(block|inline|top|right|bottom|left)(-(start|end))?)?|outline)$/.test(prop)
      )
        // a shorthand's colour: its var(), hex or keyword, else the whole value
        out.set(
          `${prop}-color`,
          /var\([^)]*\)|#[\da-f]+\b|\b(transparent|currentcolor)\b/i.exec(value)?.[0] ?? value,
        )
      else out.set(prop, value)
    }
  return out
}

/** A rule's `cursor`, lowercased, or undefined. */
const cursor = (rule: Rule) =>
  rule.nodes
    .find((n): n is Declaration => n.type === 'decl' && n.prop.toLowerCase() === 'cursor')
    ?.value.trim()
    .toLowerCase()

/** A selector less what its `:not()` and `:has()` hold, so a guard or a child's state names no state. */
const unguarded = (sel: string) => {
  let out = sel
  for (let at = out.search(/:(not|has)\(/); at >= 0; at = out.search(/:(not|has)\(/)) {
    let end = out.indexOf('(', at)
    for (let depth = 0; end < out.length; end++) {
      if (out[end] === '(') depth++
      if (out[end] === ')' && --depth === 0) break
    }
    out = out.slice(0, at) + out.slice(end + 1)
  }
  return out
}

/** Whether a selector, outside its `:not()` and `:has()`, is in the state `state`. */
const isIn = (sel: string, state: ':hover' | ':active') => unguarded(sel).includes(state)

/** A selector with what its strings, brackets and parentheses hold masked, at the same length. */
const masked = (sel: string) => {
  let out = sel
    .replace(/"[^"]*"|'[^']*'/g, (m) => '"'.repeat(m.length))
    .replace(/\[[^\]]*\]/g, (m) => `[${'_'.repeat(m.length - 2)}]`)
  while (/\([^()]*\)/.test(out)) out = out.replace(/\([^()]*\)/g, (m) => '_'.repeat(m.length))
  return out
}

/** Where each compound of a selector starts and ends, combinators left out. */
const spans = (sel: string) =>
  [...masked(sel).matchAll(/[^\s>+~]+/g)].map((m) => [m.index, m.index + m[0].length] as const)

/**
 * The selector a hover's or a press's pair is found by, in one spacing: its compound's `:hover` or
 * `:active`, outside parentheses, moved to the compound's end as `:active`, so `.pn-X:hover:not(…)`
 * pairs with `.pn-X:not(…):active`, and a `:not(:hover)` or `:not(:active)` guard dropped.
 */
const pairKey = (sel: string) => {
  const mask = masked(sel)
  return selector(
    spans(sel)
      .map(([from, to], i, all) => {
        let text = sel.slice(from, to)
        const states = /:(hover|active)(?![\w-])/g
        if (/:(hover|active)(?![\w-])/.test(mask.slice(from, to))) {
          let kept = ''
          let last = 0
          for (const m of mask.slice(from, to).matchAll(states)) {
            kept += text.slice(last, m.index)
            last = m.index + m[0].length
          }
          text = `${kept}${text.slice(last)}:active`
        }
        // a combinator in one spacing, so `.a>.b` pairs with `.a > .b`
        const gap =
          i + 1 < all.length ? ` ${sel.slice(to, all[i + 1][0]).trim()} `.replace(/^\s+$/, ' ') : ''
        return text + gap
      })
      .join('')
      .replace(/:not\(\s*:(hover|active)\s*\)/g, ''),
  )
}

/** A selector's compounds, masked, so a space, a comma or a `~=` inside one splits nothing. */
const compounds = (sel: string) => spans(sel).map((span) => masked(sel).slice(...span))

/**
 * What the hovered compound names, its first `.pn-` class or else its element type, so its cursor
 * can be found; undefined when it names neither, as `[role]:hover > .pn-…` does, whose row sets the
 * cursor in its own file.
 */
const hoveredName = (sel: string) => {
  const hovered = compounds(unguarded(sel)).find((c) => c.includes(':hover')) ?? ''
  return /\.(pn-[\w-]+)/.exec(hovered)?.[0] ?? /^[a-z][\w-]*/i.exec(hovered)?.[0]
}

/** A selector's last compound, the element it styles, less its guards. */
const subject = (sel: string) => {
  const last = spans(sel).at(-1)
  return unguarded(last ? sel.slice(...last) : '')
}

/** Whether a selector styles the element `name` names, itself, not a pseudo-element of it. */
const styles = (sel: string, name: string) => {
  const last = subject(sel)
  return (
    !last.includes('::') &&
    (name.startsWith('.')
      ? new RegExp(`\\${name}(?![\\w-])`).test(last)
      : new RegExp(`^${name}(?![\\w-])`, 'i').test(last))
  )
}

/** The states that keep the default cursor, each needing it in a rule of its own. */
const STILL = [
  { name: 'disabled', test: /\[(data|aria)-disabled(?=[\]=~|^$*\s])(?!=['"]?false)|:disabled/ },
  { name: 'read-only', test: /\[(data|aria)-readonly(?=[\]=~|^$*\s])(?!=['"]?false)|:read-only/ },
]

/** A state a rule's cursor doesn't speak for: the pointer's or the focus's own. */
const PASSING = /:(hover|active|focus)/

/** The edge a field keeps in every state, which a hover and a press repeat and no fill steps. */
const PINNED = /\[data-invalid\]|\[aria-invalid/

interface Read {
  rule: Rule
  index: number
  sel: string
  paints: Map<string, string>
}

/** The problems of one CSS file against the rule. `file` names the file in each problem. */
export function pointerProblems(file: string, css: string): Problem[] {
  const problems: Problem[] = []
  const excused = allowances(css, RULE)
  const rules: Omit<Read, 'sel'>[] = []
  postcss.parse(css, { from: file }).walkRules((rule) => {
    if (!inMedia(rule, FORCED)) rules.push({ rule, index: rules.length, paints: paintsOf(rule) })
  })
  const hovers = new Map<string, Read[]>()
  const presses = new Map<string, Read[]>()
  for (const r of rules)
    for (const sel of r.rule.selectors) {
      const hover = isIn(sel, ':hover')
      const press = isIn(sel, ':active')
      if (hover && !press && !/:hover(?![\w-])/.test(masked(unguarded(sel))))
        problems.push({
          file,
          line: r.rule.source?.start?.line,
          message: `${selector(sel)} hovers inside :is() or :where(): write :hover on the compound itself, so its press can be written as its pair ${WHERE}`,
        })
      else if (hover && !press && !inMedia(r.rule, HOVER))
        problems.push({
          file,
          line: r.rule.source?.start?.line,
          message: `${selector(sel)} hovers outside @media (hover: hover), so a touch shows it and leaves it on: move it inside ${WHERE}`,
        })
      const into =
        hover && !press ? hovers : press && !hover && !inMedia(r.rule, HOVER) ? presses : undefined
      // a hover that paints nothing, such as one that shows a child, has no look to press past
      if (into && r.paints.size && /:(hover|active)(?![\w-])/.test(masked(unguarded(sel)))) {
        const key = pairKey(sel)
        into.set(key, [...(into.get(key) ?? []), { ...r, sel }])
      }
    }
  const named = new Map<string, Rule>()
  for (const [want, group] of hovers) {
    const inside = group.filter((h) => inMedia(h.rule, HOVER))
    if (!inside.length) continue
    // an allowance on a hover rule excuses the part: its press, its order and its cursor
    if (inside.some((h) => excused.has(h.rule.source?.start?.line ?? -1))) continue
    const line = inside[0].rule.source?.start?.line
    const sel = inside[0].sel
    const name = hoveredName(sel)
    if (name && !named.has(name)) named.set(name, inside[0].rule)
    const press = presses.get(want) ?? []
    const hover = new Map(inside.flatMap((h) => [...h.paints]))
    const pressPaints = new Map(press.flatMap((p) => [...p.paints]))
    // a property whose last press rule a later hover rule overrides
    const lastOf = (reads: Read[], prop: string) =>
      Math.max(-1, ...reads.filter((r) => r.paints.has(prop)).map((r) => r.index))
    const early = [...pressPaints.keys()].some((prop) => lastOf(inside, prop) > lastOf(press, prop))
    if (!press.length)
      problems.push({
        file,
        line,
        message: `${selector(sel)} has a hover look and no pressed one: write ${want} outside @media (hover: hover), after it, a step past hover ${WHERE}`,
      })
    else if (early)
      problems.push({
        file,
        line,
        message: `${want} comes before a hover rule that paints what it paints, which then wins while a mouse presses: move it after ${WHERE}`,
      })
    else if (
      // a pinned edge, such as an invalid field's, leaves the fill's step to the rules above it
      !PINNED.test(unguarded(sel)) &&
      [...pressPaints].every(
        // a shorthand's reset, such as `background`'s `none` layer, adds nothing to a hover
        ([prop, value]) =>
          hover.get(prop) === value || (!hover.has(prop) && /^(none|transparent)$/.test(value)),
      )
    )
      problems.push({
        file,
        line,
        message: `${want} paints only what its hover rule already paints, so a press under the pointer shows nothing: take the pressed token, a step past hover ${WHERE}`,
      })
  }
  for (const [name, hover] of named) {
    const own = (test: (sel: string) => boolean) =>
      rules.filter((r) => r.rule.selectors.some((sel) => styles(sel, name) && test(subject(sel))))
    const atRest = own((s) => !PASSING.test(s) && !STILL.some((st) => st.test.test(s)))
    if (!atRest.some((r) => cursor(r.rule) === 'pointer'))
      problems.push({
        file,
        line: hover.source?.start?.line,
        message: `${name} has a hover look and no cursor: pointer in a rule of its own ${WHERE}`,
      })
    for (const state of STILL) {
      const still = own((s) => state.test.test(s) && !PASSING.test(s))
      if (still.length && !still.some((r) => cursor(r.rule) === 'default'))
        problems.push({
          file,
          line: still[0].rule.source?.start?.line,
          message: `${name} styles a ${state.name} state that keeps the pointer: set cursor: default there ${WHERE}`,
        })
    }
  }
  return excuse(problems.sort(byFileLine), RULE, () => css)
}

export default {
  rule: RULE,
  run(root) {
    return CSS_LAYERS.flatMap(([dir]) =>
      walk(root, dir, (n) => n.endsWith('.css')).flatMap((file) =>
        pointerProblems(file, readFileSync(join(root, file), 'utf8')),
      ),
    ).sort(byFileLine)
  },
} satisfies Check
