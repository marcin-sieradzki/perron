// IntentIcon draws each status intent's icon as its file in packages/perron/icons/, inlined
// unchanged but for width and height and hidden from the ear, and nothing for neutral
// (docs/components/alert.md, CR-4).
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { drawing } from '../../testing/markup.ts'
import { IntentIcon } from './IntentIcon.tsx'

const iconFile = (name: string) =>
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), `../../../icons/${name}.svg`), 'utf8')

describe('IntentIcon', () => {
  it.each([
    ['success', 'check-circle'],
    ['warning', 'warning'],
    ['danger', 'exclamation-circle'],
    ['info', 'info-circle'],
  ] as const)('draws %s as the %s file, unchanged but for width and height', (color, name) => {
    const svg = renderToStaticMarkup(<IntentIcon color={color} />)
    expect(drawing(svg)).toEqual(drawing(iconFile(name)))
    expect(svg).toMatch(/^<svg [^>]*class="perron-icon pn-IntentIcon"/)
    expect(svg).toMatch(/^<svg [^>]*aria-hidden="true"/)
    expect(svg).toMatch(/^<svg [^>]*focusable="false"/)
    expect(svg).not.toMatch(/^<svg [^>]*\s(width|height)=/)
  })

  it("joins a component's class after its own", () => {
    const svg = renderToStaticMarkup(<IntentIcon color="info" className="pn-SeverityLabel-icon" />)
    expect(svg).toMatch(/^<svg [^>]*class="perron-icon pn-IntentIcon pn-SeverityLabel-icon"/)
    expect(drawing(svg)).toEqual(drawing(iconFile('info-circle')))
  })

  it('draws nothing for neutral', () => {
    expect(renderToStaticMarkup(<IntentIcon color="neutral" />)).toBe('')
  })
})
