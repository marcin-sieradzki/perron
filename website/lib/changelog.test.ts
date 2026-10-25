import { describe, expect, it } from 'vitest'
import { parseChangelog, readChangelogs } from './changelog.ts'
import { PACKAGES, readPackage } from './repo.ts'

const log = `# @mylder/example

## 0.2.0

### Minor Changes

- 5d5f868: Add the \`patterns\` entry point.
- A change with no commit.

### Patch Changes

- Updated dependencies [5d5f868]
- Updated dependencies [84fa566]
- 1a2b3c4: A fix.
- Updated dependencies [a1df949]
  - @mylder/perron@0.2.0

## 0.1.0

### Minor Changes

- 3d522f8: The first release.
`

describe('parseChangelog', () => {
  it('reads versions, groups and entries, newest first', () => {
    const parsed = parseChangelog(log, 'x/CHANGELOG.md')
    expect(parsed.name).toBe('@mylder/example')
    expect(parsed.releases.map((r) => r.version)).toEqual(['0.2.0', '0.1.0'])
    expect(parsed.releases[0].groups.map((g) => g.kind)).toEqual(['Minor Changes', 'Patch Changes'])
    expect(parsed.releases[0].groups[0].entries).toEqual([
      { commit: '5d5f868', markdown: 'Add the `patterns` entry point.' },
      { markdown: 'A change with no commit.' },
    ])
  })

  it('keeps indented lines with the entry above them', () => {
    const minor = parseChangelog(
      `# x\n\n## 1.0.0\n\n### Minor Changes\n\n- One\n  more line\n`,
      'x',
    )
    expect(minor.releases[0].groups[0].entries[0].markdown).toBe('One\nmore line')
  })

  it("folds a release's dependency updates into one entry, where the first was", () => {
    const patch = parseChangelog(log, 'x').releases[0].groups[1].entries
    expect(patch).toEqual([
      { markdown: 'Updated dependencies\n- @mylder/perron@0.2.0' },
      { commit: '1a2b3c4', markdown: 'A fix.' },
    ])
  })

  it('throws for a file with no # heading', () => {
    expect(() => parseChangelog('## 1.0.0', 'x.md')).toThrow('x.md has no # heading')
  })
})

describe('readChangelogs', () => {
  it("reads both packages' changelogs, each topped by its current version", () => {
    const [perron, mcp] = readChangelogs()
    expect(perron.name).toBe('@mylder/perron')
    expect(mcp.name).toBe('@mylder/perron-mcp')
    expect(perron.releases[0].version).toBe(readPackage(PACKAGES.perron).version)
    expect(mcp.releases[0].version).toBe(readPackage(PACKAGES.mcp).version)
  })

  it('shows at most one dependency update in each group', () => {
    for (const changelog of readChangelogs())
      for (const release of changelog.releases)
        for (const group of release.groups)
          expect(
            group.entries.filter((e) => e.markdown.startsWith('Updated dependencies')).length,
          ).toBeLessThanOrEqual(1)
  })
})
