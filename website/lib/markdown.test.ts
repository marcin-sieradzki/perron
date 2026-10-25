import { describe, expect, it } from 'vitest'
import {
  decodeEntities,
  docTitle,
  fenceSpans,
  firstParagraph,
  firstTable,
  outsideFences,
  readDoc,
  sectionBody,
  sections,
  stripTitle,
  tables,
} from './markdown.ts'

describe('fenceSpans and outsideFences', () => {
  it('splits the markdown at its fences, and joins back to it', () => {
    const md = 'Prose\n```sh\nnpm i @mylder/perron@0.2.0\n```\nMore'
    expect(fenceSpans(md)).toEqual([
      { text: 'Prose', fenced: false },
      { text: '```sh\nnpm i @mylder/perron@0.2.0\n```', fenced: true },
      { text: 'More', fenced: false },
    ])
    expect(outsideFences(md, (s) => s.toUpperCase())).toBe(
      'PROSE\n```sh\nnpm i @mylder/perron@0.2.0\n```\nMORE',
    )
  })

  it('follows CommonMark: no backtick in a backtick fence’s info string, a closer as long', () => {
    expect(fenceSpans('```js``` is inline\n# x')).toEqual([
      { text: '```js``` is inline\n# x', fenced: false },
    ])
    expect(fenceSpans('````\n```\nstill code\n````\nafter').map((s) => s.fenced)).toEqual([
      true,
      false,
    ])
    // an unclosed fence runs to the end
    expect(fenceSpans('a\n~~~\ncode')).toEqual([
      { text: 'a', fenced: false },
      { text: '~~~\ncode', fenced: true },
    ])
  })

  it('edits a span whole, so a link that wraps is one link', () => {
    expect(
      outsideFences('See [the\ndocs](x.md).', (s) => s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')),
    ).toBe('See the\ndocs.')
  })
})

describe('decodeEntities', () => {
  it('decodes numeric references, and named ones when asked', () => {
    expect(decodeEntities('a&#x27;b&#39;c &amp;')).toBe("a'b'c &amp;")
    expect(decodeEntities('&quot;&lt;&gt;&amp;', { named: true })).toBe('"<>&')
    expect(decodeEntities('&#38;amp;', { named: true })).toBe('&amp;')
    expect(decodeEntities('a&#xA;b', { as: (c) => (c === '\n' ? ' ' : c) })).toBe('a b')
  })

  it('keeps a reference to no character as written', () => {
    expect(decodeEntities('&#x110000;&#1114112;&#xD800;&#x1F68C;')).toBe(
      '&#x110000;&#1114112;&#xD800;\u{1F68C}',
    )
  })

  it('reads named references case-sensitively', () => {
    expect(decodeEntities('&APOS;&Amp;&apos;', { named: true })).toBe("&APOS;&Amp;'")
  })
})

const page = `# Motion

Motion explains a change of place.
It never decorates.

## Durations

- Transitions move once.

\`\`\`sh
# not a heading
\`\`\`

## Easing

The sheet has its own curve.
`

describe('docTitle and stripTitle', () => {
  it('reads the # heading and removes it', () => {
    expect(docTitle(page)).toBe('Motion')
    expect(stripTitle(page)).toMatch(/^Motion explains/)
    expect(() => docTitle('no heading', 'x.md')).toThrow('x.md has no # heading')
  })
})

describe('firstParagraph', () => {
  it('joins the first prose block under the title into one line', () => {
    expect(firstParagraph(page)).toBe('Motion explains a change of place. It never decorates.')
  })

  it('skips headings, lists and tables before the prose', () => {
    expect(firstParagraph('# T\n\n## Sub\n\n- item\n\n| a |\n\nThe prose.')).toBe('The prose.')
  })
})

describe('sections and sectionBody', () => {
  it('splits by heading and skips a # comment in a fence', () => {
    expect(sections(page).map((s) => s.heading)).toEqual(['Motion', 'Durations', 'Easing'])
    expect(sectionBody(page, 'Easing')).toBe('The sheet has its own curve.')
    expect(sectionBody(page, 'Missing')).toBeUndefined()
  })
})

describe('readDoc', () => {
  it('reads a real doc in pieces', () => {
    const doc = readDoc('docs/foundations/README.md')
    expect(doc.title).toBe('Contents')
    expect(doc.intro).toMatch(/^Perron is the design system of Mylder/)
    expect(doc.body).not.toMatch(/^# /)
    expect(sectionBody(doc.markdown, 'Using the tokens')).toMatch(/@mylder\/perron\/perron\.css/)
  })
})

describe('tables and firstTable', () => {
  const md = [
    'Intro.',
    '',
    '| State | Means |',
    '| ----- | :---- |',
    '| Live  | New   |',
    '| A \\| B | Piped |',
    '',
    '| x |',
    '',
    '| Page | Use |',
    '| --- | --- |',
    '| [Map](map.md) | Lines |',
  ].join('\n')

  it('reads every table with a separator row, keyed by its header', () => {
    expect(tables(md)).toEqual([
      {
        head: ['State', 'Means'],
        rows: [
          { State: 'Live', Means: 'New' },
          { State: 'A | B', Means: 'Piped' },
        ],
      },
      { head: ['Page', 'Use'], rows: [{ Page: '[Map](map.md)', Use: 'Lines' }] },
    ])
  })

  it('gives the first table, or an empty one', () => {
    expect(firstTable(md).rows[0]).toEqual({ State: 'Live', Means: 'New' })
    expect(firstTable('No table.')).toEqual({ head: [], rows: [] })
  })
})
