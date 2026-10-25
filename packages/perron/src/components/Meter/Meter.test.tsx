// Meter renders every shape its `label` and `value` accept in every `color`, tells a value from an
// unknown one (CR-5), formats in the PerronProvider's locale (CR-11), and keeps its own props off
// the DOM (CR-4). Spec: docs/components/meter.md.
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PerronProvider } from '../../PerronProvider.tsx'
import type { Locale } from '../../locale/index.ts'
import { attribute } from '../../testing/markup.ts'
import { Meter, type MeterProps } from './Meter.tsx'

const render = (props: Partial<MeterProps> = {}, locale: Locale = 'en') =>
  renderToStaticMarkup(
    <PerronProvider locale={locale}>
      <Meter label="Reporting live" value={82} {...props} />
    </PerronProvider>,
  )

/** The opening tag of the first element whose class is `className`, or "" when there is none. */
const part = (markup: string, className: string) =>
  markup.match(new RegExp(`<[^>]*class="${className}[ "][^>]*>`))?.[0] ?? ''

/** The text of the `value` part. */
const figure = (markup: string) => markup.match(/class="pn-Meter-value"[^>]*>([^<]*)</)?.[1]

const COLORS = ['neutral', 'success', 'warning', 'danger', 'info'] as const

describe('Meter', () => {
  it.each(
    COLORS.flatMap(
      (color) =>
        [
          [color, 'a string', 'Reporting live', 'Reporting live'],
          [color, 'a number', 7, '7'],
          [
            color,
            'an element',
            <strong key="l">Reporting live</strong>,
            '<strong>Reporting live</strong>',
          ],
          [color, 'a list', ['Reporting ', 'live'], 'Reporting live'],
        ] as [MeterProps['color'], string, ReactNode, string][],
    ),
  )('renders, in %s, %s as the label', (color, _, label, shown) => {
    const markup = render({ color, label })
    expect(markup).toContain(`>${shown}</span>`)
    expect(attribute(part(markup, 'pn-Meter'), 'data-color')).toBe(color)
    expect(attribute(part(markup, 'pn-Meter'), 'role')).toBe('meter')
  })

  it.each([
    ['0', 0, {}, '0', '0%', '0%'],
    ['min', 20, { min: 20, max: 40 }, '20', '0%', '0%'],
    ['max', 100, {}, '100', '100%', '100%'],
    ['a value under min, clamped', -5, {}, '0', '0%', '0%'],
    ['a value over max, clamped', 140, {}, '100', '100%', '100%'],
    ['a fraction', 82.4, {}, '82.4', '82%', '82.4%'],
  ])('renders %s', (_, value, range, now, shown, width) => {
    const markup = render({ value, ...range })
    expect(attribute(part(markup, 'pn-Meter'), 'aria-valuenow')).toBe(now)
    expect(attribute(part(markup, 'pn-Meter'), 'aria-valuetext')).toBe(shown)
    expect(attribute(part(markup, 'pn-Meter'), 'data-unknown')).toBeUndefined()
    expect(figure(markup)).toBe(shown)
    expect(attribute(part(markup, 'pn-Meter-indicator'), 'style')).toContain(`width:${width}`)
  })

  it.each([
    ['null', null],
    ['NaN', NaN],
    ['Infinity', Infinity],
    ['-Infinity', -Infinity],
  ])('shows "—" over an empty track and says "Unknown" when the value is %s (CR-5)', (_, value) => {
    const markup = render({ value, min: 10, max: 50 })
    expect(attribute(part(markup, 'pn-Meter'), 'data-unknown')).toBe('')
    expect(attribute(part(markup, 'pn-Meter-value'), 'data-unknown')).toBe('')
    expect(attribute(part(markup, 'pn-Meter'), 'aria-valuetext')).toBe('Unknown')
    expect(attribute(part(markup, 'pn-Meter'), 'aria-valuenow')).toBe('10')
    expect(figure(markup)).toBe('—')
    expect(attribute(part(markup, 'pn-Meter-indicator'), 'style')).toContain('width:0%')
  })

  it('says the locale\'s "Unknown", or unknownLabel, over the caller\'s value text (CR-5)', () => {
    expect(attribute(part(render({ value: null }, 'da'), 'pn-Meter'), 'aria-valuetext')).toBe(
      'Ukendt',
    )
    const overridden = render({
      value: null,
      unknownLabel: 'No data',
      'aria-valuetext': '82 percent',
      getAriaValueText: () => '82 percent',
    })
    expect(attribute(part(overridden, 'pn-Meter'), 'aria-valuetext')).toBe('No data')
  })

  it("formats in the PerronProvider's locale, and a caller's locale wins (CR-11)", () => {
    expect(figure(render({}, 'da'))).toBe('82 %')
    expect(figure(render({}, 'sv'))).toBe('82 %')
    expect(figure(render({ locale: 'en' }, 'nb'))).toBe('82%')
  })

  it('passes format, getAriaValueText and aria-valuetext through while the value is known', () => {
    const counted = render({
      value: 1046,
      max: 1204,
      format: { maximumFractionDigits: 0 },
      getAriaValueText: (formatted) => `${formatted} of 1,204`,
    })
    expect(figure(counted)).toBe('1,046')
    expect(attribute(part(counted, 'pn-Meter'), 'aria-valuetext')).toBe('1,046 of 1,204')
    expect(
      attribute(part(render({ 'aria-valuetext': 'Most' }), 'pn-Meter'), 'aria-valuetext'),
    ).toBe('Most')
  })

  it('keeps its own props off the root, and passes the rest through (CR-4)', () => {
    const markup = render({
      color: 'success',
      className: 'mine',
      id: 'live',
      'data-color': 'info',
      slotProps: {
        label: { className: 'label' },
        value: { className: 'value', children: (formatted) => `≈ ${formatted}` },
        track: { className: 'track' },
        indicator: { className: 'indicator' },
      },
    } as Partial<MeterProps>)
    expect(attribute(part(markup, 'pn-Meter'), 'class')).toBe('pn-Meter mine')
    expect(attribute(part(markup, 'pn-Meter'), 'id')).toBe('live')
    expect(attribute(part(markup, 'pn-Meter'), 'data-color')).toBe('success')
    expect(markup).not.toMatch(/\s(?:label|value|color|locale|unknownLabel|slotProps)=/)
    expect(attribute(part(markup, 'pn-Meter-label'), 'class')).toBe('pn-Meter-label label')
    expect(attribute(part(markup, 'pn-Meter-value'), 'class')).toBe('pn-Meter-value value')
    expect(attribute(part(markup, 'pn-Meter-track'), 'class')).toBe('pn-Meter-track track')
    expect(attribute(part(markup, 'pn-Meter-indicator'), 'class')).toBe(
      'pn-Meter-indicator indicator',
    )
    expect(markup).toContain('>≈ 82%</span>')
  })

  it('keeps the "—" when the caller writes the figure and the value is unknown (CR-5)', () => {
    const markup = render({
      value: null,
      slotProps: { value: { children: (formatted) => `≈ ${formatted}` } },
    })
    expect(markup).toContain('>—</span>')
  })
})
