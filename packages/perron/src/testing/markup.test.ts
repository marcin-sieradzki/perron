import { describe, expect, it } from 'vitest'
import { attribute, heardMarkup } from './markup.ts'

describe('heardMarkup', () => {
  it('reads the text outside every aria-hidden element, white space collapsed', () => {
    expect(
      heardMarkup(
        '<p class="a"><svg aria-hidden="true"><path d="M0 0"/><title>Tick</title></svg>  Running\n normally<span aria-hidden="true">—<b>x</b></span><span>.</span></p>',
      ),
    ).toBe('Running normally.')
  })

  it('reads character references and void elements', () => {
    expect(heardMarkup('<span>Fish &amp; chips<br/> at Nørreport&#x27;s</span>')).toBe(
      "Fish & chips at Nørreport's",
    )
  })

  it('hides what nests in a hidden element of the same name', () => {
    expect(heardMarkup('<span aria-hidden="true"><span>a</span>b</span><span>c</span>')).toBe('c')
  })
})

describe('attribute', () => {
  it('reads one attribute of the first tag, character references read back', () => {
    const markup =
      '<div class="pn-Meter" aria-valuetext="Fish &amp; chips" data-unknown=""><span id="x">'
    expect(attribute(markup, 'class')).toBe('pn-Meter')
    expect(attribute(markup, 'aria-valuetext')).toBe('Fish & chips')
    expect(attribute(markup, 'data-unknown')).toBe('')
  })

  it('is undefined for an attribute the first tag lacks, even if a later tag has it', () => {
    expect(attribute('<div class="a"><span id="x">', 'id')).toBeUndefined()
  })

  it('does not take a longer name ending in the one asked for', () => {
    expect(attribute('<circle stroke-width="2">', 'width')).toBeUndefined()
  })
})
