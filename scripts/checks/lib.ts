// What every check in this folder shares: the problem it reports, the order it reports them in,
// the in-place `perron-allow(<rule>): reason` comment that excuses one line, and the readers of the
// contract (docs/components/README.md), whose tables and lists the checks take their rules from.
import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

/** One breach of a rule, at a file and line. */
export interface Problem {
  /** Path from the repo root */
  file: string
  /** 1-based, when the problem has a place in the file */
  line?: number
  message: string
}

/** A check: one rule of the contract, run over the tree at `root`. */
export interface Check {
  /** The rule id, as `perron-allow(<rule>)` names it */
  rule: string
  run(root: string): Problem[] | Promise<Problem[]>
}

/** The order every check reports in: by file, then by line. */
export const byFileLine = (a: Problem, b: Problem) =>
  (a.file < b.file ? -1 : a.file > b.file ? 1 : 0) || (a.line ?? 0) - (b.line ?? 0)

/** The contract, by path from the repo root. */
export const CONTRACT = 'docs/components/README.md'

/** The skills copied unchanged from upstream, which name upstream's paths and rules. */
export const VENDORED = [
  '.claude/skills/writing-for-agents/',
  '.claude/skills/software-factory/',
  '.claude/skills/vercel-react-best-practices/',
]

const ALLOW = /perron-allow\(([\w-]+)\)(?::\s*(.*?))?\s*(?:\*\/|-->|$)/g

/** Each `perron-allow(<rule>): reason` in `text`: its 1-based line, its rule and its reason. */
function allowsIn(text: string) {
  return text
    .split('\n')
    .flatMap((source, i) =>
      [...source.matchAll(ALLOW)].map((m) => ({ line: i + 1, rule: m[1], reason: m[2]?.trim() })),
    )
}

/**
 * The lines of `text` that `rule` is excused on: a `perron-allow(<rule>): reason` comment excuses
 * its own line and the line below it. An allowance with no reason excuses nothing.
 */
export function allowances(text: string, rule: string) {
  const lines = new Set<number>()
  for (const a of allowsIn(text))
    if (a.rule === rule && a.reason) {
      lines.add(a.line)
      lines.add(a.line + 1)
    }
  return lines
}

/** Drops the problems that an allowance in their file excuses. */
export function excuse(problems: Problem[], rule: string, read: (file: string) => string) {
  const byFile = new Map<string, Set<number>>()
  const excused = (file: string) => {
    if (!byFile.has(file)) byFile.set(file, allowances(read(file), rule))
    return byFile.get(file)!
  }
  return problems.filter((p) => p.line === undefined || !excused(p.file).has(p.line))
}

/** Each allowance in `text` that names no rule of `rules` or gives no reason, which the harness reports. */
export function allowanceProblems(text: string, file: string, rules: string[]): Problem[] {
  return allowsIn(text).flatMap(({ line, rule, reason }): Problem[] => {
    if (!rules.includes(rule))
      return [
        {
          file,
          line,
          message: `perron-allow(${rule}) names no rule; the rules are ${rules.join(', ')}`,
        },
      ]
    if (!reason) return [{ file, line, message: `perron-allow(${rule}) needs a reason` }]
    return []
  })
}

/** Every file under `dir` (from `root`) whose name passes `test`, as paths from `root`; none if `dir` is missing. */
export function walk(root: string, dir: string, test: (name: string) => boolean): string[] {
  const out: string[] = []
  const visit = (abs: string) => {
    let names: string[]
    try {
      names = readdirSync(abs)
    } catch {
      return
    }
    for (const name of names) {
      if (name === 'node_modules' || name === 'dist' || name === 'fixtures') continue
      const path = join(abs, name)
      if (statSync(path).isDirectory()) visit(path)
      else if (test(name)) out.push(relative(root, path))
    }
  }
  visit(join(root, dir))
  return out.sort()
}

/**
 * The text under the heading `heading` (`## <heading>` or `### <heading>`), up to the next heading
 * of the same level or higher. Throws when the contract has no such heading, so a renamed section
 * fails the check that reads it.
 */
export function section(markdown: string, heading: string) {
  const lines = markdown.split('\n')
  const start = lines.findIndex((l) => new RegExp(`^#{2,3} ${heading}\\s*$`).test(l))
  if (start < 0) throw new Error(`${CONTRACT} has no "${heading}" heading`)
  const level = /^#+/.exec(lines[start])![0].length
  const end = lines.findIndex(
    (l, i) => i > start && /^#+ /.test(l) && /^#+/.exec(l)![0].length <= level,
  )
  return lines.slice(start + 1, end < 0 ? undefined : end).join('\n')
}

/** The body rows of the first table in `markdown`, each as its trimmed cells, with `\|` read as `|`. */
export function tableRows(markdown: string): string[][] {
  const lines = markdown.split('\n')
  const head = lines.findIndex(
    (l, i) => l.startsWith('|') && /^\|[\s|:-]+\|$/.test(lines[i + 1] ?? ''),
  )
  const rows: string[][] = []
  if (head < 0) return rows
  for (let i = head + 2; i < lines.length && lines[i].startsWith('|'); i++)
    rows.push(
      lines[i]
        .split(/(?<!\\)\|/)
        .slice(1, -1)
        .map((cell) => cell.trim().replaceAll('\\|', '|')),
    )
  return rows
}

/** The code spans of a cell or a line, without their backticks. */
export const codeSpans = (text: string) => [...text.matchAll(/`([^`]+)`/g)].map((m) => m[1])

/** `file:line: message` lines, for the terminal. */
export const format = (rule: string, problems: Problem[]) =>
  problems.map((p) => `${p.file}${p.line ? `:${p.line}` : ''}: [${rule}] ${p.message}`)
