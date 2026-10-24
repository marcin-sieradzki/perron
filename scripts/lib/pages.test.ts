import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { readSources } from '../build-tokens.ts'
import { PAGES, readPages } from './pages.ts'
import { loadTokens } from './tokens.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const pages = readPages(root, loadTokens(readSources()))
const mdx = readdirSync(join(root, 'storybook/pages')).map((f) =>
  readFileSync(join(root, 'storybook/pages', f), 'utf8'),
)

describe('Storybook pages', () => {
  it('cover every foundation page', () => {
    const docs = readdirSync(join(root, 'docs/foundations')).map((f) => `docs/foundations/${f}`)
    expect(PAGES.filter((p) => p.startsWith('docs/foundations/')).sort()).toEqual(docs.sort())
  })

  it('have one MDX file each, titled with the page heading', () => {
    expect(mdx).toHaveLength(pages.length)
    for (const p of pages)
      expect(mdx).toContainEqual(
        expect.stringMatching(
          new RegExp(`<Meta title="${p.group}/${p.title}" />[\\s\\S]*path="${p.path}"`),
        ),
      )
  })

  it('sort in the order the Contents page lists them', () => {
    const preview = readFileSync(join(root, '.storybook/preview.ts'), 'utf8')
    const order = [...preview.matchAll(/^ {12}'([^']+)',$/gm)].map((m) => m[1])
    expect(order).toEqual(pages.filter((p) => p.group === 'Foundations').map((p) => p.title))
    const contents = readFileSync(join(root, 'docs/foundations/README.md'), 'utf8')
    const linked = [...contents.matchAll(/^\| \[[^\]]+\]\(([\w-]+\.md)\)/gm)].map(
      (m) => `docs/foundations/${m[1]}`,
    )
    expect(PAGES.slice(1, linked.length + 1)).toEqual(linked)
  })

  it('turn every table block into rows, leaving no marker in the prose', () => {
    const prose = pages.flatMap((p) => p.segments.filter((s) => s.kind === 'prose'))
    expect(prose.filter((s) => s.markdown.includes('<!--'))).toEqual([])
    const motion = pages.find((p) => p.title === 'Motion')!
    const durations = motion.segments.find((s) => s.kind === 'tokens')!
    expect(durations).toMatchObject({ contexts: ['Reduced motion'], themes: ['light'] })
  })
})
