import { describe, expect, it } from 'vitest'
import { SITE } from '../../scripts/lib/site.ts'
import { BASE_PATH } from './base-path.ts'

describe('the base path', () => {
  it('is the path GitHub Pages serves the site at, the one llms.txt and AGENTS.md link', () => {
    expect(new URL(SITE).pathname).toBe(`${BASE_PATH}/`)
  })
})
