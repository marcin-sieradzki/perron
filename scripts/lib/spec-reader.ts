// A spec read out of its Markdown: its title, the intro above its run notes, its `##` sections,
// the props of each part, its stories, the keys of its Keyboard and ARIA table, and the guidance
// for a caller (When to use, Do and don't, For agents), each with the line a check reports. The
// one owner of the spec's layout (docs/components/TEMPLATE.md): its headings, its run-notes line
// and how its tables read. Node-free, so the docs pages read a spec with it in the browser.
//
// Two rules hold everywhere a spec is read. A line inside fenced code is no heading and no table
// row. And a Props section with a `### <Name>` per part gives each part the table under its own
// heading; a part with no heading of its own, or a section with none, takes the section's first.

/**
 * The line in a spec's intro that starts its run notes: how the spec was made (ADR 0010, the
 * sources, what the prototype gave), for the maintainer. The docs page's intro stops above it.
 */
export const RUN_NOTES = '<!-- run notes -->'

/**
 * The section a docs page shows as part of its intro: when to reach for the entry and what to use
 * instead, so a reader picks the right one early.
 */
export const WHEN_TO_USE = 'When to use'

/**
 * The section no docs page shows: the mistakes agents have made with the entry, which the spec,
 * its Markdown twin and the Perron MCP keep for agents.
 */
export const FOR_AGENTS = 'For agents'

/** The heading of the Do and don't table's section. */
export const DO_AND_DONT = "Do and don't"

/** The heading of the props tables' section. */
export const PROPS = 'Props'

/** The heading of the stories table's section. */
export const STORIES = 'Stories'

/** The heading of the keyboard table's section. */
export const KEYBOARD = 'Keyboard and ARIA'

/** The line When to use holds in place of its table when no other entry comes close. */
export const NO_ALTERNATIVE = 'Nothing else in Perron does this.'

/** The line For agents holds until an agent's mistake is recorded. */
export const NONE_KNOWN = 'None known yet.'

/** The columns of When to use's table, in order. */
export const ALTERNATIVE_COLUMNS = ['Use instead', 'When'] as const

/** The columns of the Do and don't table, in order. */
export const RULE_COLUMNS = ['Rule', 'Level', 'Do', "Don't", 'Checked by'] as const

/** How binding a rule is: a `must` row's Don't is forbidden, a `should` row's needs a reason. */
export const LEVELS = ['must', 'should'] as const

/**
 * What catches a breach of a rule in a caller's code: `types`, the props type, which a
 * `@ts-expect-error` citing the rule proves; `review`, nothing but a review of that code.
 */
export const CHECKED_BY = ['types', 'review'] as const

/** A rule's id: `DD-` and its number, from 1 within the spec. */
export const RULE_ID = /^DD-[1-9]\d*$/

/* Lines, headings and tables: the Markdown a spec is made of */

/** One line of Markdown, with its 1-based number. */
export interface Line {
  text: string
  line: number
  /** It sits in fenced code, its fences included, so it is no heading and no table row */
  fenced?: true
}

/** A heading: its level, its words, its line and its place among the lines. */
interface Heading {
  level: number
  text: string
  line: number
  at: number
}

const FENCE = /^\s*(`{3,}|~{3,})/
const HEADING = /^(#{1,6}) (.+?)\s*$/

/** The lines of `markdown`, each fenced line marked. */
export function linesOf(markdown: string): Line[] {
  let fence = ''
  return markdown.split('\n').map((text, i) => {
    const f = FENCE.exec(text)?.[1]
    if (f && (!fence || f.startsWith(fence))) {
      fence = fence ? '' : f
      return { text, line: i + 1, fenced: true }
    }
    return fence ? { text, line: i + 1, fenced: true } : { text, line: i + 1 }
  })
}

/** The headings among `lines`, outside fenced code. */
function headingsIn(lines: Line[]): Heading[] {
  return lines.flatMap((l, at) => {
    const m = l.fenced ? null : HEADING.exec(l.text)
    return m ? [{ level: m[1].length, text: m[2], line: l.line, at }] : []
  })
}

/** One section: its heading, the heading's line, and the lines under it. */
export interface Section {
  heading: string
  line: number
  body: Line[]
}

/** `lines` split at their headings of `level`: the lines above the first, and each section. */
function splitAt(lines: Line[], level: number) {
  const head: Line[] = []
  const sections: Section[] = []
  const starts = new Map(
    headingsIn(lines)
      .filter((h) => h.level === level)
      .map((h) => [h.at, h] as const),
  )
  lines.forEach((l, at) => {
    const h = starts.get(at)
    if (h) sections.push({ heading: h.text, line: h.line, body: [] })
    else (sections.at(-1)?.body ?? head).push(l)
  })
  return { head, sections }
}

/**
 * The lines under the `##` or `###` heading `heading`, up to the next heading of its level or
 * above; nothing when `markdown` has no such heading.
 */
export function linesUnder(markdown: string, heading: string): Line[] | undefined {
  const lines = linesOf(markdown)
  const headings = headingsIn(lines)
  const start = headings.find((h) => (h.level === 2 || h.level === 3) && h.text === heading)
  if (!start) return undefined
  const end = headings.find((h) => h.at > start.at && h.level <= start.level)
  return lines.slice(start.at + 1, end?.at)
}

/** A section as Markdown, its `##` heading and all, untrimmed. */
export const sectionMarkdown = (s: Section) =>
  [`## ${s.heading}`, ...s.body.map((l) => l.text)].join('\n')

/** One Markdown table: its header's line and cells, and each row's cells and line. */
export interface Table {
  line: number
  columns: string[]
  rows: { cells: string[]; line: number }[]
}

/** A table row's cells, trimmed, with `\|` read as `|`. */
const cells = (row: string) =>
  row
    .split(/(?<!\\)\|/)
    .slice(1, -1)
    .map((c) => c.trim().replaceAll('\\|', '|'))

const DIVIDER = /^\|[\s|:-]+\|$/
const isRow = (l: Line | undefined) => !!l && !l.fenced && l.text.startsWith('|')

/** The tables among `lines`, outside fenced code. */
export function tablesIn(lines: Line[]): Table[] {
  const tables: Table[] = []
  for (let i = 0; i < lines.length; i++) {
    if (!isRow(lines[i]) || !isRow(lines[i + 1]) || !DIVIDER.test(lines[i + 1].text)) continue
    const table: Table = { line: lines[i].line, columns: cells(lines[i].text), rows: [] }
    for (i += 2; i < lines.length && isRow(lines[i]); i++)
      table.rows.push({ cells: cells(lines[i].text), line: lines[i].line })
    tables.push(table)
  }
  return tables
}

/** The code spans of a cell or a line, without their backticks. */
export const codeSpans = (text: string) => [...text.matchAll(/`([^`]+)`/g)].map((m) => m[1])

/** The lines of `lines` outside its tables, joined, with blank lines between paragraphs kept. */
const prose = (lines: Line[]) =>
  lines
    .filter((l) => !isRow(l))
    .map((l) => l.text)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

/* The spec */

/** One prop row of a Props table. */
export interface SpecProp {
  /** The props the row names: `className`, `style` and `ref` share one row */
  names: string[]
  /** Its Type cell, a lone code span as its code */
  type: string
  /** Its Default cell as written */
  default: string
  /** Its default as code: a lone code span's text; nothing for none or for a required prop */
  defaultValue?: string
  /** Its Default cell says `(required)` */
  required: boolean
  description: string
  line: number
}

/** One table of the Props section. */
export interface PropsTable {
  /** The `###` heading it sits under, the part it gives the props of; none above the first */
  part?: string
  line: number
  /** Its header's cells */
  columns: string[]
  rows: SpecProp[]
}

/** A story of the Stories table: the code span its row starts with. */
export interface Story {
  name: string
  line: number
}

/** A key of the Keyboard and ARIA table, which a `play` test presses. */
export interface Key {
  key: string
  line: number
}

/** An entry When to use names: the link's words and target, and when to use it. */
export interface Alternative {
  /** The link's words, the entry's name; empty when the cell is no lone link */
  name: string
  /** Where the link goes, from the spec's folder */
  href: string
  /** The first cell as written */
  cell: string
  when: string
  line: number
}

export interface WhenToUse {
  /** The heading's line */
  line: number
  /** When to reach for the entry: the section's prose, less the no-alternative line */
  text: string
  /** Its table, when it has one */
  table?: Table
  alternatives: Alternative[]
  /** It says no other entry comes close, in the no-alternative line */
  none: boolean
}

/** One rule of the Do and don't table, its cells by their columns. */
export interface Rule {
  id: string
  level: string
  do: string
  dont: string
  checkedBy: string
  line: number
}

export interface DoAndDont {
  /** Its table's header line */
  line: number
  columns: string[]
  /** Every row, each as one line of text, for what holds of any row */
  rows: { text: string; line: number }[]
  /** The rules, read by the five columns; none when the table lacks them */
  rules: Rule[]
}

export interface ForAgents {
  line: number
  /** Each mistake and its fix, one bullet each; none for "None known yet." */
  notes: string[]
  /** It is "None known yet." or a bulleted list, and nothing else */
  wellFormed: boolean
}

/** A spec, read. */
export interface Spec {
  /** The `#` heading's words */
  title?: string
  /** What the entry is for: the text between the title and the first `##`, above the run notes */
  intro: string
  /** The `##` sections, in order */
  sections: Section[]
  /** The tables of the Props section, in order; none without the section */
  props?: PropsTable[]
  /** The stories of the Stories table; none without the section */
  stories?: Story[]
  /** The keys of the Keyboard and ARIA table, less the rows that say why they are untested */
  keys: Key[]
  whenToUse?: WhenToUse
  doAndDont?: DoAndDont
  forAgents?: ForAgents
}

/** A Default cell as code: a lone code span's text; nothing for none or for a required prop. */
export function defaultOf(cell: string) {
  const plain = /^`[^`]+`$/.test(cell.trim()) ? cell.trim().slice(1, -1) : cell.trim()
  return /^(none|\(required\)|—|-)?$/i.test(plain) ? undefined : plain
}

/** A cell that is one code span, as its code; any other cell, such as Base UI's `render`, whole. */
const unquote = (s: string) => (/^`[^`]*`$/.test(s) ? s.slice(1, -1) : s)

/** A table of the Props section, its rows read by the header's names. */
function propsTable(table: Table, part: string | undefined): PropsTable {
  const columns = table.columns.map((c) => c.toLowerCase())
  // a table of a part's fields, such as `Field | Type | Description`, names them in its first column
  const nameAt = Math.max(columns.indexOf('name'), 0)
  const rows = table.rows.map(({ cells: row, line }): SpecProp => {
    const cell = (name: string) => (columns.includes(name) ? row[columns.indexOf(name)] : '') ?? ''
    const nameCell = row[nameAt] ?? ''
    const named = codeSpans(nameCell)
    const fallback = defaultOf(cell('default'))
    return {
      names: named.length ? named : nameCell.split(/,\s*/).filter(Boolean),
      type: unquote(cell('type')),
      default: cell('default'),
      ...(fallback !== undefined && { defaultValue: fallback }),
      required: /\(required\)/i.test(cell('default')),
      description: cell('description'),
      line,
    }
  })
  return { ...(part !== undefined && { part }), line: table.line, columns: table.columns, rows }
}

/** The tables of the Props section, each with the `###` part it sits under. */
function readProps(s: Section): PropsTable[] {
  const { head, sections } = splitAt(s.body, 3)
  return [
    ...tablesIn(head).map((t) => propsTable(t, undefined)),
    ...sections.flatMap((sub) => tablesIn(sub.body).map((t) => propsTable(t, sub.heading))),
  ]
}

/**
 * The props table of the part `name`: the table under `### <name>` in the Props section when the
 * section has one, otherwise the section's first table; nothing when the spec has neither.
 */
export function propsOf(spec: Spec, name: string): PropsTable | undefined {
  return spec.props?.find((t) => t.part === name) ?? spec.props?.[0]
}

/** Each story of the Stories table, by the code span that starts its row. */
const readStories = (s: Section): Story[] =>
  tablesIn(s.body).flatMap((t) =>
    t.rows.flatMap(({ cells: [first = ''], line }) => {
      const name = /^`([^`]+)`/.exec(first)?.[1]
      return name ? [{ name, line }] : []
    }),
  )

/**
 * A row that says why no `play` test can press its keys, such as Tab after a press on the
 * backdrop, which user-event cannot reproduce: `Untested: <reason>` in its cell.
 */
const UNTESTED = /\bUntested: \S/

/**
 * Each key of the Keyboard and ARIA section's first table: a code span starting a row, such as
 * `Enter` or `Shift+Tab`. A row of words, such as "Typing", names no key, and an
 * `Untested: <reason>` row is left out.
 */
function readKeys(s: Section): Key[] {
  const [table] = tablesIn(s.body)
  return (table?.rows ?? []).flatMap(({ cells: row, line }) => {
    if (row.some((c) => UNTESTED.test(c))) return []
    // the keys a row starts with, `Enter`, `Space`, before the words after them
    const keyList = /^((?:`[^`]+`(?:,\s*)?)+)/.exec(row[0] ?? '')?.[1] ?? ''
    return codeSpans(keyList)
      .filter((key) => /^[A-Z][\w+]*$/.test(key))
      .map((key) => ({ key, line }))
  })
}

const LINK = /^\[([^\]]+)\]\(([^)\s]+)\)$/

function readWhenToUse(s: Section): WhenToUse {
  const table = tablesIn(s.body)[0]
  const text = prose(s.body)
  const none = text.split('\n').some((l) => l.trim() === NO_ALTERNATIVE)
  const alternatives = (table?.rows ?? []).map(({ cells: [cell = '', when = ''], line }) => {
    const [, name = '', href = ''] = LINK.exec(cell) ?? []
    return { name, href, cell, when, line }
  })
  return {
    line: s.line,
    text: text
      .split('\n')
      .filter((l) => l.trim() !== NO_ALTERNATIVE)
      .join('\n')
      .trim(),
    table,
    alternatives,
    none,
  }
}

/** Whether `columns` are the five of the Do and don't table, in order. */
export const hasRuleColumns = (columns: string[]) =>
  columns.length === RULE_COLUMNS.length && RULE_COLUMNS.every((c, i) => columns[i] === c)

function readDoAndDont(s: Section): DoAndDont | undefined {
  const table = tablesIn(s.body)[0]
  if (!table) return undefined
  return {
    line: table.line,
    columns: table.columns,
    rows: table.rows.map((r) => ({ text: r.cells.join(' | '), line: r.line })),
    rules: hasRuleColumns(table.columns)
      ? table.rows.map(
          ({ cells: [id = '', level = '', d = '', dont = '', checkedBy = ''], line }) => ({
            id,
            level,
            do: d,
            dont,
            checkedBy,
            line,
          }),
        )
      : [],
  }
}

function readForAgents(s: Section): ForAgents {
  const lines = s.body.map((l) => l.text).filter((t) => t.trim())
  if (lines.length === 1 && lines[0].trim() === NONE_KNOWN)
    return { line: s.line, notes: [], wellFormed: true }
  const notes: string[] = []
  let wellFormed = lines.length > 0
  for (const text of lines) {
    if (text.startsWith('- ')) notes.push(text.slice(2).trim())
    else if (/^\s+\S/.test(text) && notes.length) notes[notes.length - 1] += ` ${text.trim()}`
    else wellFormed = false
  }
  return { line: s.line, notes, wellFormed }
}

/** A spec's Markdown, read. */
export function readSpec(markdown: string): Spec {
  const { head, sections } = splitAt(linesOf(markdown), 2)
  const title = headingsIn(head).find((h) => h.level === 1)
  const intro = head
    .filter((l) => l.line !== title?.line)
    .map((l) => l.text)
    .join('\n')
    .split(RUN_NOTES)[0]
    .trim()
  const find = (heading: string) => sections.find((s) => s.heading === heading)
  const props = find(PROPS)
  const stories = find(STORIES)
  const keyboard = find(KEYBOARD)
  const when = find(WHEN_TO_USE)
  const rules = find(DO_AND_DONT)
  const agents = find(FOR_AGENTS)
  return {
    ...(title && { title: title.text }),
    intro,
    sections,
    ...(props && { props: readProps(props) }),
    ...(stories && { stories: readStories(stories) }),
    keys: keyboard ? readKeys(keyboard) : [],
    ...(when && { whenToUse: readWhenToUse(when) }),
    ...(rules && { doAndDont: readDoAndDont(rules) }),
    ...(agents && { forAgents: readForAgents(agents) }),
  }
}

/**
 * Prose from a spec for a docs page: `'intro'` gives what the entry is for, above the run notes,
 * then its When to use, heading and all; a list of headings gives those sections, each with its
 * `##` heading, in the order asked. Throws on a heading the spec has no section for.
 */
export function specProse(markdown: string, which: 'intro' | string[]) {
  const spec = readSpec(markdown)
  const section = (heading: string) => {
    const s = spec.sections.find((x) => x.heading === heading)
    return s && sectionMarkdown(s).trim()
  }
  if (which === 'intro') return [spec.intro, section(WHEN_TO_USE)].filter(Boolean).join('\n\n')
  return which
    .map((heading) => {
      const s = section(heading)
      if (!s) throw new Error(`The spec has no "## ${heading}" section`)
      return s
    })
    .join('\n\n')
}
