import { describe, expect, it } from 'vitest'
import { fold, searchEntries } from '../components/site/SiteSearchMatch.ts'
import { SECTIONS } from '../components/site/sections.ts'
import { readFoundations } from './foundations.ts'
import { routedEntries } from './registry.ts'
import { buildSearchIndex, plainHeading, type SearchEntry } from './search-index.ts'

const index = buildSearchIndex()
const at = (href: string) => index.filter((e) => e.href === href)

describe('buildSearchIndex', () => {
  it('has every section, by its label, at its route', () => {
    for (const s of SECTIONS)
      expect(at(s.href)).toContainEqual({ title: s.label, href: s.href, section: s.label })
  })

  it('has every foundation page, Content design among them, by its title', () => {
    for (const p of readFoundations())
      expect(at(p.route)).toContainEqual({ title: p.title, href: p.route, section: 'Foundations' })
    expect(at('/foundations/content-design')[0].title).toBe('Content design')
  })

  it('has every component and pattern with a spec page, by its name', () => {
    for (const [layer, section] of [
      ['component', 'Components'],
      ['pattern', 'Patterns'],
    ] as const)
      for (const e of routedEntries(layer))
        expect(at(e.route ?? '')).toContainEqual({ title: e.name, href: e.route, section })
  })

  it("has each page's headings, in its own words, at their anchors", () => {
    expect(index).toContainEqual({
      title: 'Durations',
      href: '/foundations/motion#durations',
      page: 'Motion',
      section: 'Foundations',
    })
    expect(index).toContainEqual({
      title: 'list_tokens',
      // Markdown's heading ids drop the underscore, so the anchor does too
      href: '/agents#listtokens',
      page: 'Agents',
      section: 'Agents',
    })
    expect(index).toContainEqual({
      title: 'Using the tokens',
      href: '/get-started#using-the-tokens',
      page: 'Get started',
      section: 'Get started',
    })
  })

  it("leaves out the spec template's headings and keeps a spec's own", () => {
    const specs = index.filter((e) => /^\/(components|patterns)\/./.test(e.href) && e.page)
    expect(specs.map((e) => e.title)).not.toContain('Props')
    expect(specs.map((e) => e.title)).not.toContain("Do and don't")
    expect(index).toContainEqual({
      title: 'MenuItem',
      href: '/components/menu#menuitem',
      page: 'Menu',
      section: 'Components',
    })
  })

  it('has each version of both changelogs on the Release log', () => {
    const versions = index.filter((e) => e.page === 'Release log')
    expect(versions.length).toBeGreaterThan(0)
    expect(versions.every((e) => /^@mylder\/perron(-mcp)? \S+$/.test(e.title))).toBe(true)
  })

  it('gives no two entries the same words and link, so each result has its own key', () => {
    const keys = index.map((e) => `${e.href} ${e.title}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('reaches the browser as props: plain data that survives JSON', () => {
    expect(JSON.parse(JSON.stringify(index))).toEqual(index)
  })
})

describe('plainHeading', () => {
  it("drops a heading's inline markdown and keeps its words", () => {
    expect(plainHeading('The `size` prop')).toBe('The size prop')
    expect(plainHeading('[Motion](motion.md) and **easing**')).toBe('Motion and easing')
    expect(plainHeading('`search_docs`')).toBe('search_docs')
    expect(plainHeading('_Quiet_ panels')).toBe('Quiet panels')
  })
})

describe('searchEntries', () => {
  const entries: SearchEntry[] = [
    { title: 'Sheet', href: '/components/sheet', section: 'Components' },
    { title: 'Motion', href: '/foundations/motion', section: 'Foundations' },
    {
      title: 'Reduced motion',
      href: '/foundations/motion#reduced-motion',
      page: 'Motion',
      section: 'Foundations',
    },
    {
      title: 'Bottom sheets',
      href: '/foundations/layout#bottom-sheets',
      page: 'Layout',
      section: 'Foundations',
    },
    { title: 'MenuItem', href: '/components/menu#menuitem', page: 'Menu', section: 'Components' },
    { title: 'Nørreport', href: '/x', section: 'Foundations' },
  ]
  const titles = (q: string) => searchEntries(entries, q).map((e) => e.title)

  it('finds nothing for an empty query', () => {
    expect(titles('')).toEqual([])
    expect(titles('   ')).toEqual([])
  })

  it('puts the title that is the query first, then those it starts, then those it is in', () => {
    expect(titles('motion')).toEqual(['Motion', 'Reduced motion'])
    expect(titles('sheet')).toEqual(['Sheet', 'Bottom sheets'])
  })

  it('ignores case, accents and extra space, and finds every word in any order', () => {
    expect(titles('  SHEETS   bottom ')).toEqual(['Bottom sheets'])
    expect(titles('menu item')).toEqual(['MenuItem'])
    expect(fold('Ré  Duced')).toBe('re duced')
  })

  it('lets the page around a heading narrow it, as long as one word is in the heading', () => {
    expect(titles('reduced motion')).toEqual(['Reduced motion'])
    expect(titles('layout sheets')).toEqual(['Bottom sheets'])
    expect(titles('layout')).toEqual([])
  })

  it('says nothing it cannot find', () => {
    expect(titles('timetable')).toEqual([])
  })

  it('searches the real index: a page by its name comes first', () => {
    expect(searchEntries(index, 'sheet')[0]).toEqual({
      title: 'Sheet',
      href: '/components/sheet',
      section: 'Components',
    })
  })
})
