import { describe, expect, it } from 'vitest'
import { SITE } from '../../scripts/lib/site.ts'
import { BASE_PATH } from './base-path.ts'

describe('the base path', () => {
  it('is the path the site is served at, the one llms.txt and AGENTS.md link', () => {
    expect(new URL(SITE).pathname).toBe(`${BASE_PATH}/`)
  })

  it.skipIf(process.env.PERRON_SITE_URL)("is GitHub Pages' project site by default", () => {
    expect(SITE).toBe('https://marcin-sieradzki.github.io/perron/')
    expect(BASE_PATH).toBe('/perron')
  })
})
