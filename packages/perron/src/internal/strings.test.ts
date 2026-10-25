// interpolate fills an owned string's placeholders with the caller's words, as a string while they
// are all text, and with elements in place otherwise.
import { createElement, isValidElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { interpolate } from './strings.ts'

describe('interpolate', () => {
  it('fills each placeholder with its value, as a string while every value is text', () => {
    expect(interpolate('From {time}', { time: '08:03' })).toBe('From 08:03')
    expect(interpolate('{stops} and {count} more', { stops: 'Nørreport, Valby', count: 3 })).toBe(
      'Nørreport, Valby and 3 more',
    )
    expect(interpolate('Between {from} and {to}', { to: 'Klampenborg', from: 'Hellerup' })).toBe(
      'Between Hellerup and Klampenborg',
    )
  })

  it('renders nothing for a placeholder with no value', () => {
    expect(interpolate('From {time}', {})).toBe('From ')
  })

  it('keeps an element in place, keyed, among the words', () => {
    const time = createElement('time', { dateTime: '08:03' }, '08:03')
    const filled = interpolate('From {time}', { time })
    expect(Array.isArray(filled)).toBe(true)
    expect((filled as unknown[]).filter(isValidElement).every((el) => el.key !== null)).toBe(true)
    expect(renderToStaticMarkup(createElement('p', null, filled))).toBe(
      '<p>From <time dateTime="08:03">08:03</time></p>',
    )
  })
})
