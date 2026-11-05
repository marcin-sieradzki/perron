// A spec's guidance for a caller, read out of its Markdown: When to use, which says when to reach
// for the entry and which entries to use instead; the rules of its Do and don't table, each with
// its id, its level and what checks it; and For agents, the mistakes agents have made with it. The
// `usage` gate checks them (scripts/checks/usage.ts), and the layout is the spec template's
// (docs/components/TEMPLATE.md). Node-free, so the docs pages split a spec with it in the browser.

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

/**
 * A type test that proves a `types` rule: a `@ts-expect-error` comment whose text starts with the
 * rule's id, `// @ts-expect-error DD-2: <what the line breaks>`, or `{/* … *\/}` in JSX.
 */
const CITATION = /(?:\/\/|\/\*)\s*@ts-expect-error\s+(DD-\d+)\b/

/** The rule each line of `code` cites in a `@ts-expect-error`, with the line. */
export const citations = (code: string) =>
  code.split('\n').flatMap((text, i) => {
    const id = CITATION.exec(text)?.[1]
    return id ? [{ id, line: i + 1 }] : []
  })

/** The files of an entry's folder that can hold its type tests: its tests and its stories. */
export const TYPE_TEST_FILE = /\.(test|stories)\.tsx?$/

/** One line of a spec, with its 1-based number. */
export interface Line {
  text: string
  line: number
}

/** One `##` section: its heading, the heading's line, and the lines under it. */
export interface Section {
  heading: string
  line: number
  body: Line[]
}

/** One Markdown table: its header's line and cells, and each row's cells and line. */
export interface Table {
  line: number
  columns: string[]
  rows: { cells: string[]; line: number }[]
}

/** A spec split at its `##` headings: the lines above the first, and each section in order. */
export function splitSections(spec: string): { head: Line[]; sections: Section[] } {
  const head: Line[] = []
  const sections: Section[] = []
  spec.split('\n').forEach((text, i) => {
    const heading = /^## (.+?)\s*$/.exec(text)?.[1]
    if (heading) sections.push({ heading, line: i + 1, body: [] })
    else (sections.at(-1)?.body ?? head).push({ text, line: i + 1 })
  })
  return { head, sections }
}

/** The `##` sections of a spec, in order. */
export const sectionsOf = (spec: string) => splitSections(spec).sections

/** A section as Markdown, its `##` heading and all, untrimmed. */
export const sectionMarkdown = (s: Section) =>
  [`## ${s.heading}`, ...s.body.map((l) => l.text)].join('\n')

/** A table row's cells, trimmed, with `\|` read as `|`. */
const cells = (row: string) =>
  row
    .split(/(?<!\\)\|/)
    .slice(1, -1)
    .map((c) => c.trim().replaceAll('\\|', '|'))

const DIVIDER = /^\|[\s|:-]+\|$/

/** The tables among `lines`. */
export function tablesIn(lines: Line[]): Table[] {
  const tables: Table[] = []
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].text.startsWith('|') || !DIVIDER.test(lines[i + 1]?.text ?? '')) continue
    const table: Table = { line: lines[i].line, columns: cells(lines[i].text), rows: [] }
    for (i += 2; i < lines.length && lines[i].text.startsWith('|'); i++)
      table.rows.push({ cells: cells(lines[i].text), line: lines[i].line })
    tables.push(table)
  }
  return tables
}

/** The lines of `lines` outside its tables, joined, with blank lines between paragraphs kept. */
const prose = (lines: Line[]) =>
  lines
    .filter((l) => !l.text.startsWith('|'))
    .map((l) => l.text)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

const section = (spec: string, heading: string) =>
  sectionsOf(spec).find((s) => s.heading === heading)

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

const LINK = /^\[([^\]]+)\]\(([^)\s]+)\)$/

/** The spec's When to use, or nothing when it has none yet. */
export function readWhenToUse(spec: string): WhenToUse | undefined {
  const s = section(spec, WHEN_TO_USE)
  if (!s) return undefined
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

/** Whether `columns` are the five of a moved table, in order. */
export const hasRuleColumns = (columns: string[]) =>
  columns.length === RULE_COLUMNS.length && RULE_COLUMNS.every((c, i) => columns[i] === c)

/** The table of the spec's Do and don't, or nothing when it has none. */
export function readDoAndDont(spec: string): DoAndDont | undefined {
  const s = section(spec, DO_AND_DONT)
  const table = s && tablesIn(s.body)[0]
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

export interface ForAgents {
  line: number
  /** Each mistake and its fix, one bullet each; none for "None known yet." */
  notes: string[]
  /** It is "None known yet." or a bulleted list, and nothing else */
  wellFormed: boolean
}

/** The spec's For agents, or nothing when it has none yet. */
export function readForAgents(spec: string): ForAgents | undefined {
  const s = section(spec, FOR_AGENTS)
  if (!s) return undefined
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
