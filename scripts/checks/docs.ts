// The `docs` rule: every registered component or pattern has its spec page from `building` on,
// and its Storybook docs page, `<Name>.mdx` beside its code, from `stable` on: the component-docs
// skill writes that page once review passes, and the entry turns stable in the same PR
// (docs/components/README.md, "Files"). And the docgen that page's props table reads finds the
// component, with its props, in its code from `building` on, so a build cannot hand the docs stage
// an empty table. The spec's Props table and that table give the same props: a row for every member
// of `<Name>Props`, those it inherits from Base UI included, and a member for every row (a
// `slotProps.<part>` row is the `slotProps` member's). Each prop the spec gives a default shows that
// default in the table too, from a destructuring default or the member's JSDoc `@default`, such as
// "The locale's" for an owned-string prop, so the docs stage never meets a row or a Default cell the
// brief or the build could have settled. The spec's Stories table and the stories file name the
// same stories, one row per export, so the story the contract story renders (its `Default`, or its
// alphabetically first) is one the spec describes. An overlay, a component with `open` and
// `defaultOpen`, opens by `defaultOpen` in its stories (the contract's Stories), since the docs page
// shows each story's first render. The intro the docs page shows holds no run notes: what the spec
// rests on, such as ADR 0010, sits below the intro's `<!-- run notes -->` line. A missing file or
// table has no line to excuse, so this rule takes no perron-allow. Nor does a prop's type name a
// type the component's file keeps to itself, which the page would show and the reader can't find.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { RUN_NOTES, specProse } from '../../storybook/blocks/component-page.ts'
import {
  componentDocs,
  docgenProgram,
  type ComponentDoc,
  type DocgenProgram,
} from '../lib/docgen.ts'
import { PACKAGE } from '../lib/paths.ts'
import { codeFile } from '../lib/props.ts'
import { folderOf, isBuilt, readRegistry, specPage, type Entry } from '../lib/registry.ts'
import { byFileLine, codeSpans, type Check, type Problem } from './lib.ts'

const RULE = 'docs'

/** An entry's stories file, by path from the repo root. */
const storiesFile = (e: Entry) =>
  `${PACKAGE}/src/${folderOf(e.layer)}/${e.name}/${e.name}.stories.tsx`

/** An entry's docs page, by path from the repo root. */
const docsPage = (e: Entry) => `${PACKAGE}/src/${folderOf(e.layer)}/${e.name}/${e.name}.mdx`

/** The statuses that need the docs page: the entry's docs stage is done. */
const DOCUMENTED = new Set(['stable', 'deprecated'])

/** The docs page's docgen of `e`, read out of its code, through `shared` when given. */
function docOf(root: string, e: Entry, shared?: DocgenProgram) {
  const file = join(root, codeFile(e))
  return componentDocs(readFileSync(file, 'utf8'), file, shared).find(
    (d) => d.actualName === e.name,
  )
}

/** A Default cell as the props table would show it: a lone code span's text; nothing for none. */
function specDefault(cell: string) {
  const plain = /^`[^`]+`$/.test(cell) ? codeSpans(cell)[0] : cell
  return /^(none|\(required\)|—|-)?$/i.test(plain.trim()) ? '' : plain.trim()
}

/** One row of a spec's Props table: the props it names, its line and its default. */
interface SpecRow {
  names: string[]
  line: number
  default: string
}

/**
 * The rows of a spec's Props table, each with the props its Name cell names, its line, and its
 * default as the props table would show it; nothing when the spec has no such table.
 */
function propsRows(spec: string): SpecRow[] | undefined {
  const lines = spec.split('\n')
  const start = lines.findIndex((l) => /^## Props\s*$/.test(l))
  if (start < 0) return undefined
  const head = lines.findIndex((l, i) => i > start && l.startsWith('|'))
  if (head < 0 || lines.slice(start + 1, head).some((l) => l.startsWith('## '))) return undefined
  const cells = (l: string) =>
    l
      .split(/(?<!\\)\|/)
      .slice(1, -1)
      .map((c) => c.trim().replaceAll('\\|', '|'))
  const column = cells(lines[head]).indexOf('Default')
  if (column < 0) return undefined
  const rows: SpecRow[] = []
  for (let i = head + 2; i < lines.length && lines[i].startsWith('|'); i++) {
    const row = cells(lines[i])
    const names = codeSpans(row[0] ?? '')
    if (names.length) rows.push({ names, line: i + 1, default: specDefault(row[column] ?? '') })
  }
  return rows
}

/** The member of `<Name>Props` a Name cell's prop is: `slotProps.icon` is `slotProps`. */
const memberOf = (name: string) => name.split('.')[0]

/** Each row with no member behind it, and each member with no row. */
function rowProblems(e: Entry, doc: ComponentDoc, rows: SpecRow[]): Problem[] {
  const members = Object.keys(doc.props ?? {})
  const named = new Set(rows.flatMap((r) => r.names.map(memberOf)))
  const missing = members
    .filter((m) => !named.has(m))
    .map((m) => ({
      file: specPage(e),
      message: `${e.name}'s docs page would show ${m}, which ${specPage(e)}'s Props table has no row for: give it a row, as for every member of ${e.name}Props, those inherited from Base UI and React's \`className\`, \`style\` and \`ref\` included, which the component does not declare again`,
    }))
  const extra = rows.flatMap((r) =>
    r.names
      .filter((n) => !members.includes(memberOf(n)))
      .map((n) => ({
        file: specPage(e),
        line: r.line,
        message: `${n} is a row of ${specPage(e)}'s Props table but no member of ${e.name}Props, so the docs page would leave it out: give ${e.name}Props the member, or take the row out`,
      })),
  )
  return [...missing, ...extra]
}

/** Each prop whose default the docs page would show otherwise than the spec gives it. */
function defaultProblems(e: Entry, doc: ComponentDoc, rows: SpecRow[]): Problem[] {
  return rows.flatMap(({ names, line, default: want }) => {
    if (names.length !== 1) return []
    const prop = names[0]
    const got = String(doc.props?.[prop]?.defaultValue?.value ?? '').trim()
    if (!doc.props?.[prop] || !want || got === want) return []
    return {
      file: codeFile(e),
      message: `${e.name}'s docs page would show ${got ? `"${got}"` : 'no default'} for ${prop}, where ${specPage(e)}:${line} gives "${want}": give it as the destructuring default or as \`@default ${want}\` in its JSDoc`,
    }
  })
}

/** Each story of the spec's Stories table, by the code span that starts its row, with its line. */
function storyRows(spec: string) {
  const lines = spec.split('\n')
  const start = lines.findIndex((l) => /^## Stories\s*$/.test(l))
  if (start < 0) return undefined
  const rows: { name: string; line: number }[] = []
  for (let i = start + 1; i < lines.length && !lines[i].startsWith('## '); i++) {
    const name = /^\|\s*`([^`]+)`/.exec(lines[i])?.[1]
    if (name) rows.push({ name, line: i + 1 })
  }
  return rows
}

/** Each story the stories file exports with no row in the spec's Stories table, and each row it does not export. */
function storyProblems(root: string, e: Entry): Problem[] {
  const spec = join(root, specPage(e))
  const file = join(root, storiesFile(e))
  if (!existsSync(spec) || !existsSync(file)) return []
  const rows = storyRows(readFileSync(spec, 'utf8'))
  if (!rows) return []
  const exported = [...readFileSync(file, 'utf8').matchAll(/^export const (\w+)/gm)].map(
    (m) => m[1],
  )
  const named = new Set(rows.map((r) => r.name))
  return [
    ...exported
      .filter((s) => !named.has(s))
      .map((s) => ({
        file: specPage(e),
        message: `${storiesFile(e)} exports the story ${s}, which ${specPage(e)}'s Stories table has no row for: give it a row, or take the story out`,
      })),
    ...rows
      .filter((r) => !exported.includes(r.name))
      .map((r) => ({
        file: specPage(e),
        line: r.line,
        message: `${r.name} is a row of ${specPage(e)}'s Stories table but no story ${storiesFile(e)} exports: export it under that name, or take the row out`,
      })),
  ]
}

/** A key the spec's Keyboard table names, as a `play` test presses it with `userEvent`. */
const PRESSES: Record<string, RegExp> = {
  Tab: /userEvent\.tab\(|\{Tab\}|\[Tab\]/,
  'Shift+Tab': /tab\(\s*\{\s*shift:\s*true|\{Shift>\}\{Tab\}|\{\/?Shift\}/,
  Space: /\[Space\]|\{ \}|keyboard\(\s*(['"`]) \1/,
}
const pressOf = (key: string) =>
  PRESSES[key] ?? new RegExp(`[{[]${key.replace(/[+]/g, '\\+')}[}\\]]`)

/**
 * Each key of the spec's Keyboard table, a code span starting a row of its first table, such as
 * `Enter` or `Shift+Tab`, with its line: the keys a `play` test presses. A row of words, such as
 * "Typing" or "A press on the label", names no key.
 */
function keyboardRows(spec: string) {
  const lines = spec.split('\n')
  const start = lines.findIndex((l) => /^## Keyboard/.test(l))
  if (start < 0) return []
  const keys: { key: string; line: number }[] = []
  let seen = false
  for (let i = start + 1; i < lines.length && !lines[i].startsWith('## '); i++) {
    if (!lines[i].startsWith('|')) {
      if (seen) break
      continue
    }
    seen = true
    const first = lines[i].split('|')[1] ?? ''
    // the keys a row starts with, `Enter`, `Space`, before the words after them
    const keyList = /^\s*((?:`[^`]+`(?:,\s*)?)+)/.exec(first)?.[1] ?? ''
    for (const [, key] of keyList.matchAll(/`([^`]+)`/g))
      if (/^[A-Z][\w+]*$/.test(key)) keys.push({ key, line: i + 1 })
  }
  return keys
}

/**
 * Each key of the spec's Keyboard table that no `play` test in the stories file presses, for an
 * entry still `building`: the loop's build and review hold to it, and a stable entry catches up
 * in a change of its own.
 */
function keyboardProblems(root: string, e: Entry): Problem[] {
  if (e.status !== 'building') return []
  const spec = join(root, specPage(e))
  const file = join(root, storiesFile(e))
  if (!existsSync(spec) || !existsSync(file)) return []
  const stories = readFileSync(file, 'utf8')
  return keyboardRows(readFileSync(spec, 'utf8'))
    .filter(({ key }) => !pressOf(key).test(stories))
    .map(({ key, line }) => ({
      file: specPage(e),
      line,
      message: `${specPage(e)}'s Keyboard table names \`${key}\`, which no play test in ${storiesFile(e)} presses: give the story that shows it a step that presses it and checks what it does`,
    }))
}

/** Each member whose type the docs page would show as `unknown`, where docgen could not read it. */
function unknownTypes(e: Entry, doc: ComponentDoc): Problem[] {
  return Object.entries(doc.props ?? {})
    .filter(([, p]) => p.tsType?.name === 'unknown' && !/^unknown\b/.test(p.tsType.raw ?? ''))
    .map(([name]) => ({
      file: codeFile(e),
      message: `${e.name}'s docs page would show the type of ${name} as unknown: docgen cannot read the type as written; write it another way, such as ReadonlyArray<T> for readonly T[]`,
    }))
}

/** The names of the types a component's file declares for itself, unexported: `type ChangeDetails = …`. */
const localTypes = (code: string) =>
  [...code.matchAll(/^(?:type|interface)\s+([A-Z]\w*)\b/gm)].map((m) => m[1])

/**
 * Each member whose type, as the docs page shows it, names a type the component's file keeps to
 * itself, such as `ChangeDetails`, which a reader can't look up: the page shows the type as
 * written, so it is written with the public name, `Tooltip.Root.ChangeEventDetails`.
 */
function privateTypes(root: string, e: Entry, doc: ComponentDoc): Problem[] {
  const names = localTypes(readFileSync(join(root, codeFile(e)), 'utf8'))
  return Object.entries(doc.props ?? {}).flatMap(([prop, p]) => {
    const type = p.tsType as { raw?: string; name?: string } | undefined
    const shown = type?.raw ?? type?.name ?? ''
    const name = names.find((n) => new RegExp(`\\b${n}\\b`).test(shown))
    if (!name) return []
    return {
      file: codeFile(e),
      message: `${e.name}'s docs page would show the type of ${prop} with ${name}, a type its file keeps to itself, which the reader can't look up: write the type it stands for, by Base UI's or Perron's public name`,
    }
  })
}

/** A story that sets `defaultOpen`: `defaultOpen: true` in args, or the JSX attribute. */
const OPENS = /\bdefaultOpen(\s*:\s*true\b|\s*=\s*\{\s*true\s*\}|(?=[\s/>]))/

/** An overlay whose stories never open it by `defaultOpen`, so its docs page shows it closed. */
function overlayProblems(root: string, e: Entry, doc: ComponentDoc): Problem[] {
  const props = doc.props ?? {}
  const file = join(root, storiesFile(e))
  if (!props.open || !props.defaultOpen || !existsSync(file)) return []
  const code = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
  if (OPENS.test(code)) return []
  return [
    {
      file: storiesFile(e),
      message: `${e.name} is an overlay, with open and defaultOpen, but no story opens it by defaultOpen, so its docs page and the visual stage show it closed: open each story by defaultOpen beside the trigger that opens it again (the contract's Stories), and give ${specPage(e)}'s Stories rows the same`,
    },
  ]
}

/** Words in the intro the docs page shows that belong to the run notes. */
const RUN_NOTE_WORDS = /\bADR \d{4}\b|docs\/adr\/|\bread-back\b|\bcode map\b/

/** A spec whose intro, as the docs page shows it, holds the notes on how the spec was made. */
function introProblems(root: string, e: Entry): Problem[] {
  const spec = join(root, specPage(e))
  if (!existsSync(spec)) return []
  const text = readFileSync(spec, 'utf8')
  const word = RUN_NOTE_WORDS.exec(specProse(text, 'intro'))?.[0]
  if (!word) return []
  const line = text.split('\n').findIndex((l) => l.includes(word)) + 1
  return [
    {
      file: specPage(e),
      line,
      message: `${e.name}'s docs page would open with run notes ("${word}"): move how the spec was made below a \`${RUN_NOTES}\` line after the intro's sentence (docs/components/TEMPLATE.md)`,
    },
  ]
}

/** Where the spec's Props table and the docs page's would differ. */
function tableProblems(root: string, e: Entry, doc: ComponentDoc): Problem[] {
  const spec = join(root, specPage(e))
  const rows = existsSync(spec) ? propsRows(readFileSync(spec, 'utf8')) : undefined
  return rows ? [...rowProblems(e, doc, rows), ...defaultProblems(e, doc, rows)] : []
}

export default {
  rule: RULE,
  run(root) {
    const problems: Problem[] = []
    const missing = (rel: string) => !existsSync(join(root, rel))
    const built = readRegistry(root).filter(isBuilt)
    // one compiler program for every component's code, not one each
    const shared = docgenProgram(
      built.map((e) => join(root, codeFile(e))).filter((f) => existsSync(f)),
    )
    for (const e of built) {
      if (missing(specPage(e)))
        problems.push({
          file: specPage(e),
          message: `${e.name} is ${e.status} and has no spec page; copy docs/components/TEMPLATE.md`,
        })
      const doc = missing(codeFile(e)) ? undefined : docOf(root, e, shared)
      if (!missing(codeFile(e)) && !Object.keys(doc?.props ?? {}).length)
        problems.push({
          file: codeFile(e),
          message: `${e.name}'s docs page would show no props: its docgen finds no exported function component ${e.name} taking ${e.name}Props`,
        })
      if (doc)
        problems.push(
          ...tableProblems(root, e, doc),
          ...unknownTypes(e, doc),
          ...overlayProblems(root, e, doc),
          ...privateTypes(root, e, doc),
        )
      problems.push(
        ...storyProblems(root, e),
        ...introProblems(root, e),
        ...keyboardProblems(root, e),
      )
      if (DOCUMENTED.has(e.status) && missing(docsPage(e)))
        problems.push({
          file: docsPage(e),
          message: `${e.name} is ${e.status} and has no docs page; the component-docs skill writes it`,
        })
    }
    return problems.sort(byFileLine)
  },
} satisfies Check
