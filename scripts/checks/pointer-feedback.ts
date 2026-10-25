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

/** The properties that paint a state: a fill, a layer over it, an edge, the ink, a shadow. */
const PAINT = /^(background(-color|-image)?|border(-color)?|color|box-shadow|outline-color)$/i

const HOVER = '(hover: hover)'
const FORCED = '(forced-colors: active)'

/** A painting property by the longhand it sets: `background`, as written here, is a fill. */
const longhand = (prop: string) =>
  prop.toLowerCase() === 'background' ? 'background-color' : prop.toLowerCase()

/** What a set of rules paints, the later winning: each painting property's value. */
const paints = (rules: Rule[]) =>
  new Map(
    rules.flatMap((rule) =>
      rule.nodes
        .filter((n): n is Declaration => n.type === 'decl' && PAINT.test(n.prop))
        .map((d) => [longhand(d.prop), selector(d.value)] as const),
    ),
  )

/** A rule's `cursor`, lowercased, or undefined. */
const cursor = (rule: Rule) =>
  rule.nodes
    .find((n): n is Declaration => n.type === 'decl' && n.prop.toLowerCase() === 'cursor')
    ?.value.trim()
    .toLowerCase()

/**
 * A selector's compounds, with what its strings, brackets and parentheses hold emptied, so their
 * spaces, commas and `~=` split nothing.
 */
const compounds = (sel: string) => {
  let out = sel.replace(/"[^"]*"|'[^']*'/g, '""').replace(/\[[^\]]*\]/g, '[]')
  while (/\([^()]*\)/.test(out)) out = out.replace(/\([^()]*\)/g, '_')
  return out.trim().split(/\s*[>+~]\s*|\s+/)
}

/** A selector less what its `:not()`s hold, so a guard such as `:not([data-disabled])` names no state. */
const unguarded = (sel: string) => {
  let out = sel
  while (/:not\([^()]*\)/.test(out)) out = out.replace(/:not\([^()]*\)/g, '')
  return out
}

/**
 * What the hovered compound names, its first `.pn-` class or else its element type, so its cursor
 * can be found; undefined when it names neither, as `[role]:hover > .pn-…` does, whose row sets the
 * cursor in its own file.
 */
const hoveredName = (sel: string) => {
  const hovered = compounds(sel).find((c) => c.includes(':hover')) ?? ''
  return /\.(pn-[\w-]+)/.exec(hovered)?.[0] ?? /^[a-z][\w-]*/i.exec(hovered)?.[0]
}

/** Whether a selector's last compound, the element it styles, is the one `name` names. */
const styles = (sel: string, name: string) => {
  const last = compounds(sel).at(-1) ?? ''
  return name.startsWith('.')
    ? new RegExp(`\\${name}(?![\\w-])`).test(last)
    : new RegExp(`^${name}(?![\\w-])`, 'i').test(last)
}

/** The states that keep the default cursor, each needing it in a rule of its own. */
const STILL = [
  { name: 'disabled', test: /\[data-disabled\]|:disabled/ },
  { name: 'read-only', test: /\[data-readonly\]|:read-only/ },
]

/** The edge a field keeps in every state, which a hover and a press repeat and no fill steps. */
const PINNED = /\[data-invalid\]|\[aria-invalid/

/** The problems of one CSS file against the rule. `file` names the file in each problem. */
export function pointerProblems(file: string, css: string): Problem[] {
  const problems: Problem[] = []
  const excused = allowances(css, RULE)
  const rules: { rule: Rule; index: number }[] = []
  postcss.parse(css, { from: file }).walkRules((rule) => {
    if (!inMedia(rule, FORCED)) rules.push({ rule, index: rules.length })
  })
  /** The rules of each state's selectors, keyed by the selector the press would have. */
  const group = (state: ':hover' | ':active') => {
    const out = new Map<string, { rule: Rule; index: number; sel: string }[]>()
    for (const r of rules)
      if (inMedia(r.rule, HOVER) === (state === ':hover'))
        for (const sel of r.rule.selectors)
          if (sel.includes(state) && !sel.includes(state === ':hover' ? ':active' : ':hover')) {
            const key = selector(sel.replaceAll(':hover', ':active'))
            out.set(key, [...(out.get(key) ?? []), { ...r, sel }])
          }
    return out
  }
  const pressed = group(':active')
  const hovered = new Map<string, Rule>()
  for (const r of rules)
    for (const sel of r.rule.selectors)
      if (sel.includes(':hover') && !sel.includes(':active') && !inMedia(r.rule, HOVER))
        problems.push({
          file,
          line: r.rule.source?.start?.line,
          message: `${selector(sel)} hovers outside @media (hover: hover), so a touch shows it and leaves it on: move it inside ${WHERE}`,
        })
  for (const [want, hovers] of group(':hover')) {
    const line = hovers[0].rule.source?.start?.line
    // an allowance on the hover rule excuses the part: its press, its order and its cursor
    if (line === undefined || excused.has(line)) continue
    const sel = hovers[0].sel
    const name = hoveredName(sel)
    if (name && !hovered.has(name)) hovered.set(name, hovers[0].rule)
    const press = (pressed.get(want) ?? []).filter((p) => paints([p.rule]).size)
    const hover = paints(hovers.map((h) => h.rule))
    // a press rule that a later hover rule overrides, for a property both paint
    const early = press.find((p) =>
      hovers.some(
        (h) =>
          h.index > p.index && [...paints([h.rule]).keys()].some((k) => paints([p.rule]).has(k)),
      ),
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
      [...paints(press.map((p) => p.rule))].every(([prop, value]) => hover.get(prop) === value)
    )
      problems.push({
        file,
        line,
        message: `${want} paints only what its hover rule already paints, so a press under the pointer shows nothing: take the pressed token, a step past hover ${WHERE}`,
      })
  }
  for (const [name, hover] of hovered) {
    const own = rules.filter((r) => r.rule.selectors.some((sel) => styles(sel, name)))
    if (!own.some((r) => cursor(r.rule) === 'pointer'))
      problems.push({
        file,
        line: hover.source?.start?.line,
        message: `${name} has a hover look and no cursor: pointer in a rule of its own ${WHERE}`,
      })
    for (const state of STILL) {
      const still = own.filter((r) =>
        r.rule.selectors.some((sel) => styles(sel, name) && state.test.test(unguarded(sel))),
      )
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
