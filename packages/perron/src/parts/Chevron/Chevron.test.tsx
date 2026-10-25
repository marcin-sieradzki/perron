// Chevron draws the chevron-down icon as its file in packages/perron/icons/, inlined unchanged but
// for width and height and hidden from the ear (docs/components/README.md, "Shared parts").
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { drawing } from '../../testing/markup.ts'
import { Chevron } from './Chevron.tsx'

const iconFile = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../../icons/chevron-down.svg'),
  'utf8',
)

describe('Chevron', () => {
  it('draws the chevron-down file, unchanged but for width and height, hidden from the ear', () => {
    const svg = renderToStaticMarkup(<Chevron />)
    // the file's xmlns too, which inline SVG in HTML doesn't need and Select drew without
    expect(drawing(svg)).toEqual(drawing(iconFile.replace(/\sxmlns="[^"]*"/, '')))
    expect(svg).toMatch(/^<svg [^>]*class="perron-icon pn-Chevron"/)
    expect(svg).toMatch(/^<svg [^>]*aria-hidden="true"/)
    expect(svg).toMatch(/^<svg [^>]*focusable="false"/)
    expect(svg).not.toMatch(/^<svg [^>]*\s(width|height)=/)
  })
})
