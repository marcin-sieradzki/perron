import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import paths from './paths.ts'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => join(here, 'fixtures/paths', name)
const gone = (file: string, line: number, path: string) => ({
  file,
  line,
  message: `names ${path}, which does not exist`,
})

describe('paths', () => {
  it('passes links, repo paths, placeholders, code blocks, the roadmap and vendored skills', () => {
    expect(paths.run(fixture('clean'))).toEqual([])
  })

  it('names each path that does not exist, in every doc and skill', () => {
    expect(paths.run(fixture('broken'))).toEqual([
      gone('.claude/agents/reviewer.md', 6, 'docs/gone.md'),
      gone('.claude/skills/tool/SKILL.md', 8, 'scripts/gone.ts'),
      gone('CLAUDE.md', 3, '.claude/skills/gone/SKILL.md'),
      gone('ROADMAP.md', 3, 'docs/gone.md'),
      gone('docs/page.md', 3, 'docs/gone.md'),
      gone('docs/page.md', 5, 'scripts/gone.ts'),
      gone('docs/page.md', 7, 'docs/gone.md'),
      gone('docs/page.md', 9, 'docs/also-gone.md'),
      gone('packages/kit/README.md', 3, 'docs/gone.md'),
    ])
  })

  it('passes on the repo', () => {
    expect(paths.run(join(here, '../..'))).toEqual([])
  })
})
