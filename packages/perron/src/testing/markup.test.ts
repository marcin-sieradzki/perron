import { describe, expect, it } from 'vitest'
import { heardMarkup } from './markup.ts'

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
