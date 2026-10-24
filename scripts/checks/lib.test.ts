import { describe, expect, it } from 'vitest'
import { allowances, excuse } from './lib.ts'

describe('perron-allow', () => {
  it('excuses its own line and the line below for its rule only', () => {
    const text =
      'a\n/* perron-allow(component-css): the map reads it */\nb\nc /* perron-allow(props): x */'
    expect([...allowances(text, 'component-css', 'f').lines]).toEqual([2, 3])
    expect([...allowances(text, 'props', 'f').lines]).toEqual([4, 5])
  })

  it('reads the HTML comment form in Markdown', () => {
    const text = '<!-- perron-allow(paths): written by phase 4 -->\nsee `x/y.md`'
    expect([...allowances(text, 'paths', 'f').lines]).toEqual([1, 2])
  })

  it('needs a reason', () => {
    const { lines, problems } = allowances('/* perron-allow(props) */', 'props', 'f')
    expect(lines.size).toBe(0)
    expect(problems).toEqual([
      { file: 'f', line: 1, message: 'perron-allow(props) needs a reason' },
    ])
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
})
