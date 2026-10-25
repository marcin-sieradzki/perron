import { describe, expect, it } from 'vitest'
import {
  agentsAnchors,
  deadAnchors,
  idsIn,
  markdownHeadings,
  toolAnchor,
  withoutLeadingTitle,
} from './anchors.ts'

describe('markdownHeadings', () => {
  it('gives each heading the id Markdown renders, in its words without inline markdown', () => {
    expect(
      markdownHeadings(
        '# Title\n\n## The `size` prop\n\n### [Motion](motion.md) and **easing**\n\n## `list_tokens`',
      ),
    ).toEqual([
      { level: 2, title: 'The size prop', id: 'the-size-prop' },
      { level: 3, title: 'Motion and easing', id: 'motion-and-easing' },
      // markdown-to-jsx's ids drop the underscore
      { level: 2, title: 'list_tokens', id: 'listtokens' },
    ])
  })

  it("numbers a repeat, skips the dropped title and a fence's lines", () => {
    expect(markdownHeadings('# A\n\n## A\n\n## A\n\n```md\n## Not a heading\n```')).toEqual([
      { level: 2, title: 'A', id: 'a' },
      { level: 2, title: 'A', id: 'a-1' },
    ])
  })
})

describe('withoutLeadingTitle', () => {
  it('drops only a leading # line', () => {
    expect(withoutLeadingTitle('# Title\nBody\n# Later')).toBe('Body\n# Later')
    expect(withoutLeadingTitle('Body\n# Later')).toBe('Body\n# Later')
  })
})

describe('agentsAnchors', () => {
  it("lists the Agents page's sections with each tool's card under Tools", () => {
    expect(toolAnchor('search_docs')).toBe('search-docs')
    expect(agentsAnchors(['list_tokens']).map((a) => a.id)).toEqual([
      'setup',
      'tools',
      'list-tokens',
      'sources',
    ])
  })
})

describe('idsIn and deadAnchors', () => {
  const pages: Record<string, string> = {
    '/agents': '<section id="tools"><h3 id="list-tokens">list_tokens</h3></section>',
    '/foundations': '<h2 id="do-and-don&#x27;t">Do</h2><p id="a&amp;b">',
  }
  const idsOf = (route: string) => (route in pages ? idsIn(pages[route]) : undefined)

  it('reads every id, its character references decoded', () => {
    expect(idsIn(pages['/foundations'])).toEqual(new Set(["do-and-don't", 'a&b']))
  })

  it('finds the links whose page or id is missing', () => {
    expect(
      deadAnchors(
        [
          '/agents',
          '/agents#list-tokens',
          '/agents#listtokens',
          "/foundations#do-and-don't",
          '/foundations#do-and-don%27t',
          '/releases',
          '/agents#100%',
        ],
        idsOf,
      ),
    ).toEqual(['/agents#listtokens', '/releases', '/agents#100%'])
  })
})
