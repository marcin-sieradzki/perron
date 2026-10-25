import { describe, expect, it } from 'vitest'
import { withoutState } from './stories.ts'

describe('withoutState', () => {
  it('turns a state selector into one that matches the element at rest', () => {
    expect(withoutState('.pn-Button:hover', ':hover')).toBe('.pn-Button:is(*)')
  })

  it('keeps the selector valid when the state starts it or sits in a :not()', () => {
    // `:hover > .x` without its `:hover` would start with a combinator, an invalid selector
    expect(withoutState(':hover > .pn-Box', ':hover')).toBe(':is(*) > .pn-Box')
    expect(withoutState('.pn-Box:not(:active)', ':active')).toBe('.pn-Box:not(:is(*))')
  })
})
