import { describe, expect, it } from 'vitest'
import { stateRulesIn, withoutState, type SheetRule } from './stories.ts'

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

describe('stateRulesIn', () => {
  // a stand-in element that matches every selector, and declarations told apart by name
  const element = { matches: () => true }
  const style = (name: string) => ({ name }) as unknown as CSSStyleDeclaration
  const rule = (selectorText: string, name: string): SheetRule => ({
    selectorText,
    style: style(name),
  })
  const media = (conditionText: string, ...cssRules: SheetRule[]): SheetRule => ({
    conditionText,
    cssRules,
  })
  const sheets = [
    {
      cssRules: [
        rule('.pn-Radio:active', 'press'),
        media('(hover: hover)', rule('.pn-Radio:hover', 'hover')),
        media('(forced-colors: active)', rule('.pn-Radio:active', 'reset')),
        media('(forced-colors: active)', media('(hover: hover)', rule('.pn-Radio:hover', 'reset'))),
      ],
    },
  ]

  it("reads a state's rules, hover only inside (hover: hover)", () => {
    expect(stateRulesIn(sheets, element, ':active')).toEqual([style('press')])
    expect(stateRulesIn(sheets, element, ':hover')).toEqual([style('hover')])
  })

  it('leaves the forced-colours reset aside, which a story never renders in', () => {
    const names = [':active', ':hover'].flatMap((pseudo) =>
      stateRulesIn(sheets, element, pseudo as ':active' | ':hover').map(
        (s) => (s as unknown as { name: string }).name,
      ),
    )
    expect(names).not.toContain('reset')
  })
})
