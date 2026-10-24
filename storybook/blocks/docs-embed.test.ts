// A docs page shows each story's first render and leaves its play to the tests. For a story in its
// own iframe, `.storybook/preview.ts` gets that from two Storybook internals; these tests go red
// when an upgrade moves either one, so the docs pages never quietly start running play again.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const read = (file: string) => readFileSync(file, 'utf8')
const root = join(import.meta.dirname, '../..')

describe('docs page stories render without play', () => {
  it('preview.ts points the docs iframes at embed mode, and keeps inline stories from autoplay', () => {
    const preview = read(join(root, '.storybook/preview.ts'))
    expect(preview).toContain(
      "Object.assign(globalThis, { PREVIEW_URL: 'iframe.html?embed=true' })",
    )
    expect(preview).toMatch(/docs: \{ story: \{ autoplay: false \} \}/)
  })

  it("addon-docs loads a story's iframe from PREVIEW_URL, keeping its query", () => {
    const blocks = read(require.resolve('@storybook/addon-docs/blocks'))
    expect(blocks).toMatch(/baseUrl = globalThis\.PREVIEW_URL \|\| "iframe\.html"/)
    expect(blocks).toMatch(/new URLSearchParams\(paramsStr/)
    expect(blocks).toMatch(/src: getStoryHref\(story\.id, \{ viewMode: "story" \}\)/)
  })

  it('Storybook skips play in embed mode', () => {
    const runtime = read(
      join(require.resolve('storybook/package.json'), '../dist/preview/runtime.js'),
    )
    expect(runtime).toMatch(
      /get\("embed"\) === "true", shouldAutoplay = \(\{ search \}\) => !shouldEmbed/,
    )
  })
})
