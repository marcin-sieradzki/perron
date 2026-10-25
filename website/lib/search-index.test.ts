import { describe, expect, it } from 'vitest'
import { fold, searchEntries } from '../components/site/SiteSearchMatch.ts'
import { SECTIONS } from './sections.ts'
import { releaseAnchor } from './anchors.ts'
import { readChangelogs, versionOf } from './changelog.ts'
import { readFoundations } from './foundations.ts'
import { routedEntries } from './registry.ts'
import { buildSearchIndex, type SearchEntry } from './search-index.ts'

const index = await buildSearchIndex()
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

  it("has each page's places, in its own words, at the ids the page gives them", () => {
    // a foundation page's heading, at the id Markdown gives it
    expect(index).toContainEqual({
      title: 'Durations',
      href: '/foundations/motion#durations',
      page: 'Motion',
      section: 'Foundations',
    })
    // a gallery's category, at its heading's id
    expect(index).toContainEqual({
      title: 'Map',
      href: '/foundations/icons#fd-icons-map',
      page: 'Icons',
      section: 'Foundations',
    })
    // a tool, by the name the server lists it under, at its card
    expect(index).toContainEqual({
      title: 'list_tokens',
      href: '/agents#list-tokens',
      page: 'Agents',
      section: 'Agents',
    })
    // a step of Get started, at its section
    expect(index).toContainEqual({
      title: 'Use the tokens',
      href: '/get-started#tokens',
      page: 'Get started',
      section: 'Get started',
    })
    expect(index).toContainEqual({
      title: 'Using the tokens',
      href: '/foundations#using-the-tokens',
      page: 'Foundations',
      section: 'Foundations',
    })
  })

  it("has a built spec's prose sections, the ones its page draws after the props", () => {
    for (const [title, id] of [
      ['Keyboard and ARIA', 'keyboard-and-aria'],
      ['Owned strings', 'owned-strings'],
      ["Do and don't", 'do-and-dont'],
    ])
      expect(index).toContainEqual({
        title,
        href: `/components/button#${id}`,
        page: 'Button',
        section: 'Components',
      })
  })

  it("leaves out a spec's headings its page does not draw", () => {
    const specs = index.filter((e) => /^\/(components|patterns)\/./.test(e.href) && e.page)
    const titles = specs.map((e) => e.title)
    expect(titles).not.toContain('Props')
    expect(titles).not.toContain('Anatomy')
    // a part's props table, which the page leaves out
    expect(titles).not.toContain('MenuItem')
    expect(index.map((e) => e.href)).not.toContain('/components/menu#menuitem')
  })

  it('has each version of both changelogs at its place on the Release log', () => {
    const versions = index.filter((e) => e.page === 'Release log')
    expect(versions.length).toBe(readChangelogs().flatMap((l) => l.releases).length)
    expect(versions.every((e) => /^@mylder\/perron(-mcp)? \S+$/.test(e.title))).toBe(true)
    const [perron] = readChangelogs()
    const { version } = versionOf(perron.releases[0].version)
    expect(versions).toContainEqual({
      title: `@mylder/perron ${version}`,
      href: `/releases#${releaseAnchor('@mylder/perron', version)}`,
      page: 'Release log',
      section: 'Release log',
    })
  })

  it('gives no two entries the same words and link, so each result has its own key', () => {
    const keys = index.map((e) => `${e.href} ${e.title}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('is served as JSON: plain data that survives it', () => {
    expect(JSON.parse(JSON.stringify(index))).toEqual(index)
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
