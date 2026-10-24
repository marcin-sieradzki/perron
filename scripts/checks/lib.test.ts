import { describe, expect, it } from 'vitest'
import { allowanceProblems, allowances, byFileLine, excuse, section, tableRows } from './lib.ts'

describe('perron-allow', () => {
  it('excuses its own line and the line below for its rule only', () => {
    const text =
      'a\n/* perron-allow(component-css): the map reads it */\nb\nc /* perron-allow(props): x */'
    expect([...allowances(text, 'component-css')]).toEqual([2, 3])
    expect([...allowances(text, 'props')]).toEqual([4, 5])
  })

  it('reads the HTML comment form in Markdown', () => {
    const text = '<!-- perron-allow(paths): written by phase 4 -->\nsee `x/y.md`'
    expect([...allowances(text, 'paths')]).toEqual([1, 2])
  })

  it('excuses nothing without a reason', () => {
    expect(allowances('/* perron-allow(props) */', 'props').size).toBe(0)
  })

  it('drops excused problems and keeps the rest', () => {
    const files: Record<string, string> = { f: 'x\n/* perron-allow(props): ok */\ny' }
    const kept = excuse(
      [
        { file: 'f', line: 1, message: 'one' },
        { file: 'f', line: 3, message: 'two' },
      ],
      'props',
      (f) => files[f],
    )
    expect(kept).toEqual([{ file: 'f', line: 1, message: 'one' }])
  })

  it('names each allowance with no reason or a rule no check has', () => {
    const text = [
      '/* perron-allow(props): the map canvas */',
      '/* perron-allow(props) */',
      '<!-- perron-allow(pahts): a typo -->',
    ].join('\n')
    expect(allowanceProblems(text, 'f', ['paths', 'props'])).toEqual([
      { file: 'f', line: 2, message: 'perron-allow(props) needs a reason' },
      {
        file: 'f',
        line: 3,
        message: 'perron-allow(pahts) names no rule; the rules are paths, props',
      },
    ])
  })
})

describe('the problem order', () => {
  it('sorts by file, then line', () => {
    const problems = [
      { file: 'b', line: 1, message: '' },
      { file: 'a', line: 9, message: '' },
      { file: 'a', message: '' },
      { file: 'a', line: 2, message: '' },
    ]
    expect(problems.sort(byFileLine).map((p) => `${p.file}${p.line ?? ''}`)).toEqual([
      'a',
      'a2',
      'a9',
      'b1',
    ])
  })
})

describe('the contract readers', () => {
  const contract = [
    '## Props',
    '',
    '| Prop | Type |',
    '| ---- | ---- |',
    "| `size` | `'small' \\| 'large'` |",
    '',
    '### Intents',
    '',
    'Text.',
    '',
    '## CSS',
    '',
    '- Tokens only.',
  ].join('\n')

  it('reads a section up to the next heading of its level', () => {
    expect(section(contract, 'Props')).toContain('### Intents')
    expect(section(contract, 'Intents').trim()).toBe('Text.')
    expect(section(contract, 'CSS').trim()).toBe('- Tokens only.')
  })

  it('names a heading the contract does not have', () => {
    expect(() => section(contract, 'Words')).toThrow(
      'docs/components/README.md has no "Words" heading',
    )
  })

  it("reads a table's body rows, with escaped pipes as pipes", () => {
    expect(tableRows(section(contract, 'Props'))).toEqual([['`size`', "`'small' | 'large'`"]])
  })
})
