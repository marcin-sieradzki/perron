import { describe, expect, it } from 'vitest'
import { readFoundation, readFoundations } from '../../lib/foundations.ts'
import {
  brandValues,
  foundationGroups,
  introOf,
  rowOf,
  sentences,
  spaced,
  usingTheTokens,
  withoutIntro,
} from './data.ts'

describe('foundationGroups', () => {
  it('lists every foundation page once, the live map pages in a group of their own', () => {
    const groups = foundationGroups()
    const slugs = groups.flatMap((g) => g.pages.map((p) => p.slug))
    expect([...slugs].sort()).toEqual(
      readFoundations()
        .map((p) => p.slug)
        .sort(),
    )
    expect(groups[1]).toMatchObject({ label: 'Only on a live map' })
    expect(groups[1].pages.map((p) => p.slug)).toEqual(['data-states', 'map'])
    expect(groups[0].pages[0].slug).toBe('semantic-colours')
    expect(groups[0].pages.map((p) => p.slug)).toContain('content-design')
  })
})

describe('the Contents page', () => {
  it('gives the brand values and the section on using the tokens', () => {
    expect(brandValues().map((v) => v.name)).toEqual(['Honest', 'Calm', 'Of Copenhagen'])
    expect(usingTheTokens()).toContain('perron.css')
  })
})

describe('a page and its rows', () => {
  const motion = readFoundation('motion')!

  it('finds a row by name and names the page when it is gone', () => {
    expect(rowOf(motion, 'duration.sheet').cssVar).toBe('--perron-duration-sheet')
    expect(() => rowOf(motion, 'duration.nothing')).toThrow(/motion\.md shows no token/)
  })

  it('takes the intro out of the first prose segment, which the header shows', () => {
    const first = motion.segments[0]
    const intro = introOf(motion)
    expect(intro).toMatch(/^Motion explains a change of place/)
    const rest = first.kind === 'prose' ? withoutIntro(first.markdown, intro) : ''
    expect(rest).not.toContain('# Motion')
    expect(rest).not.toContain(intro)
    expect(rest).toMatch(/^## Durations/)
  })
})

describe('words', () => {
  it('spaces a unit and splits sentences, keeping decimals whole', () => {
    expect(spaced('12px')).toBe('12 px')
    expect(spaced('0.01ms')).toBe('0.01 ms')
    expect(spaced('cubic-bezier(0, 0, 1, 1)')).toBe('cubic-bezier(0, 0, 1, 1)')
    expect(sentences('Transitions take 0.01 ms. Loops stop.')).toEqual([
      'Transitions take 0.01 ms.',
      'Loops stop.',
    ])
  })
})
