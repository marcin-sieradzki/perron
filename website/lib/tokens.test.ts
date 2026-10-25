import { describe, expect, it } from 'vitest'
import {
  cssVar,
  readResolvedTokens,
  readToken,
  readTokenData,
  tokenCount,
  tokenNumber,
  tokensUnder,
} from './tokens.ts'

describe('readTokenData', () => {
  it('lists every shipped token with its custom property and values', () => {
    expect(tokenCount()).toBe(readTokenData().length)
    expect(tokenCount()).toBeGreaterThan(100)
    expect(readToken('color.text.primary')).toMatchObject({
      cssVar: '--perron-color-text-primary',
      values: { light: expect.any(Object), dark: expect.any(Object) },
    })
    expect(tokensUnder('color.map.').every((t) => t.name.startsWith('color.map.'))).toBe(true)
  })
})

describe('readResolvedTokens', () => {
  it('resolves the token sources with their themes', () => {
    expect(Object.keys(readResolvedTokens().themes)).toEqual(
      expect.arrayContaining(['light', 'dark']),
    )
  })
})

describe('cssVar', () => {
  it('names the custom property', () => {
    expect(cssVar('map.dot-radius.metro')).toBe('var(--perron-map-dot-radius-metro)')
  })
})

describe('tokenNumber', () => {
  it('reads a dimension in px and a duration in ms', () => {
    expect(tokenNumber('map.dot-radius.metro')).toBeGreaterThan(0)
    expect(tokenNumber('duration.report-pulse')).toBeGreaterThan(100)
  })

  it('throws for an unknown token or one that is not one number', () => {
    expect(() => tokenNumber('map.nothing')).toThrow('No token map.nothing')
    expect(() => tokenNumber('vehicle-dot.timetable.dash')).toThrow(/not a single number/)
  })
})
