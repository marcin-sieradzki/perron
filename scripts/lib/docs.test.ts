import { describe, expect, it } from 'vitest'
import { readSources } from '../build-tokens.ts'
import { documentedTokens, fillTables } from './docs.ts'
import { loadTokens } from './tokens.ts'

const tokens = loadTokens(readSources())
const tokenBlock = (patterns: string) => `<!-- tokens: ${patterns} -->\nold\n<!-- /tokens -->`
const contrastBlock = (spec: string) => `<!-- contrast ${spec} -->\nold\n<!-- /contrast -->`

describe('doc tables', () => {
  it('show each theme, the alias and the use', () => {
    const md = fillTables(tokenBlock('color.text.primary'), tokens)
    expect(md).not.toContain('old')
    expect(md).toContain(
      '| `color.text.primary` | `#12181B` (palette.neutral.900) | `#EBEEEB` (palette.neutral.100) | Main text',
    )
  })

  it('add a column for a modifier context that changes a token', () => {
    expect(fillTables(tokenBlock('duration.sheet'), tokens)).toMatch(
      /\| Reduced motion \|[\s\S]*\| `0.01ms` \|/,
    )
  })

  it('run numbered siblings in number order and patterns in their own order', () => {
    expect(documentedTokens(tokenBlock('radius.xs space.*'), tokens).slice(0, 3)).toEqual([
      'radius.xs',
      'space.050',
      'space.100',
    ])
  })

  it('mark a contrast below the minimum', () => {
    const md = fillTables(
      contrastBlock('4.5: color.text.tertiary on color.surface.default'),
      tokens,
    )
    expect(md).toContain('| `color.text.tertiary` | 3.85:1 (miss) | 4.48:1 (miss) |')
  })

  it('reject a pattern that matches nothing and a translucent background', () => {
    expect(() => fillTables(tokenBlock('color.nope.*'), tokens)).toThrow(/No token matches/)
    expect(() =>
      fillTables(contrastBlock('3: color.border.control on color.surface.overlay'), tokens),
    ).toThrow(/translucent/)
  })
})
