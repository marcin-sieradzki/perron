import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { RUN_NOTES } from '../../storybook/blocks/component-page.ts'
import { describe, expect, it } from 'vitest'
import { readSources } from './token-sources.ts'
import { headingOf, PAGES, readPages } from './pages.ts'
import { loadTokens } from './tokens.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const pages = readPages(root, loadTokens(readSources(root)))
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

  it('group pages by folder: foundations, the contract, the specs, and the guidelines beside them', () => {
    const group = (path: string) => headingOf(path, '# Title\n').group
    expect(group('docs/foundations/motion.md')).toBe('Foundations')
    expect(group('docs/components/README.md')).toBe('Components')
    expect(group('docs/components/TEMPLATE.md')).toBe('Components')
    expect(group('docs/components/date-picker.md')).toBe('Specs')
    expect(group('docs/patterns/departure-row.md')).toBe('Specs')
    expect(group('docs/content-design.md')).toBe('Guidelines')
  })

  it('sort in the order the Contents page lists them, group by group', () => {
    // the sidebar order: each group at 10 spaces, its pages at 12, the PAGES order in both
    const preview = readFileSync(join(root, '.storybook/preview.ts'), 'utf8')
    const order: { group: string; titles: string[] }[] = []
    for (const [, indent, name] of preview.matchAll(/^( {10}| {12})'([^']+)',$/gm))
      if (indent.length === 10) order.push({ group: name, titles: [] })
      else order.at(-1)!.titles.push(name)
    const groups = [...new Set(pages.map((p) => p.group))]
    // the Patterns group holds the patterns' own stories and docs, which are no page of docs/
    expect(order.map((o) => o.group).filter((g) => g !== 'Patterns')).toEqual(groups)
    for (const { group, titles } of order) {
      const listed = pages.filter((p) => p.group === group).map((p) => p.title)
      // its pages first; under Components, the registered components follow
      expect(titles.slice(0, listed.length)).toEqual(listed)
    }
    const contents = readFileSync(join(root, 'docs/foundations/README.md'), 'utf8')
    const linked = [...contents.matchAll(/^\| \[[^\]]+\]\(([\w-]+\.md)\)/gm)].map(
      (m) => `docs/foundations/${m[1]}`,
    )
    expect(PAGES.slice(1, linked.length + 1)).toEqual(linked)
  })

  it('turn every table block into rows, leaving no marker in the prose', () => {
    // but a spec's run notes line, which the docs page's intro stops at and the page draws as nothing
    const prose = pages.flatMap((p) => p.segments.filter((s) => s.kind === 'prose'))
    expect(prose.filter((s) => s.markdown.replaceAll(RUN_NOTES, '').includes('<!--'))).toEqual([])
    const motion = pages.find((p) => p.title === 'Motion')!
    const durations = motion.segments.find((s) => s.kind === 'tokens')!
    expect(durations).toMatchObject({ contexts: ['Reduced motion'], themes: ['light'] })
  })
})
