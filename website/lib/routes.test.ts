import { describe, expect, it } from 'vitest'
import { assetSrc, siteHref, siteRoute } from './routes.ts'
import { REPO_URL } from './repo.ts'

describe('siteRoute', () => {
  it('routes each kind of doc the site shows', () => {
    expect(siteRoute('docs/foundations/README.md')).toBe('/foundations')
    expect(siteRoute('docs/foundations/motion.md')).toBe('/foundations/motion')
    expect(siteRoute('docs/content-design.md')).toBe('/foundations/content-design')
    expect(siteRoute('docs/components/button.md')).toBe('/components/button')
    expect(siteRoute('docs/patterns/detail-panel.md')).toBe('/patterns/detail-panel')
    expect(siteRoute('packages/perron/CHANGELOG.md')).toBe('/releases')
  })

  it('has no route for a file the site has no page for', () => {
    expect(siteRoute('docs/glossary.md')).toBeUndefined()
    expect(siteRoute('docs/components/README.md')).toBeUndefined()
  })
})

describe('siteHref', () => {
  it('rewrites a relative .md link to its route, keeping the anchor', () => {
    expect(siteHref('semantic-colours.md#brand', 'docs/foundations/README.md')).toBe(
      '/foundations/semantic-colours#brand',
    )
    expect(siteHref('../content-design.md', 'docs/foundations/README.md')).toBe(
      '/foundations/content-design',
    )
    expect(siteHref('../foundations/motion.md', 'docs/components/button.md')).toBe(
      '/foundations/motion',
    )
    expect(siteHref('icon-button.md', 'docs/components/button.md')).toBe('/components/icon-button')
  })

  it('sends a file the site has no page for to GitHub', () => {
    expect(siteHref('../glossary.md', 'docs/foundations/README.md')).toBe(
      `${REPO_URL}/blob/main/docs/glossary.md`,
    )
    expect(siteHref('../../packages/perron/icons/', 'docs/foundations/icons.md')).toBe(
      `${REPO_URL}/tree/main/packages/perron/icons`,
    )
  })

  it('leaves URLs and bare anchors as they are', () => {
    expect(siteHref('https://www.w3.org/TR/WCAG22/', 'docs/x.md')).toBe(
      'https://www.w3.org/TR/WCAG22/',
    )
    expect(siteHref('#durations', 'docs/x.md')).toBe('#durations')
  })
})

describe('assetSrc', () => {
  it('inlines a repo SVG as a data URL', () => {
    expect(assetSrc('../../packages/perron/icons/plus.svg', 'docs/foundations/icons.md')).toMatch(
      /^data:image\/svg\+xml;base64,/,
    )
  })

  it('leaves a URL or a missing file as it is', () => {
    expect(assetSrc('https://example.org/a.svg', 'docs/x.md')).toBe('https://example.org/a.svg')
    expect(assetSrc('missing.svg', 'docs/x.md')).toBe('missing.svg')
  })
})
