import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { exportPath, layerOf, storyTitle, variantName, visualPath } from './design.ts'

describe('variantName', () => {
  it("joins a variant's property values in the read-back's order, each in PascalCase", () => {
    expect(
      variantName({ variant: ['solid'], State: ['hover'] }, { State: 'hover', variant: 'solid' }),
    ).toBe('SolidHover')
  })

  it('turns a multi-word value into one PascalCase word', () => {
    expect(variantName({ size: ['extra-large'] }, { size: 'extra-large' })).toBe('ExtraLarge')
  })

  it('names the one variant of a component without variants Default', () => {
    expect(variantName({}, {})).toBe('Default')
  })
})

describe('exportPath', () => {
  it("is the variant's PNG beside the read-back, per theme", () => {
    expect(exportPath('DatePicker', 'SolidHover', 'dark')).toBe(
      'penpot/date-picker/SolidHover.dark.png',
    )
  })
})

describe('storyTitle', () => {
  it("is the layer's Storybook folder and the name", () => {
    expect(storyTitle('Button', 'component')).toBe('Components/Button')
    expect(storyTitle('DepartureRow', 'pattern')).toBe('Patterns/DepartureRow')
  })
})

describe('visualPath', () => {
  it("is the visual stage's folder in the component's loop state", () => {
    expect(visualPath('DatePicker')).toBe('components/date-picker/visual')
  })
})

describe('layerOf', () => {
  const tree = (files: Record<string, unknown>) => {
    const root = mkdtempSync(join(tmpdir(), 'perron-layer-'))
    for (const [rel, json] of Object.entries(files)) {
      mkdirSync(dirname(join(root, rel)), { recursive: true })
      writeFileSync(join(root, rel), JSON.stringify(json))
    }
    return root
  }
  const entry = {
    name: 'DepartureRow',
    layer: 'pattern',
    category: 'Travel',
    status: 'designing',
    baseUiParts: [],
    penpotPath: 'Patterns/DepartureRow',
    dependsOn: [],
  }

  it("is the registry entry's layer, else the Penpot page's, else a component", () => {
    const roots = [
      tree({ 'packages/perron/components.json': [entry] }),
      tree({ 'penpot/departure-row.json': { page: 'Patterns/DepartureRow' } }),
      tree({}),
    ]
    expect(roots.map((root) => layerOf({ root }, 'DepartureRow'))).toEqual([
      'pattern',
      'pattern',
      'component',
    ])
    for (const root of roots) rmSync(root, { recursive: true })
  })
})
