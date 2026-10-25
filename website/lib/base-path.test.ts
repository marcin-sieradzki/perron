import { describe, expect, it } from 'vitest'
import { SITE } from '../../scripts/lib/site.ts'
import { BASE_PATH } from './base-path.ts'
import { STORYBOOK_URL } from './spec.ts'

describe('the base path', () => {
  it('is the path GitHub Pages serves the site at, the one llms.txt and AGENTS.md link', () => {
    expect(new URL(SITE).pathname).toBe(`${BASE_PATH}/`)
  })

  it('holds Storybook under storybook/', () => {
    expect(STORYBOOK_URL).toBe(`${SITE}storybook/`)
  })
})
