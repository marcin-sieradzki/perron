// The two changelogs the release workflow writes from changesets, as versions and entries: the
// Release log's data. A changelog is `# <package>`, then `## <version>`, then `### <kind> Changes`,
// then one list item per change, `- <commit>: <text>`, with indented lines that belong to it. A
// release's run of "Updated dependencies" lines reads as one entry.
import { once, readRepoFile } from './repo.ts'

/** The changelogs, by path from the repo root: the package first, then the MCP server. */
export const CHANGELOGS = ['packages/perron/CHANGELOG.md', 'packages/mcp/CHANGELOG.md'] as const

export interface ChangelogEntry {
  /** The commit that brought the changeset, such as `5d5f868`, when the line names one */
  commit?: string
  /** The change, as markdown, with any indented lines under it */
  markdown: string
}

export interface ChangeGroup {
  /** `Major Changes`, `Minor Changes` or `Patch Changes` */
  kind: string
  entries: ChangelogEntry[]
}

export interface Release {
  version: string
  groups: ChangeGroup[]
}

export interface Changelog {
  /** The package's name, the file's `#` heading */
  name: string
  /** Path from the repo root */
  path: string
  /** Newest first, as the file lists them */
  releases: Release[]
}

/** Changesets' line for a release that only picks up a dependency's: `Updated dependencies [5d5f868]`. */
const DEPENDENCY_UPDATE = /^Updated dependencies(?: \[[0-9a-f, ]*\])?$/

/**
 * A group's entries with changesets' "Updated dependencies" lines, one per commit, folded into one
 * at the place of the first, listing each dependency's new version once: `Updated dependencies`,
 * then `- @mylder/perron@0.2.0`. Other entries stay as they are, in order.
 */
export function foldDependencyUpdates(entries: ChangelogEntry[]): ChangelogEntry[] {
  const updates = entries.filter((e) => DEPENDENCY_UPDATE.test(e.markdown.split('\n')[0]))
  if (!updates.length) return entries
  const versions = new Set(updates.flatMap((e) => e.markdown.split('\n').slice(1)))
  const folded: ChangelogEntry = { markdown: ['Updated dependencies', ...versions].join('\n') }
  return entries.flatMap((e) => (e === updates[0] ? [folded] : updates.includes(e) ? [] : [e]))
}

/** A changelog's markdown as versions, groups and entries. */
export function parseChangelog(markdown: string, path: string): Changelog {
  const log: Changelog = { name: '', path, releases: [] }
  let entry: ChangelogEntry | undefined
  for (const line of markdown.split('\n')) {
    let m: RegExpExecArray | null
    if ((m = /^# (.+)$/.exec(line))) log.name = m[1].trim()
    else if ((m = /^## (.+)$/.exec(line))) {
      log.releases.push({ version: m[1].trim(), groups: [] })
      entry = undefined
    } else if ((m = /^### (.+)$/.exec(line))) {
      log.releases.at(-1)?.groups.push({ kind: m[1].trim(), entries: [] })
      entry = undefined
    } else if ((m = /^- (?:([0-9a-f]{7,40}): )?(.*)$/.exec(line))) {
      const group = log.releases.at(-1)?.groups.at(-1)
      if (!group) continue
      entry = m[1] ? { commit: m[1], markdown: m[2] } : { markdown: m[2] }
      group.entries.push(entry)
    } else if (entry && /^\s+\S/.test(line)) entry.markdown += `\n${line.replace(/^ {2}/, '')}`
  }
  if (!log.name) throw new Error(`${path} has no # heading`)
  for (const release of log.releases)
    for (const group of release.groups) group.entries = foldDependencyUpdates(group.entries)
  return log
}

/** Both changelogs, the package's first. */
export const readChangelogs = once(() => CHANGELOGS.map((p) => parseChangelog(readRepoFile(p), p)))
