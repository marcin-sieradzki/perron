// The pointer-feedback rule: every part a pointer presses answers it with hover, a pressed look a
// step past hover and a pointer cursor, as the contract's "Pointer feedback" says
// (docs/components/README.md). It reads each component, pattern and part CSS file: a hover rule
// sits inside `(hover: hover)`, and needs an `:active` rule for the same selector, outside the
// query and after it, that changes something it paints; a part a file hovers takes
// `cursor: pointer` in a rule of its own class, and `cursor: default` in one for its disabled or
// read-only state when the file styles one. A part with no pressed look, such as a text box, says
// why in a `perron-allow(pointer-feedback)` on its hover rule, which also leaves its cursor alone.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import postcss, { type AtRule, type Declaration, type Node, type Rule } from 'postcss'
import { PACKAGE } from '../lib/paths.ts'
import { allowances, byFileLine, CONTRACT, excuse, walk, type Check, type Problem } from './lib.ts'

const RULE = 'pointer-feedback'
const WHERE = `(${CONTRACT}, "Pointer feedback")`

/** The properties that paint a state: a fill, a layer over it, an edge, the ink, a shadow. */
const PAINT = /^(background(-color|-image)?|border(-color)?|color|box-shadow|outline-color)$/i

/** The `@media` queries a node sits in, lowercased, without spaces, joined. */
const queries = (node: Node) => {
  const found: string[] = []
  for (let p = node.parent; p; p = p.parent)
    if (p.type === 'atrule' && (p as AtRule).name.toLowerCase() === 'media')
      found.push((p as AtRule).params.toLowerCase().replace(/\s+/g, ''))
  return found.join(' ')
}

/** A selector with its white space collapsed, so two spellings of one selector compare equal. */
const spelled = (text: string) => text.replace(/\s+/g, ' ').trim()

/** What a rule paints: each painting property's value. */
const paints = (rule: Rule) =>
  new Map(
    rule.nodes
      .filter((n): n is Declaration => n.type === 'decl' && PAINT.test(n.prop))
      .map((d) => [d.prop.toLowerCase(), spelled(d.value)]),
  )

/** A selector with what its parentheses hold emptied, so their commas and spaces split nothing. */
const flat = (sel: string) => {
  let out = sel
  while (/\([^()]*\)/.test(out)) out = out.replace(/\([^()]*\)/g, '_')
  return out
}

/**
 * The class of the part a selector hovers, `.pn-…:hover`, or undefined when it hovers an ancestor
 * of one, `[role]:hover > .pn-…`, whose own file sets the cursor.
 */
const hoveredClass = (sel: string) => {
  const text = flat(sel)
  const compound =
    text
      .slice(0, text.indexOf(':hover'))
      .split(/[\s>+~]+/)
      .at(-1) ?? ''
  return /\.(pn-[\w-]+)/.exec(compound)?.[1]
}

/** Whether `sel` names the class `cls` itself, not one that starts with it. */
const names = (sel: string, cls: string) => new RegExp(`\\.${cls}(?![\\w-])`).test(sel)

const DISABLED = /\[data-disabled\]|:disabled|\[data-readonly\]/

/** The problems of one CSS file against the rule. `file` names the file in each problem. */
export function pointerProblems(file: string, css: string): Problem[] {
  const problems: Problem[] = []
  const excused = allowances(css, RULE)
  const root = postcss.parse(css, { from: file })
  const rules: { rule: Rule; index: number; media: string }[] = []
  root.walkRules((rule) => {
    rules.push({ rule, index: rules.length, media: queries(rule) })
  })
  const pressed = new Map<string, { rule: Rule; index: number }>()
  for (const r of rules)
    if (!r.media.includes('hover:hover') && !r.media.includes('forced-colors'))
      for (const sel of r.rule.selectors)
        if (sel.includes(':active') && !sel.includes(':hover')) pressed.set(spelled(sel), r)
  const hovered = new Map<string, Rule>()
  for (const r of rules) {
    if (r.media.includes('forced-colors')) continue
    const line = r.rule.source?.start?.line
    for (const sel of r.rule.selectors) {
      if (!sel.includes(':hover') || sel.includes(':active')) continue
      if (!r.media.includes('hover:hover')) {
        problems.push({
          file,
          line,
          message: `${spelled(sel)} hovers outside @media (hover: hover), so a touch shows it and leaves it on: move it inside ${WHERE}`,
        })
        continue
      }
      const cls = hoveredClass(sel)
      if (cls && line !== undefined && !excused.has(line) && !hovered.has(cls))
        hovered.set(cls, r.rule)
      const want = spelled(sel.replaceAll(':hover', ':active'))
      const press = pressed.get(want)
      const hover = paints(r.rule)
      if (!press)
        problems.push({
          file,
          line,
          message: `${spelled(sel)} has a hover look and no pressed one: write ${want} outside @media (hover: hover), after it, a step past hover ${WHERE}`,
        })
      else if (press.index < r.index)
        problems.push({
          file,
          line: press.rule.source?.start?.line,
          message: `${want} comes before its hover rule, which then wins while a mouse presses: move it after ${WHERE}`,
        })
      else if (
        // a pair that keeps an edge alone, such as an invalid one, leaves the fill's step to the
        // rules above it
        ![...hover.keys()].every((p) => p.startsWith('border')) &&
        [...paints(press.rule)].every(([p, v]) => hover.get(p) === v)
      )
        problems.push({
          file,
          line: press.rule.source?.start?.line,
          message: `${want} paints only what its hover rule already paints, so a press under the pointer shows nothing: take the pressed token, a step past hover ${WHERE}`,
        })
    }
  }
  for (const [cls, hover] of hovered) {
    const own = rules.filter(
      (r) => !r.media.includes('forced-colors') && r.rule.selectors.some((sel) => names(sel, cls)),
    )
    const cursor = (rule: Rule) =>
      rule.nodes
        .find((n): n is Declaration => n.type === 'decl' && n.prop.toLowerCase() === 'cursor')
        ?.value.trim()
        .toLowerCase()
    const line = hover.source?.start?.line
    if (!own.some((r) => cursor(r.rule) === 'pointer'))
      problems.push({
        file,
        line,
        message: `.${cls} has a hover look and no cursor: pointer in a rule of its own ${WHERE}`,
      })
    const disabled = own.filter((r) =>
      r.rule.selectors.some((sel) => DISABLED.test(sel) && !/:not\(/.test(sel)),
    )
    if (disabled.length && !disabled.some((r) => cursor(r.rule) === 'default'))
      problems.push({
        file,
        line: disabled[0].rule.source?.start?.line,
        message: `.${cls} styles a disabled or read-only state that keeps the pointer: set cursor: default there ${WHERE}`,
      })
  }
  return excuse(problems.sort(byFileLine), RULE, () => css)
}

const DIRS = ['components', 'patterns', 'parts'].map((d) => `${PACKAGE}/src/${d}`)

export default {
  rule: RULE,
  run(root) {
    return DIRS.flatMap((dir) =>
      walk(root, dir, (n) => n.endsWith('.css')).flatMap((file) =>
        pointerProblems(file, readFileSync(join(root, file), 'utf8')),
      ),
    ).sort(byFileLine)
  },
} satisfies Check
