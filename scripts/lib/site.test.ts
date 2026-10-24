import { readFileSync } from 'node:fs'
import { dirname, join, posix } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { PAGES } from './pages.ts'
import { buildSite, SITE } from './site.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const site = buildSite(root)

describe('the docs site', () => {
  it('writes a Markdown twin of every page, as the repo has it', () => {
    for (const path of PAGES) expect(site[path]).toBe(readFileSync(join(root, path), 'utf8'))
  })

  it('lists every page in llms.txt, one line each, linking its twin', () => {
    const llms = site['llms.txt']
    expect(llms).toMatch(/^# Perron\n\n> .+\n/)
    const lines = llms.split('\n').filter((l) => l.includes(`](${SITE}docs/`))
    expect(lines).toHaveLength(PAGES.length)
    for (const path of PAGES)
      expect(lines).toContainEqual(expect.stringMatching(`\\]\\(${SITE}${path}\\): \\S`))
  })

  it('groups llms.txt as the sidebar does: foundations, guidelines, then components', () => {
    expect(site['llms.txt'].match(/^## .+$/gm)).toEqual([
      '## Foundations',
      '## Guidelines',
      '## Components',
      '## Optional',
    ])
  })

  it('describes each page in llms.txt by its opening sentence, links dropped', () => {
    expect(site['llms.txt']).toContain(
      `- [Content design](${SITE}docs/content-design.md): How every word in Mylder reads: plain sentences, exact about certainty, in English and Danish.\n`,
    )
  })

  it('resolves every relative link and image in a twin to a file on the site', () => {
    const missing = PAGES.flatMap((path) =>
      [...site[path].matchAll(/\]\(([^)#\s]+)[^)]*\)|src="([^"]+)"/g)]
        .map((m) => m[1] ?? m[2])
        .filter((ref) => !/^[a-z]+:/.test(ref))
        .map((ref) => posix.join(posix.dirname(path), ref))
        .filter((target) => !(target in site)),
    )
    expect(missing).toEqual([])
  })

  it('gives consumer agents an AGENTS.md: install, the rules, and every page', () => {
    const agents = site['AGENTS.md']
    expect(agents).toContain('npm install @mylder/perron')
    const readme = readFileSync(join(root, 'docs/foundations/README.md'), 'utf8')
    const rules = /## Using the tokens\n\n([\s\S]+?)(\n## |$)/.exec(readme)![1].trim()
    expect(agents).toContain(rules)
    for (const path of PAGES) expect(agents).toContain(`${SITE}${path}`)
  })

  it('links only absolute URLs from llms.txt and AGENTS.md, which apps copy elsewhere', () => {
    const relative = ['llms.txt', 'AGENTS.md'].flatMap((f) =>
      [...site[f].matchAll(/\]\(([^)]+)\)/g)]
        .map((m) => m[1])
        .filter((u) => !u.startsWith('https://')),
    )
    expect(relative).toEqual([])
  })
})
