// The pointer-feedback rule: every part a pointer presses answers it with hover, a pressed look a
// step past hover and a pointer cursor, as the contract's "Pointer feedback" says
// (docs/components/README.md). It reads each component, pattern and part CSS file: every hover rule
// needs an `:active` rule for the same selector, outside `(hover: hover)` and after it, that paints
// the part otherwise; and a file that hovers a part of its own sets `cursor: pointer`, and
// `cursor: default` too when it styles a disabled state. A part with no pressed look, such as a
// text box, says why in a `perron-allow(pointer-feedback)` on its hover rule.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import postcss, { type AtRule, type Declaration, type Node, type Rule } from 'postcss'
import { PACKAGE } from '../lib/paths.ts'
import { byFileLine, CONTRACT, excuse, walk, type Check, type Problem } from './lib.ts'

const RULE = 'pointer-feedback'

/** The properties that paint a state: a fill, a layer over it, an edge, the ink, a shadow. */
const PAINT = /^(background(-color|-image)?|border(-color)?|color|box-shadow|outline-color)$/i

/** The innermost `@media` a node sits in, lowercased, or '' outside every query. */
const query = (node: Node) => {
  for (let p = node.parent; p; p = p.parent)
    if (p.type === 'atrule' && (p as AtRule).name.toLowerCase() === 'media')
      return (p as AtRule).params.toLowerCase().replace(/\s+/g, '')
  return ''
}

/** A selector with its white space collapsed, so two spellings of one selector compare equal. */
const spelled = (text: string) => text.replace(/\s+/g, ' ').trim()

/** What a rule paints, as `property: value` lines in source order. */
const paints = (rule: Rule) =>
  rule.nodes
    .filter((n): n is Declaration => n.type === 'decl' && PAINT.test(n.prop))
    .map((d) => `${d.prop.toLowerCase()}: ${spelled(d.value)}`)
    .sort()
    .join('; ')

/**
 * Whether the element a selector hovers is a part of the file's own, `.pn-…:hover`, rather than an
 * ancestor of one, `[role]:hover > .pn-…`, whose own file sets the cursor.
 */
const hoversOwnPart = (sel: string) => {
  const before = sel.slice(0, sel.indexOf(':hover'))
  const compound = before.split(/[\s>+~]+/).at(-1) ?? ''
  return compound.includes('.pn-')
}

/** The problems of one CSS file against the rule. `file` names the file in each problem. */
export function pointerProblems(file: string, css: string): Problem[] {
  const problems: Problem[] = []
  const root = postcss.parse(css, { from: file })
  const rules: { rule: Rule; index: number; media: string }[] = []
  root.walkRules((rule) => {
    rules.push({ rule, index: rules.length, media: query(rule) })
  })
  const pressed = new Map<string, { rule: Rule; index: number }>()
  for (const r of rules)
    if (!r.media.includes('hover:hover') && !r.media.includes('forced-colors'))
      for (const sel of r.rule.selectors)
        if (sel.includes(':active') && !sel.includes(':hover')) pressed.set(spelled(sel), r)
  let ownHover: Rule | undefined
  for (const r of rules) {
    if (!r.media.includes('hover:hover') || r.media.includes('forced-colors')) continue
    for (const sel of r.rule.selectors) {
      if (!sel.includes(':hover') || sel.includes(':active')) continue
      if (hoversOwnPart(sel)) ownHover ??= r.rule
      const line = r.rule.source?.start?.line
      const press = pressed.get(spelled(sel.replaceAll(':hover', ':active')))
      if (!press)
        problems.push({
          file,
          line,
          message: `${spelled(sel)} has a hover look and no pressed one: write ${spelled(sel.replaceAll(':hover', ':active'))} outside @media (hover: hover), a step past hover (${CONTRACT}, "Pointer feedback")`,
        })
      else if (press.index < r.index)
        problems.push({
          file,
          line: press.rule.source?.start?.line,
          message: `${spelled(sel.replaceAll(':hover', ':active'))} comes before its hover rule, which then wins while a mouse presses: move it after (${CONTRACT}, "Pointer feedback")`,
        })
      // a pair that keeps an edge alone, such as the invalid one, leaves the fill's step to the rules above it
      else if (paints(press.rule) === paints(r.rule) && paints(r.rule).includes('background'))
        problems.push({
          file,
          line: press.rule.source?.start?.line,
          message: `${spelled(sel.replaceAll(':hover', ':active'))} paints what its hover rule paints, so a press under the pointer shows nothing: take the pressed token, a step past hover (${CONTRACT}, "Pointer feedback")`,
        })
    }
  }
  if (ownHover) {
    const cursors = new Set<string>()
    root.walkDecls(/^cursor$/i, (d) => {
      if (!query(d).includes('forced-colors')) cursors.add(d.value.trim().toLowerCase())
    })
    const line = ownHover.source?.start?.line
    if (!cursors.has('pointer'))
      problems.push({
        file,
        line,
        message: `the part ${spelled(ownHover.selector)} hovers sets no cursor: pointer (${CONTRACT}, "Pointer feedback")`,
      })
    let disabled = false
    root.walkRules((rule) => {
      if (/\[data-disabled\]|:disabled/.test(rule.selector) && !/:not\(/.test(rule.selector))
        disabled = true
    })
    if (disabled && !cursors.has('default') && !cursors.has('not-allowed'))
      problems.push({
        file,
        line,
        message: `a disabled part keeps the pointer: set cursor: default on it (${CONTRACT}, "Pointer feedback")`,
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
