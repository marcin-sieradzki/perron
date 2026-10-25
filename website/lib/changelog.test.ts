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
    const patch = parseChangelog(log, 'x').releases[0].groups[1].entries[0]
    expect(patch.markdown).toBe('Updated dependencies [5d5f868]\n- @mylder/perron@0.2.0')
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
})
