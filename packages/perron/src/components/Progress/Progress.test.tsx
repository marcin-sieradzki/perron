// Progress renders every shape its `label` and `value` accept in every status, tells a known value
// from an indeterminate one (CR-5), formats in the PerronProvider's locale (CR-11), and keeps its
// own props off the DOM (CR-4). Spec: docs/components/progress.md.
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PerronProvider } from '../../PerronProvider.tsx'
import type { Locale } from '../../locale/index.ts'
import { attribute, openingTag } from '../../testing/markup.ts'
import { Progress, type ProgressProps } from './Progress.tsx'

const render = (props: Partial<ProgressProps> = {}, locale: Locale = 'en') =>
  renderToStaticMarkup(
    <PerronProvider locale={locale}>
      <Progress label="Exporting the report" value={45} {...props} />
    </PerronProvider>,
  )

/** The text of the `value` part. */
const figure = (markup: string) => markup.match(/class="pn-Progress-value"[^>]*>([^<]*)</)?.[1]

/** A value for each of Base UI's statuses. */
const STATUSES = [
  ['progressing', 45],
  ['complete', 100],
  ['indeterminate', null],
] as const

describe('Progress', () => {
  it.each(
    STATUSES.flatMap(
      ([status, value]) =>
        [
          [status, value, 'a string', 'Exporting the report', 'Exporting the report'],
          [status, value, 'a number', 7, '7'],
          [
            status,
            value,
            'an element',
            <strong key="l">Exporting the report</strong>,
            '<strong>Exporting the report</strong>',
          ],
          [status, value, 'a list', ['Exporting ', 'the report'], 'Exporting the report'],
        ] as [string, number | null, string, ReactNode, string][],
    ),
  )('renders, %s, %s as the label', (status, value, _, label, shown) => {
    const markup = render({ value, label })
    expect(markup).toContain(`>${shown}</span>`)
    expect(attribute(openingTag(markup, 'pn-Progress'), `data-${status}`)).toBe('')
    expect(attribute(openingTag(markup, 'pn-Progress'), 'role')).toBe('progressbar')
  })

  it.each([
    ['0', 0, {}, '0', '0%', '0%', 'progressing'],
    ['min', 20, { min: 20, max: 40 }, '20', '0%', '0%', 'progressing'],
    ['max', 100, {}, '100', '100%', '100%', 'complete'],
    ['a value under min, clamped', -5, {}, '0', '0%', '0%', 'progressing'],
    ['a value over max, clamped', 140, {}, '100', '100%', '100%', 'complete'],
    ['a fraction', 45.4, {}, '45.4', '45%', '45.4%', 'progressing'],
  ])('renders %s', (_, value, range, now, shown, width, status) => {
    const markup = render({ value, ...range })
    expect(attribute(openingTag(markup, 'pn-Progress'), 'aria-valuenow')).toBe(now)
    expect(attribute(openingTag(markup, 'pn-Progress'), 'aria-valuetext')).toBe(shown)
    expect(attribute(openingTag(markup, 'pn-Progress'), `data-${status}`)).toBe('')
    expect(figure(markup)).toBe(shown)
    expect(attribute(openingTag(markup, 'pn-Progress-indicator'), 'style')).toContain(
      `width:${width}`,
    )
  })

  it.each([
    ['null', null],
    ['NaN', NaN],
    ['Infinity', Infinity],
    ['-Infinity', -Infinity],
  ])('sweeps and says "In progress" when the value is %s (CR-5)', (_, value) => {
    const markup = render({ value })
    expect(attribute(openingTag(markup, 'pn-Progress'), 'data-indeterminate')).toBe('')
    expect(attribute(openingTag(markup, 'pn-Progress-indicator'), 'data-indeterminate')).toBe('')
    expect(attribute(openingTag(markup, 'pn-Progress'), 'aria-valuetext')).toBe('In progress')
    expect(attribute(openingTag(markup, 'pn-Progress'), 'aria-valuenow')).toBeUndefined()
    expect(figure(markup)).toBe('')
    expect(attribute(openingTag(markup, 'pn-Progress-indicator'), 'style')).toBeUndefined()
  })

  it('says the locale\'s "In progress", or inProgressLabel, over the caller\'s value text (CR-5)', () => {
    expect(
      attribute(openingTag(render({ value: null }, 'da'), 'pn-Progress'), 'aria-valuetext'),
    ).toBe('I gang')
    const overridden = render({
      value: null,
      inProgressLabel: 'Working',
      'aria-valuetext': '45 percent',
      getAriaValueText: () => '45 percent',
    })
    expect(attribute(openingTag(overridden, 'pn-Progress'), 'aria-valuetext')).toBe('Working')
  })

  it("formats in the PerronProvider's locale, and a caller's locale wins (CR-11)", () => {
    expect(figure(render({}, 'da'))).toBe('45 %')
    expect(figure(render({}, 'sv'))).toBe('45 %')
    expect(figure(render({ locale: 'en' }, 'nb'))).toBe('45%')
  })

  it('passes format, getAriaValueText and aria-valuetext through while the value is known', () => {
    const counted = render({
      value: 3,
      max: 12,
      format: { maximumFractionDigits: 0 },
      getAriaValueText: (formatted) => `${formatted} of 12 files`,
    })
    expect(figure(counted)).toBe('3')
    expect(attribute(openingTag(counted, 'pn-Progress'), 'aria-valuetext')).toBe('3 of 12 files')
    expect(
      attribute(
        openingTag(render({ 'aria-valuetext': 'Almost half' }), 'pn-Progress'),
        'aria-valuetext',
      ),
    ).toBe('Almost half')
  })

  it('keeps its own props off the root, and passes the rest through (CR-4)', () => {
    const markup = render({
      className: 'mine',
      id: 'export',
      slotProps: {
        label: { className: 'label' },
        value: { className: 'value', children: (formatted) => `≈ ${formatted}` },
        track: { className: 'track' },
        indicator: { className: 'indicator' },
      },
    })
    expect(attribute(openingTag(markup, 'pn-Progress'), 'class')).toBe('pn-Progress mine')
    expect(attribute(openingTag(markup, 'pn-Progress'), 'id')).toBe('export')
    expect(markup).not.toMatch(/\s(?:label|value|locale|inProgressLabel|slotProps)=/)
    expect(attribute(openingTag(markup, 'pn-Progress-label'), 'class')).toBe(
      'pn-Progress-label label',
    )
    expect(attribute(openingTag(markup, 'pn-Progress-value'), 'class')).toBe(
      'pn-Progress-value value',
    )
    expect(attribute(openingTag(markup, 'pn-Progress-track'), 'class')).toBe(
      'pn-Progress-track track',
    )
    expect(attribute(openingTag(markup, 'pn-Progress-indicator'), 'class')).toBe(
      'pn-Progress-indicator indicator',
    )
    expect(markup).toContain('>≈ 45%</span>')
  })

  it('never hands Base UI\'s English "indeterminate" to the caller\'s figure (CR-5)', () => {
    const markup = render({
      value: null,
      slotProps: { value: { children: (formatted) => `≈ ${formatted}` } },
    })
    expect(figure(markup)).toBe('')
    expect(markup).not.toContain('indeterminate progress')
    expect(markup).not.toMatch(/>[^<]*indeterminate/)
  })
})
