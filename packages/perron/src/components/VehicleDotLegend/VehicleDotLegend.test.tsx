// VehicleDotLegend inlines the aircraft file's drawing unchanged and hides it from the ear, and
// says "Planes" in each locale only with aircraftVisible (CR-10).
// Spec: docs/components/vehicle-dot-legend.md.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PerronProvider } from '../../PerronProvider.tsx'
import { drawing, heardMarkup } from '../../testing/markup.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { VehicleDotLegend } from './VehicleDotLegend.tsx'

const iconFile = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../../icons/aircraft.svg'),
  'utf8',
)

describe('VehicleDotLegend', () => {
  it('draws the aircraft file, unchanged but for width, height and xmlns, hidden from the ear', () => {
    const markup = renderToStaticMarkup(<VehicleDotLegend aircraftVisible />)
    const svg = markup.match(
      /<svg [^>]*class="perron-icon pn-VehicleDotLegend-aircraft"[\s\S]*?<\/svg>/,
    )
    expect(svg).not.toBeNull()
    expect(drawing(svg![0])).toEqual(drawing(iconFile.replace(/\sxmlns="[^"]*"/, '')))
    expect(svg![0]).toMatch(/^<svg [^>]*aria-hidden="true"/)
    expect(svg![0]).toMatch(/^<svg [^>]*focusable="false"/)
    expect(svg![0]).not.toMatch(/^<svg [^>]*\s(width|height)=/)
  })

  it.each([
    ['en', 'Planes'],
    ['da', 'Fly'],
    ['sv', 'Flygplan'],
    ['nb', 'Fly'],
  ] as const)('says the aircraft in %s as “%s”, after the five states', (locale, word) => {
    const markup = renderToStaticMarkup(
      <PerronProvider locale={locale}>
        <VehicleDotLegend aircraftVisible />
      </PerronProvider>,
    )
    expect(heardMarkup(markup).endsWith(word)).toBe(true)
    expectOwnedStrings(markup, locale, [])
  })

  it('renders neither the glyph nor its word without aircraftVisible', () => {
    const markup = renderToStaticMarkup(<VehicleDotLegend aircraftLabel="Aircraft" />)
    expect(markup).not.toContain('pn-VehicleDotLegend-aircraft')
    expect(markup).not.toContain('Aircraft')
    expect(markup).not.toMatch(/aircraft(visible|label)/i)
  })
})
