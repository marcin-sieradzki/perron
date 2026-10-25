import { describe, expect, it } from 'vitest'
import { PAGES } from '../../scripts/lib/pages.ts'
import { readContents, readFoundation, readFoundations } from './foundations.ts'

describe('readFoundations', () => {
  it('serves every foundation page and Content design, in the Contents page order', () => {
    const slugs = readFoundations().map((p) => p.slug)
    const expected = PAGES.filter(
      (p) =>
        (p.startsWith('docs/foundations/') && !p.endsWith('README.md')) ||
        p === 'docs/content-design.md',
    ).map((p) => p.slice(p.lastIndexOf('/') + 1, -3))
    expect(slugs).toEqual(expected)
    expect(slugs).toContain('content-design')
    expect(slugs).not.toContain('README')
  })

  it('gives each page its route, its title and its table blocks as rows', () => {
    const motion = readFoundation('motion')!
    expect(motion).toMatchObject({ title: 'Motion', route: '/foundations/motion' })
    const tokens = motion.segments.find((s) => s.kind === 'tokens')
    expect(tokens?.kind === 'tokens' && tokens.rows.some((r) => r.name === 'duration.sheet')).toBe(
      true,
    )
    expect(readFoundation('nothing')).toBeUndefined()
  })
})

describe('readContents', () => {
  it('reads the Contents page as the /foundations index', () => {
    expect(readContents()).toMatchObject({ title: 'Contents', slug: '', route: '/foundations' })
  })
})
