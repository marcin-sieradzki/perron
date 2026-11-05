// The `usage` rule: a registered entry's spec, from `building` on, gives its caller guidance as
// data the docs pages and the Perron MCP can read (scripts/lib/usage.ts, laid out by
// docs/components/TEMPLATE.md). When to use comes first and names registered entries other than
// its own, from building on and not deprecated, each linked to its spec page, or says none comes
// close; the Do and don't table's rules each have an id, a level and what checks them, and each
// `types` rule is proven by a `@ts-expect-error` citing it in the entry's tests or stories; a row
// that names WCAG names its success criterion; For agents comes last, as a list or "None known
// yet." Every such spec has all three. A breach is a spec's row to rewrite, so this rule takes no perron-allow.
import { existsSync, readFileSync } from 'node:fs'
import { join, posix } from 'node:path'
import { PACKAGE } from '../lib/paths.ts'
import { folderOf, isBuilt, readRegistry, specPage, type Entry } from '../lib/registry.ts'
import {
  ALTERNATIVE_COLUMNS,
  CHECKED_BY,
  citations,
  FOR_AGENTS,
  hasRuleColumns,
  LEVELS,
  NO_ALTERNATIVE,
  NONE_KNOWN,
  readDoAndDont,
  readForAgents,
  readWhenToUse,
  RULE_COLUMNS,
  RULE_ID,
  sectionsOf,
  TYPE_TEST_FILE,
  WHEN_TO_USE,
  type DoAndDont,
  type WhenToUse,
} from '../lib/usage.ts'
import { byFileLine, walk, type Check, type Problem } from './lib.ts'

const RULE = 'usage'

/** Where a problem's reader finds the layout. */
const TEMPLATE = '(docs/components/TEMPLATE.md)'

/** A Do and don't table without the five columns, and each rule with a cell out of its vocabulary. */
function tableProblems(e: Entry, table: DoAndDont): Problem[] {
  const file = specPage(e)
  if (!hasRuleColumns(table.columns))
    return [
      {
        file,
        line: table.line,
        message: `${file}'s Do and don't table has the columns ${table.columns.join(', ')}: give it ${RULE_COLUMNS.slice(0, -1).join(', ')} and ${RULE_COLUMNS.at(-1)}, in that order ${TEMPLATE}`,
      },
    ]
  const problems: Problem[] = []
  const seen = new Map<string, number>()
  for (const { id, level, checkedBy, line } of table.rules) {
    const at = (message: string) => problems.push({ file, line, message })
    if (!RULE_ID.test(id))
      at(
        `"${id}" is no rule id: write DD- and the rule's number, counted from 1 within the spec, as DD-1`,
      )
    else if (seen.has(id))
      at(
        `${id} is the id of line ${seen.get(id)}'s rule too: give each rule a number of its own, and keep the numbers a review may have cited`,
      )
    else seen.set(id, line)
    if (!(LEVELS as readonly string[]).includes(level))
      at(
        `${id}'s level is "${level}", not must or should: must when its Don't is never right, should when a caller may break it with a reason`,
      )
    if (!(CHECKED_BY as readonly string[]).includes(checkedBy))
      at(
        `${id} is checked by "${checkedBy}", not types or review: types when ${e.name}Props rejects its Don't, review when only a review of the caller's code can catch it`,
      )
  }
  return problems
}

/** An entry's folder, by path from the repo root, with a trailing slash. */
const folder = (e: Entry) => `${PACKAGE}/src/${folderOf(e.layer)}/${e.name}/`

/**
 * Each `types` rule no `@ts-expect-error` in the entry's tests or stories cites, and each such
 * citation of an id that is no `types` rule.
 */
function citationProblems(root: string, e: Entry, table: DoAndDont): Problem[] {
  if (!hasRuleColumns(table.columns)) return []
  const cited = walk(root, folder(e), (f) => TYPE_TEST_FILE.test(f)).flatMap((file) =>
    citations(readFileSync(join(root, file), 'utf8')).map((c) => ({ ...c, file })),
  )
  const typed = table.rules.filter((r) => r.checkedBy === 'types')
  return [
    ...typed
      .filter((r) => !cited.some((c) => c.id === r.id))
      .map((r) => ({
        file: specPage(e),
        line: r.line,
        message: `${r.id} is checked by types, but no \`@ts-expect-error ${r.id}\` in a test or story of ${folder(e)} proves it: write a line ${e.name}Props rejects under \`// @ts-expect-error ${r.id}: <what it breaks>\`, or check the rule by review`,
      })),
    ...cited
      .filter((c) => !typed.some((r) => r.id === c.id))
      .map(({ file, line, id }) => ({
        file,
        line,
        message: `\`@ts-expect-error ${id}\` cites no types rule of ${specPage(e)}'s Do and don't: cite the rule the line below breaks, one whose Checked by is types`,
      })),
  ]
}

/** A success criterion by its number, such as 2.5.8; WCAG's own version, 2.2, is none. */
const CRITERION = /\b[1-4]\.\d{1,2}\.\d{1,2}\b/

/** Each Do and don't row, in five columns or not, that names WCAG with no success criterion. */
function wcagProblems(e: Entry, table: DoAndDont): Problem[] {
  return table.rows
    .filter((r) => /\bWCAG\b/.test(r.text) && !CRITERION.test(r.text))
    .map((r) => ({
      file: specPage(e),
      line: r.line,
      message:
        'This row names WCAG but no success criterion: name the one it rests on by its number, such as 2.5.8 Target size (minimum), so a review knows what to test',
    }))
}

/** A link from the spec of `from` to the spec of `to`, as When to use writes it. */
const linkTo = (from: Entry, to: Entry) =>
  posix.relative(posix.dirname(specPage(from)), specPage(to))

/**
 * When to use with neither its table nor the no-alternative line, a table with other columns, and
 * each row whose entry is not registered, is in design or deprecated, is the entry itself, or is no
 * link to its spec page.
 */
function alternativeProblems(e: Entry, registry: Entry[], when: WhenToUse): Problem[] {
  const file = specPage(e)
  if (!when.table && !when.none)
    return [
      {
        file,
        line: when.line,
        message: `${file}'s When to use has no table of the entries to use instead: give it one, with the columns ${ALTERNATIVE_COLUMNS.join(' and ')}, or the line "${NO_ALTERNATIVE}" ${TEMPLATE}`,
      },
    ]
  if (!when.table) return []
  const { columns } = when.table
  if (columns.join('|') !== ALTERNATIVE_COLUMNS.join('|'))
    return [
      {
        file,
        line: when.table.line,
        message: `${file}'s When to use table has the columns ${columns.join(', ')}: give it ${ALTERNATIVE_COLUMNS.join(' and ')} ${TEMPLATE}`,
      },
    ]
  return when.alternatives.flatMap(({ name, href, when: cell, line }): Problem[] => {
    const at = (message: string) => [{ file, line, message }]
    if (!name)
      return at(
        "This row names no entry by a link: write the entry's name as a link to its spec page, such as [Pin](pin.md)",
      )
    if (name === e.name)
      return at(`${name} names itself: When to use names the entries to use in its place`)
    const other = registry.find((r) => r.name === name)
    if (!other)
      return at(
        `${name} is no registered entry: name an entry of packages/perron/components.json, or take the row out`,
      )
    if (!isBuilt(other))
      return at(
        `${name} is in design, so no one can use it yet: name an entry from building on, or take the row out`,
      )
    if (other.status === 'deprecated')
      return at(
        `${name} is deprecated: name its successor, ${other.replacedBy}, or take the row out`,
      )
    const want = linkTo(e, other)
    if (posix.normalize(href.split('#')[0]) !== want)
      return at(`The link to ${name} goes to ${href}, not to ${name}'s spec page: link ${want}`)
    if (!cell)
      return at(
        `${name}'s row says nothing under When: say when to use ${name} in ${e.name}'s place`,
      )
    return []
  })
}

/** When to use anywhere but first, For agents anywhere but last, and For agents that is no list. */
function placeProblems(e: Entry, spec: string): Problem[] {
  const file = specPage(e)
  const sections = sectionsOf(spec)
  const problems: Problem[] = []
  const when = sections.findIndex((s) => s.heading === WHEN_TO_USE)
  if (when > 0)
    problems.push({
      file,
      line: sections[when].line,
      message: `${file}'s When to use is not its first section: move it above ${sections[0].heading}, right after the intro and its run notes ${TEMPLATE}`,
    })
  const agents = sections.findIndex((s) => s.heading === FOR_AGENTS)
  if (agents >= 0 && agents < sections.length - 1)
    problems.push({
      file,
      line: sections[agents].line,
      message: `${file}'s For agents is not its last section: move it below ${sections.at(-1)!.heading} ${TEMPLATE}`,
    })
  const notes = readForAgents(spec)
  if (notes && !notes.wellFormed)
    problems.push({
      file,
      line: notes.line,
      message: `${file}'s For agents is neither "${NONE_KNOWN}" nor a bulleted list: write each mistake an agent has made as a bullet, the mistake and then its fix`,
    })
  return problems
}

/** Each of When to use, the Do and don't table and For agents that the spec lacks. */
function missingProblems(e: Entry, spec: string): Problem[] {
  const file = specPage(e)
  const missing = (has: unknown, message: string) => (has ? [] : [{ file, message }])
  return [
    ...missing(
      readWhenToUse(spec),
      `${file} has no When to use: write it as the first section, right after the intro and its run notes ${TEMPLATE}`,
    ),
    ...missing(
      readForAgents(spec),
      `${file} has no For agents: write it as the last section, with "${NONE_KNOWN}" until an agent makes a mistake with the entry ${TEMPLATE}`,
    ),
    ...missing(
      readDoAndDont(spec),
      `${file} has no Do and don't table: give it one, with the columns ${RULE_COLUMNS.slice(0, -1).join(', ')} and ${RULE_COLUMNS.at(-1)} ${TEMPLATE}`,
    ),
  ]
}

/** The problems of one entry's spec. */
function specProblems(root: string, e: Entry, registry: Entry[], spec: string): Problem[] {
  const table = readDoAndDont(spec)
  const when = readWhenToUse(spec)
  return [
    ...missingProblems(e, spec),
    ...placeProblems(e, spec),
    ...(when ? alternativeProblems(e, registry, when) : []),
    ...(table
      ? [...tableProblems(e, table), ...citationProblems(root, e, table), ...wcagProblems(e, table)]
      : []),
  ]
}

export default {
  rule: RULE,
  run(root) {
    const problems: Problem[] = []
    const registry = readRegistry(root)
    for (const e of registry.filter(isBuilt)) {
      const file = join(root, specPage(e))
      if (existsSync(file))
        problems.push(...specProblems(root, e, registry, readFileSync(file, 'utf8')))
    }
    return problems.sort(byFileLine)
  },
} satisfies Check
