import { describe, expect, it } from 'vitest'
import { readSources } from '../build-tokens.ts'
import { inlinePointers, validateSources } from './spec.ts'
import type { TokenSources } from './tokens.ts'

const resolver = {
  version: '2025.10',
  sets: { base: { sources: [{ $ref: 'base.tokens.json' }] } },
  modifiers: {},
  resolutionOrder: [{ $ref: '#/sets/base' }],
}
const check = (base: Record<string, unknown>) =>
  validateSources({ resolver, files: { 'base.tokens.json': base } } as TokenSources)
const px = (value: number) => ({ value, unit: 'px' })
const red = { colorSpace: 'srgb', components: [1, 0, 0], hex: '#FF0000' }

describe('format 2025.10', () => {
  it('passes the Perron token files', () => {
    expect(validateSources(readSources())).toEqual([])
  })

  it('passes every type in its valid form', () => {
    expect(
      check({
        c: { $type: 'color', $value: red },
        d: { $type: 'dimension', $value: { value: 1.5, unit: 'rem' } },
        f: { $type: 'fontFamily', $value: ['Inter', 'sans-serif'] },
        w: { $type: 'fontWeight', $value: 'semi-bold' },
        t: { $type: 'duration', $value: { value: 200, unit: 'ms' } },
        e: { $type: 'cubicBezier', $value: [0.2, -1, 0.2, 2] },
        n: { $type: 'number', $value: 1.5 },
        s: { $type: 'strokeStyle', $value: { dashArray: ['{d}', px(2)], lineCap: 'round' } },
        sh: {
          $type: 'shadow',
          $value: [{ color: '{c}', offsetX: px(0), offsetY: px(1), blur: px(2), spread: px(0) }],
        },
        ty: {
          $type: 'typography',
          $value: {
            fontFamily: '{f}',
            fontSize: '{d}',
            fontWeight: 400,
            letterSpacing: px(0),
            lineHeight: '{n}',
          },
        },
        alias: { $value: '{c}' },
      }),
    ).toEqual([])
  })

  it.each([
    ['a name with a period', { 'a.b': { $type: 'number', $value: 1 } }, /must not contain/],
    ['an unknown type', { a: { $type: 'colour', $value: 1 } }, /unknown \$type/],
    ['a token without a type', { a: { $value: 1 } }, /no \$type/],
    ['a token that is also a group', { a: { $type: 'number', $value: 1, b: {} } }, /cannot also/],
    ['an em dimension', { a: { $type: 'dimension', $value: { value: 1, unit: 'em' } } }, /unit/],
    ['a hex colour string', { a: { $type: 'color', $value: '#FF0000' } }, /colorSpace/],
    [
      'a hex that is not the colour',
      { a: { $type: 'color', $value: { ...red, hex: '#FE0000' } } },
      /does not match/,
    ],
    ['an alpha above 1', { a: { $type: 'color', $value: { ...red, alpha: 2 } } }, /alpha/],
    ['a weight keyword in capitals', { a: { $type: 'fontWeight', $value: 'Bold' } }, /weight/],
    ['an easing x outside 0 to 1', { a: { $type: 'cubicBezier', $value: [2, 0, 1, 1] } }, /x in/],
    [
      'a dash without a line cap',
      { a: { $type: 'strokeStyle', $value: { dashArray: [px(2)] } } },
      /lineCap/,
    ],
    [
      'a typography role with an extra sub-value',
      {
        a: {
          $type: 'typography',
          $value: {
            fontFamily: 'Inter',
            fontSize: px(14),
            fontWeight: 400,
            letterSpacing: px(0),
            lineHeight: 1.4,
            textTransform: 'uppercase',
          },
        },
      },
      /unknown sub-value textTransform/,
    ],
    [
      'a reference of the wrong type',
      { n: { $type: 'number', $value: 1 }, a: { $type: 'dimension', $value: '{n}' } },
      /is a number, expected a dimension/,
    ],
    ['a reference to nothing', { a: { $type: 'number', $value: '{b}' } }, /not a token/],
    [
      'an extension key without a domain',
      { a: { $type: 'number', $value: 1, $extensions: { x: 1 } } },
      /reverse domain/,
    ],
  ])('rejects %s', (_, tree, problem) => {
    const problems = check(tree)
    expect(problems.join('\n')).toMatch(problem)
  })
})

describe('JSON Pointer references', () => {
  it('inline the value they point at', () => {
    const file = {
      ink: { $type: 'color', $value: red },
      hover: {
        $type: 'color',
        $value: {
          colorSpace: 'srgb',
          components: { $ref: '#/ink/$value/components' },
          alpha: 0.05,
          hex: '#FF0000',
        },
      },
    }
    expect(inlinePointers(file).hover).toEqual({
      $type: 'color',
      $value: { ...red, alpha: 0.05 },
    })
    expect(check(file)).toEqual([])
  })

  it('reject pointers to nothing and cycles', () => {
    expect(() => inlinePointers({ a: { $ref: '#/b' } })).toThrow(/points at nothing/)
    expect(() => inlinePointers({ a: { $ref: '#/b' }, b: { $ref: '#/a' } })).toThrow(/cycle/)
  })
})
