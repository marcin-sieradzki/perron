// Release log: both changelogs, as the release workflow writes them from changesets, the package's
// first, each newest first. A version shows its date when its heading has one; each entry is the
// changelog's own markdown, with its commit linked on GitHub. In the Agents page's layout.
import type { Metadata } from 'next'
import { DocLayout } from '@/components/agents/DocLayout.tsx'
import { Link } from '@/components/perron'
import { Markdown } from '@/components/site/Markdown.tsx'
import { PageHeader } from '@/components/site/PageHeader.tsx'
import { readChangelogs, type Changelog } from '../../lib/changelog.ts'
import { REPO_URL } from '../../lib/repo.ts'

export const metadata: Metadata = { title: 'Release log' }

/** A version heading's number and, when it has one, its date: `1.2.0 (2026-10-25)`, `1.2.0 - 2026-10-25`. */
function versionOf(heading: string) {
  const m = /^(\S+?)\s*(?:[-–—(]\s*)?(\d{4}-\d{2}-\d{2})\)?$/.exec(heading)
  return m ? { version: m[1], date: m[2] } : { version: heading, date: undefined }
}

/** An anchor for a package's version: `perron-mcp-0-1-1`. */
const anchor = (log: Changelog, version: string) =>
  `${log.name.replace(/^@mylder\//, '')}-${version}`.replace(/[^a-z0-9]+/gi, '-').toLowerCase()

/**
 * A dependency as changesets writes it, `@mylder/perron@0.2.0`, set as code, so the markdown
 * doesn't read it as an email address and link it.
 */
const packageSpecs = (markdown: string) =>
  markdown.replace(/(?<![`\w])(@[\w-]+\/[\w.-]+@\d[\w.+-]*)/g, '`$1`')

/** `Minor Changes`, as changesets writes it, in sentence case. */
const sentenceCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase()

export default function ReleasesPage() {
  const logs = readChangelogs()
  return (
    <DocLayout
      route="/releases"
      name="Release log"
      nav={logs.map((log) => ({
        title: log.name,
        code: true,
        links: log.releases.map((r) => {
          const { version } = versionOf(r.version)
          return { label: version, href: `#${anchor(log, version)}`, code: true }
        }),
      }))}
    >
      <PageHeader
        title="Release log"
        lead={`What changed in each version of ${logs.map((l) => l.name).join(' and ')}, newest first.`}
      />
      {logs.map((log) => (
        <section
          key={log.path}
          aria-labelledby={`${anchor(log, 'log')}-h`}
          className="agents-section"
        >
          <h2 id={`${anchor(log, 'log')}-h`}>{log.name}</h2>
          {log.releases.map((release) => {
            const { version, date } = versionOf(release.version)
            const id = anchor(log, version)
            return (
              <article
                key={release.version}
                id={id}
                aria-labelledby={`${id}-h`}
                className="agents-release agents-card"
              >
                <h3 id={`${id}-h`} className="agents-release-head">
                  {version}
                  {date ? (
                    <time className="agents-release-date" dateTime={date}>
                      {date}
                    </time>
                  ) : null}
                </h3>
                {release.groups.map((group) => (
                  <div key={group.kind} className="agents-release">
                    <h4 className="agents-release-group agents-overline">
                      {sentenceCase(group.kind)}
                    </h4>
                    <ul className="agents-release-entries">
                      {group.entries.map((entry, i) => (
                        <li key={entry.commit ?? i} className="agents-release-entry">
                          <Markdown source={packageSpecs(entry.markdown)} path={log.path} />
                          {entry.commit ? (
                            <span className="agents-release-commit">
                              <Link
                                href={`${REPO_URL}/commit/${entry.commit}`}
                                aria-label={`Commit ${entry.commit} on GitHub`}
                              >
                                {entry.commit}
                              </Link>
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </article>
            )
          })}
        </section>
      ))}
    </DocLayout>
  )
}
