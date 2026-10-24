import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { base, theme } from '../../packages/perron/tokens/generated/tokens.ts'
import { iconGrid, readIcons, readLogos } from './assets.ts'
import { PACKAGE } from './paths.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..', PACKAGE)
const attr = (svg: string, name: string) => new RegExp(`<svg[^>]* ${name}="([^"]*)"`).exec(svg)?.[1]

describe('icons', () => {
  const icons = readIcons(root)

  it.each(icons.map((i) => [i.name, i] as const))('%s follows the icon style', (_, icon) => {
    const grid = iconGrid(icon.svg)
    expect([14, 16, 18]).toContain(grid)
    expect([attr(icon.svg, 'width'), attr(icon.svg, 'height')]).toEqual([`${grid}`, `${grid}`])
    expect(attr(icon.svg, 'fill')).toBe('none')
    expect(attr(icon.svg, 'stroke')).toBe('currentColor')
    expect(attr(icon.svg, 'stroke-linecap')).toBe('round')
    expect(attr(icon.svg, 'stroke-linejoin')).toBe('round')
    const stroke = Number(attr(icon.svg, 'stroke-width'))
    expect(stroke).toBeGreaterThanOrEqual(1.5)
    expect(stroke).toBeLessThanOrEqual(1.8)
    // a colour other than currentColor would ignore the text around the icon
    expect(icon.svg).not.toMatch(/#[0-9a-f]{3}|rgb\(/i)
  })

  it.each(icons.map((i) => [i.name, i] as const))(
    '%s renders at an icon size near its grid',
    (_, icon) => {
      const size = base[icon.size as keyof typeof base]
      expect(icon.size).toMatch(/^icon\.size\./)
      expect(Math.abs(parseFloat(size) - iconGrid(icon.svg)!)).toBeLessThanOrEqual(2)
    },
  )
})

describe('logos', () => {
  it.each(readLogos(root).map((l) => [l.name, l] as const))(
    '%s is drawn in its theme’s colours',
    (_, logo) => {
      const t = { ...base, ...theme[logo.theme as keyof typeof theme] }
      const colours = [...logo.svg.matchAll(/(?:fill|stroke)="(#[0-9A-F]{6})"/gi)].map((m) =>
        m[1].toUpperCase(),
      )
      expect(colours).toEqual([
        t['color.transit.mode.bus'],
        t['color.transit.line.a'],
        t['color.text.primary'],
      ])
    },
  )
})

describe('manifests', () => {
  const tree = (manifest: object, files: string[]) => {
    const d = mkdtempSync(join(tmpdir(), 'perron-'))
    mkdirSync(join(d, 'icons'))
    writeFileSync(join(d, 'icons/icons.json'), JSON.stringify(manifest))
    for (const f of files) writeFileSync(join(d, 'icons', `${f}.svg`), '<svg/>')
    return d
  }

  it('reject a file the manifest does not list', () => {
    expect(() => readIcons(tree({ Map: {} }, ['plus']))).toThrow(/does not list plus/)
  })

  it('reject an entry with no file', () => {
    const manifest = { Map: { plus: { size: 'icon.size.400', use: 'Zoom in' } } }
    expect(() => readIcons(tree(manifest, []))).toThrow(/plus, which has no file/)
  })
})
