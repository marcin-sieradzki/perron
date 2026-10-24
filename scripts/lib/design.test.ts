import { describe, expect, it } from 'vitest'
import { exportPath, storyTitle, variantName } from './design.ts'

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
