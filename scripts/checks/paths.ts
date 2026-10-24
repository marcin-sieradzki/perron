// The `paths` rule: every repo path a doc or skill names exists. It reads the Markdown that people
// and agents follow: docs/**, CLAUDE.md, README.md, ROADMAP.md, packages/*/README.md,
// .claude/skills/** and .claude/agents/**. Two kinds of name are paths:
// - a Markdown link, `[text](target)`, resolved from the file (or from the root when it starts
//   with `/`), its `#anchor` dropped; URLs and bare anchors are skipped;
// - a code span with no spaces that starts with `./` or `../` (resolved from the file) or with a
//   folder at the top of the repo, such as `docs/` or `.claude/` (resolved from the root).
// Placeholders (`<Name>`, `*`, `…`, `{a,b}`) and fenced code blocks are skipped. ROADMAP.md is a
// plan whose code spans name files later phases write, so only its links are read. The vendored
// skills, writing-for-agents and software-factory, are copied from upstream unchanged (prettier
// skips them too) and name upstream's paths, so they are not read. A deliberate exception is an
// HTML comment, `<!-- perron-allow(paths): reason -->`, on the line or the line above.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'
import { byFileLine, excuse, VENDORED, walk, type Check, type Problem } from './lib.ts'

const RULE = 'paths'
/** Top-level folders that are build output or tooling, never named as repo paths. */
const NOT_SOURCE = new Set(['.git', 'node_modules', 'dist', 'dist-ssr', 'coverage'])
const PLACEHOLDER = /[<>*…{}]/

const isMarkdown = (name: string) => name.endsWith('.md')

/** The files this rule reads, by path from `root`. */
function sources(root: string) {
  const top = ['CLAUDE.md', 'README.md', 'ROADMAP.md'].filter((f) => existsSync(join(root, f)))
  // each package's own README, packages/<name>/README.md, not the READMEs inside it
  const packages = walk(root, 'packages', (n) => n === 'README.md').filter(
    (f) => f.split('/').length === 3,
  )
  const claude = [
    ...walk(root, '.claude/skills', isMarkdown),
    ...walk(root, '.claude/agents', isMarkdown),
  ]
  return [
    ...top,
    ...walk(root, 'docs', isMarkdown),
    ...packages,
    ...claude.filter((f) => !VENDORED.some((v) => f.startsWith(v))),
  ]
}

/** The folders at the top of the repo, the first segment a code span must start with. */
function topFolders(root: string) {
  return new Set(
    readdirSync(root, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !NOT_SOURCE.has(d.name))
      .map((d) => d.name),
  )
}

/** Each path `text` names, by line, as a path from the repo root; code spans only if `spans`. */
function namedPaths(text: string, file: string, tops: Set<string>, spans: boolean) {
  const out: { line: number; path: string }[] = []
  const here = dirname(file)
  let fence = ''
  text.split('\n').forEach((source, i) => {
    const marker = /^\s*(`{3,}|~{3,})/.exec(source)?.[1]
    if (marker && (!fence || marker.startsWith(fence))) {
      fence = fence ? '' : marker
      return
    }
    if (fence) return
    const line = i + 1
    if (spans)
      for (const [, span] of source.matchAll(/`([^`]+)`/g)) {
        if (/\s/.test(span) || PLACEHOLDER.test(span)) continue
        if (span.startsWith('./') || span.startsWith('../'))
          out.push({ line, path: normalize(join(here, span)) })
        else if (span.includes('/') && tops.has(span.split('/')[0]))
          out.push({ line, path: normalize(span) })
      }
    const prose = source.replace(/`[^`]*`/g, (s) => ' '.repeat(s.length))
    for (const [, raw] of prose.matchAll(/\]\(\s*(<[^>]*>|[^)\s]+)[^)]*\)/g)) {
      const target = raw.replace(/^<|>$/g, '').split('#')[0]
      if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target) || PLACEHOLDER.test(target)) continue
      const path = target.startsWith('/') ? target.slice(1) : join(here, target)
      out.push({ line, path: normalize(decodeURI(path)) })
    }
  })
  return out
}

export default {
  rule: RULE,
  run(root) {
    const tops = topFolders(root)
    const read = (file: string) => readFileSync(join(root, file), 'utf8')
    const problems: Problem[] = []
    for (const file of sources(root))
      for (const { line, path } of namedPaths(read(file), file, tops, file !== 'ROADMAP.md'))
        if (!existsSync(join(root, path)))
          problems.push({ file, line, message: `names ${path}, which does not exist` })
    return excuse(problems, RULE, read).sort(byFileLine)
  },
} satisfies Check
