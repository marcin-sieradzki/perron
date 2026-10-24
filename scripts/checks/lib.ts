// What every check in this folder shares: the problem it reports, and the in-place
// `perron-allow(<rule>): reason` comment that excuses one line.
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

const ALLOW = /perron-allow\(([\w-]+)\)(?::\s*(.*?))?\s*(?:\*\/|-->|$)/g

/**
 * The lines of `text` that `rule` is excused on: a `perron-allow(<rule>): reason` comment excuses
 * its own line and the line below it. An allowance with no reason excuses nothing and is a problem
 * of its own.
 */
export function allowances(text: string, rule: string, file: string) {
  const lines = new Set<number>()
  const problems: Problem[] = []
  text.split('\n').forEach((source, i) => {
    for (const m of source.matchAll(ALLOW)) {
      if (m[1] !== rule) continue
      if (!m[2]?.trim()) {
        problems.push({ file, line: i + 1, message: `perron-allow(${rule}) needs a reason` })
        continue
      }
      lines.add(i + 1)
      lines.add(i + 2)
    }
  })
  return { lines, problems }
}

/** Drops the problems that an allowance in their file excuses, adding any reason-less allowance. */
export function excuse(problems: Problem[], rule: string, read: (file: string) => string) {
  const byFile = new Map<string, ReturnType<typeof allowances>>()
  const of = (file: string) => {
    if (!byFile.has(file)) byFile.set(file, allowances(read(file), rule, file))
    return byFile.get(file)!
  }
  const kept = problems.filter((p) => p.line === undefined || !of(p.file).lines.has(p.line))
  return [...kept, ...[...byFile.values()].flatMap((a) => a.problems)]
}

/** Every file under `dir` (from `root`) whose name passes `test`, as paths from `root`. */
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

/** `file:line: message` lines, for the terminal. */
export const format = (rule: string, problems: Problem[]) =>
  problems.map((p) => `${p.file}${p.line ? `:${p.line}` : ''}: [${rule}] ${p.message}`)
