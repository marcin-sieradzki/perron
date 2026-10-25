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
import { PAINTS } from '../../packages/perron/src/testing/pointer.ts'
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
 * What a rule paints: each property of `PAINTS` by the longhand it sets, so `background` is a fill
 * and a layer, and `border` an edge.
 */
const paintsOf = (rule: Rule) => {
  const out = new Map<string, string>()
  for (const n of rule.nodes)
    if (n.type === 'decl' && (PAINTS as readonly string[]).includes(n.prop.toLowerCase())) {
      const prop = n.prop.toLowerCase()
      const value = selector(n.value)
      const sets =
        prop === 'background'
          ? ['background-color', 'background-image']
          : prop === 'border'
            ? ['border-color']
            : [prop]
      for (const p of sets) out.set(p, value)
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
  while (/:(not|has)\([^()]*\)/.test(out)) out = out.replace(/:(not|has)\([^()]*\)/g, '')
  return out
}

/** Whether a selector, outside its `:not()` and `:has()`, is in the state `state`. */
const isIn = (sel: string, state: ':hover' | ':active') => unguarded(sel).includes(state)

/**
 * The selector a hover's or a press's pair is found by: its `:hover` as `:active`, outside
 * parentheses, with a `:not(:hover)` or `:not(:active)` guard dropped, in one spacing.
 */
const pairKey = (sel: string) => {
  let depth = 0
  let out = ''
  for (let i = 0; i < sel.length; i++) {
    if (sel[i] === '(') depth++
    if (sel[i] === ')') depth--
    if (depth === 0 && sel.startsWith(':hover', i)) {
      out += ':active'
      i += ':hover'.length - 1
    } else out += sel[i]
  }
  return selector(out.replace(/:not\(\s*:(hover|active)\s*\)/g, ''))
}

/**
 * A selector's compounds, with what its strings, brackets and parentheses hold emptied, so their
 * spaces, commas and `~=` split nothing.
 */
const compounds = (sel: string) => {
  let out = sel.replace(/"[^"]*"|'[^']*'/g, '""').replace(/\[[^\]]*\]/g, '[]')
  while (/\([^()]*\)/.test(out)) out = out.replace(/\([^()]*\)/g, '_')
  return out.trim().split(/\s*[>+~]\s*|\s+/)
}

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
  const parts = sel.trim().split(/\s*[>+~]\s*|\s+(?![^(]*\))(?![^[]*\])/)
  return unguarded(parts.at(-1) ?? '')
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
  { name: 'disabled', test: /\[(data|aria)-disabled\b|:disabled/ },
  { name: 'read-only', test: /\[(data|aria)-readonly\b|:read-only/ },
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
      if (hover && !press && !inMedia(r.rule, HOVER))
        problems.push({
          file,
          line: r.rule.source?.start?.line,
          message: `${selector(sel)} hovers outside @media (hover: hover), so a touch shows it and leaves it on: move it inside ${WHERE}`,
        })
      const into =
        hover && !press ? hovers : press && !hover && !inMedia(r.rule, HOVER) ? presses : undefined
      if (into && (into === presses ? r.paints.size : true)) {
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
    // a press rule that a later hover rule overrides, for a property both paint
    const early = press.some((p) =>
      inside.some((h) => h.index > p.index && [...h.paints.keys()].some((k) => p.paints.has(k))),
    )
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
      [...pressPaints].every(([prop, value]) => hover.get(prop) === value)
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
