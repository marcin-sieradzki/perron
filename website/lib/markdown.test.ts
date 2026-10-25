import { describe, expect, it } from 'vitest'
import { docTitle, firstParagraph, readDoc, sectionBody, sections, stripTitle } from './markdown.ts'

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
