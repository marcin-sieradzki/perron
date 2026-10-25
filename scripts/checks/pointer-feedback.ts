// The pointer-feedback rule: every part a pointer presses answers it with hover, a pressed look a
// step past hover and a pointer cursor, as the contract's "Pointer feedback" says
// (docs/components/README.md). It reads each component, pattern and part CSS file: a hover rule
// sits inside `(hover: hover)`, and needs `:active` rules for the same selector, outside the query
// and after it, that change something it paints; the part a file hovers takes `cursor: pointer` in
// a rule of its own, and `cursor: default` in one for its disabled or read-only state when the file
// styles one. A part with no pressed look, such as a text box, says why in a
// `perron-allow(pointer-feedback)` on its hover rule, which also leaves its cursor alone.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import postcss, { type AtRule, type Declaration, type Node, type Rule } from 'postcss'
import {
  allowances,
  byFileLine,
  CONTRACT,
  CSS_LAYERS,
  excuse,
  media,
  selector,
  walk,
  type Check,
  type Problem,
} from './lib.ts'

const RULE = 'pointer-feedback'
const WHERE = `(${CONTRACT}, "Pointer feedback")`

/** The properties that paint a state: a fill, a layer over it, an edge, the ink, a shadow. */
const PAINT = /^(background(-color|-image)?|border(-color)?|color|box-shadow|outline-color)$/i

/** Whether `node` sits in a `@media` that holds `query`, and not in one that negates it. */
const within = (node: Node, query: string) => {
  for (let p = node.parent; p; p = p.parent)
    if (p.type === 'atrule' && (p as AtRule).name.toLowerCase() === 'media') {
      const q = media((p as AtRule).params)
      if (q.includes(query) && !/(^|[\s,])not\s/.test(q)) return true
    }
  return false
}
const HOVER = '(hover: hover)'
const FORCED = '(forced-colors: active)'

/** What a set of rules paints, the later winning: each painting property's value. */
const paints = (rules: Rule[]) =>
  new Map(
    rules.flatMap((rule) =>
      rule.nodes
        .filter((n): n is Declaration => n.type === 'decl' && PAINT.test(n.prop))
        .map((d) => [d.prop.toLowerCase(), selector(d.value)] as const),
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

const DISABLED = /\[data-disabled\]|:disabled|\[data-readonly\]|:read-only/

/** The edge a field keeps in every state, which a hover and a press repeat and no fill steps. */
const PINNED = /\[data-invalid\]|\[aria-invalid/

/** The problems of one CSS file against the rule. `file` names the file in each problem. */
export function pointerProblems(file: string, css: string): Problem[] {
  const problems: Problem[] = []
  const excused = allowances(css, RULE)
  const rules: { rule: Rule; index: number }[] = []
  postcss.parse(css, { from: file }).walkRules((rule) => {
    if (!within(rule, FORCED)) rules.push({ rule, index: rules.length })
  })
  const pressed = new Map<string, { rule: Rule; index: number }[]>()
  for (const r of rules)
    if (!within(r.rule, HOVER))
      for (const sel of r.rule.selectors)
        if (sel.includes(':active') && !sel.includes(':hover'))
          pressed.set(selector(sel), [...(pressed.get(selector(sel)) ?? []), r])
  const hovered = new Map<string, Rule>()
  for (const r of rules) {
    const line = r.rule.source?.start?.line
    for (const sel of r.rule.selectors) {
      if (!sel.includes(':hover') || sel.includes(':active')) continue
      if (!within(r.rule, HOVER)) {
        problems.push({
          file,
          line,
          message: `${selector(sel)} hovers outside @media (hover: hover), so a touch shows it and leaves it on: move it inside ${WHERE}`,
        })
        continue
      }
      const name = hoveredName(sel)
      if (name && line !== undefined && !excused.has(line) && !hovered.has(name))
        hovered.set(name, r.rule)
      const want = selector(sel.replaceAll(':hover', ':active'))
      const press = (pressed.get(want) ?? []).filter((p) => paints([p.rule]).size)
      const early = press.find((p) => p.index < r.index)
      if (!press.length)
        problems.push({
          file,
          line,
          message: `${selector(sel)} has a hover look and no pressed one: write ${want} outside @media (hover: hover), after it, a step past hover ${WHERE}`,
        })
      else if (early)
        problems.push({
          file,
          line: early.rule.source?.start?.line,
          message: `${want} comes before its hover rule, which then wins while a mouse presses: move it after ${WHERE}`,
        })
      else if (
        // a pinned edge, such as an invalid field's, leaves the fill's step to the rules above it
        !PINNED.test(sel) &&
        [...paints(press.map((p) => p.rule))].every(
          ([prop, value]) => paints([r.rule]).get(prop) === value,
        )
      )
        problems.push({
          file,
          line: press.at(-1)!.rule.source?.start?.line,
          message: `${want} paints only what its hover rule already paints, so a press under the pointer shows nothing: take the pressed token, a step past hover ${WHERE}`,
        })
    }
  }
  for (const [name, hover] of hovered) {
    const own = rules.filter((r) => r.rule.selectors.some((sel) => styles(sel, name)))
    if (!own.some((r) => cursor(r.rule) === 'pointer'))
      problems.push({
        file,
        line: hover.source?.start?.line,
        message: `${name} has a hover look and no cursor: pointer in a rule of its own ${WHERE}`,
      })
    const disabled = own.filter((r) =>
      r.rule.selectors.some((sel) => styles(sel, name) && DISABLED.test(unguarded(sel))),
    )
    if (disabled.length && !disabled.some((r) => cursor(r.rule) === 'default'))
      problems.push({
        file,
        line: disabled[0].rule.source?.start?.line,
        message: `${name} styles a disabled or read-only state that keeps the pointer: set cursor: default there ${WHERE}`,
      })
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
