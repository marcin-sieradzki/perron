import { PNG } from 'pngjs'
import { describe, expect, it } from 'vitest'
import type { CodeMap, Layer } from '../checks/penpot.ts'
import {
  compare,
  expectations,
  drivenStates,
  pixelDiff,
  renderReport,
  sameCss,
  type Measured,
} from './visual.ts'

const root: Layer = {
  name: 'Swatch',
  type: 'board',
  id: 'r',
  size: { width: 34, height: 34 },
  fills: ['#ffffff'],
  strokes: [{ color: '#12181b', width: 1 }],
  radius: [8, 8, 8, 8],
  layout: { type: 'flex', rowGap: 0, columnGap: 0, padding: [8, 8, 8, 8] },
  tokens: {
    fill: 'color.surface.raised',
    strokeWidth: 'border.width.025',
    paddingLeft: 'space.200',
    borderRadiusTopLeft: 'radius.md',
  },
  children: [
    {
      name: 'label',
      type: 'text',
      id: 'l',
      size: { width: 40, height: 20 },
      fills: ['#12181b'],
      strokes: [],
      tokens: { fill: 'color.text.primary' },
    },
    {
      name: 'ghost',
      type: 'rect',
      id: 'g',
      hidden: true,
      size: { width: 1, height: 1 },
      fills: [],
      strokes: [],
      tokens: {},
    },
  ],
}
const map: CodeMap = {
  component: 'Swatch',
  properties: {},
  layers: { Swatch: 'root', label: 'label', ghost: 'ghost' },
}
const values: Record<string, string> = {
  'color.surface.raised': '#FFFFFF',
  'border.width.025': '1px',
  'space.200': '8px',
  'radius.md': '8px',
  'color.text.primary': '#12181B',
}

describe('expectations', () => {
  const list = expectations('Swatch', root, map, (t) => values[t])

  it("expects each visible part's size and each bound token's value on its CSS properties", () => {
    expect(list).toEqual([
      {
        part: 'root',
        selector: '.pn-Swatch',
        check: 'width',
        expected: '34px',
        properties: ['width'],
      },
      {
        part: 'root',
        selector: '.pn-Swatch',
        check: 'height',
        expected: '34px',
        properties: ['height'],
      },
      {
        part: 'root',
        selector: '.pn-Swatch',
        check: 'fill',
        token: 'color.surface.raised',
        expected: '#FFFFFF',
        properties: ['background-color'],
      },
      {
        part: 'root',
        selector: '.pn-Swatch',
        check: 'strokeWidth',
        token: 'border.width.025',
        expected: '1px',
        properties: [
          'border-top-width',
          'border-right-width',
          'border-bottom-width',
          'border-left-width',
        ],
      },
      {
        part: 'root',
        selector: '.pn-Swatch',
        check: 'paddingLeft',
        token: 'space.200',
        expected: '8px',
        properties: ['padding-left'],
      },
      {
        part: 'root',
        selector: '.pn-Swatch',
        check: 'borderRadiusTopLeft',
        token: 'radius.md',
        expected: '8px',
        properties: ['border-top-left-radius'],
      },
      {
        part: 'label',
        selector: '.pn-Swatch-label',
        check: 'width',
        expected: '40px',
        properties: ['width'],
      },
      {
        part: 'label',
        selector: '.pn-Swatch-label',
        check: 'height',
        expected: '20px',
        properties: ['height'],
      },
      {
        part: 'label',
        selector: '.pn-Swatch-label',
        check: 'fill',
        token: 'color.text.primary',
        expected: '#12181B',
        properties: ['color'],
      },
    ])
  })
})

describe('sameCss', () => {
  it('matches a hex token against the rgb() a browser computes', () => {
    expect(sameCss('#12181B', 'rgb(18, 24, 27)')).toBe(true)
    expect(sameCss('#12181B', 'rgb(18, 24, 28)')).toBe(false)
  })

  it('matches a translucent token by its alpha', () => {
    expect(sameCss('rgba(18, 24, 27, 0.05)', 'rgba(18, 24, 27, 0.05)')).toBe(true)
    expect(sameCss('rgba(18, 24, 27, 0.05)', 'rgb(18, 24, 27)')).toBe(false)
  })

  it('matches lengths in px', () => {
    expect(sameCss('8px', '8px')).toBe(true)
    expect(sameCss('8px', '6px')).toBe(false)
  })
})

describe('compare', () => {
  const list = expectations('Swatch', root, map, (t) => values[t])
  const measured: Measured = {
    '.pn-Swatch': {
      width: 34.5,
      height: 36,
      styles: {
        'background-color': 'rgb(255, 255, 255)',
        'border-top-width': '1px',
        'border-right-width': '1px',
        'border-bottom-width': '2px',
        'border-left-width': '1px',
        'padding-left': '8px',
        'border-top-left-radius': '8px',
      },
    },
  }
  const rows = compare(list, measured)

  it('passes a size within 1 px and fails one further off', () => {
    expect(rows.slice(0, 2)).toEqual([
      { part: 'root', check: 'width', expected: '34px', measured: '34.5px', pass: true },
      { part: 'root', check: 'height', expected: '34px', measured: '36px', pass: false },
    ])
  })

  it('fails a token whose value any side misses, and shows each value measured', () => {
    expect(rows[3]).toEqual({
      part: 'root',
      check: 'strokeWidth (border.width.025)',
      expected: '1px',
      measured: '1px / 2px',
      pass: false,
    })
  })

  it('fails every check of a part that is not rendered', () => {
    expect(rows.filter((r) => r.part === 'label')).toEqual([
      { part: 'label', check: 'width', expected: '40px', measured: 'not rendered', pass: false },
      { part: 'label', check: 'height', expected: '20px', measured: 'not rendered', pass: false },
      {
        part: 'label',
        check: 'fill (color.text.primary)',
        expected: '#12181B',
        measured: 'not rendered',
        pass: false,
      },
    ])
  })
})

describe('drivenStates', () => {
  const states: CodeMap = {
    component: 'Swatch',
    properties: {
      State: {
        state: {
          default: null,
          hover: ':hover',
          focus: ':focus-visible',
          pressed: ':active',
          disabled: '[data-disabled]',
        },
      },
    },
    layers: {},
  }

  it("drives the interaction a variant's State maps to", () => {
    expect(drivenStates(states, { State: 'hover' })).toEqual(['hover'])
    expect(drivenStates(states, { State: 'focus' })).toEqual(['focus'])
    expect(drivenStates(states, { State: 'pressed' })).toEqual(['press'])
  })

  it('drives nothing for rest or an attribute state, which the story sets', () => {
    expect(drivenStates(states, { State: 'default' })).toEqual([])
    expect(drivenStates(states, { State: 'disabled' })).toEqual([])
  })
})

/** A PNG of `width` × `height` in one colour. */
function png(width: number, height: number, rgba: [number, number, number, number]) {
  const image = new PNG({ width, height })
  for (let i = 0; i < width * height; i++) image.data.set(rgba, i * 4)
  return PNG.sync.write(image)
}

describe('pixelDiff', () => {
  it('finds no difference between two same images', () => {
    expect(pixelDiff(png(4, 4, [0, 0, 0, 255]), png(4, 4, [0, 0, 0, 255])).percent).toBe(0)
  })

  it('counts the pixels that differ, over the larger of two sizes', () => {
    const { percent, diff } = pixelDiff(png(4, 4, [0, 0, 0, 255]), png(4, 2, [0, 0, 0, 255]))
    expect(percent).toBe(50)
    expect(PNG.sync.read(diff).width).toBe(4)
  })
})

describe('renderReport', () => {
  it('writes a table per variant and theme, with what failed in bold', () => {
    const md = renderReport({
      component: 'Swatch',
      generatedAt: '2026-10-24T09:00:00.000Z',
      storybook: 'http://localhost:6006',
      pass: false,
      stale: ['Brand'],
      runs: [
        {
          variant: 'Brand',
          theme: 'dark',
          story: 'components-swatch--brand',
          pass: false,
          pixelDiff: 1.25,
          diffImage: 'Brand.dark.diff.png',
          rows: [{ part: 'root', check: 'width', expected: '34px', measured: '36px', pass: false }],
        },
      ],
    })
    expect(md).toContain('### Brand, dark: fails')
    expect(md).toContain('| `root` | width | 34px | 36px | **no** |')
    expect(md).toContain('Pixel difference: 1.25% ([diff](Brand.dark.diff.png))')
    expect(md).toContain('The light export of Brand does not match the read-back')
  })
})
