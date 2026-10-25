// VehicleDotLegend's stories: the legend as it rests, in Swedish in a narrow container, and in
// forced colours, each with a play test that reads the accessibility tree and the drawing
// (docs/components/vehicle-dot-legend.md).
import { createRef } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, isInaccessible, userEvent, waitFor, within } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import { VehicleDotLegend } from './VehicleDotLegend.tsx'
import type { VehicleDotLegendProps } from './VehicleDotLegend.tsx'
import {
  colour,
  expectNoFocus,
  expectVehicleDotShape,
  forcedColourSheet,
  heard,
  lines,
  mounted,
  rendered,
  resolve,
  typography,
} from '../../testing/stories.ts'

/** The five states, in the order Data states lists them, each with its word and the prop over it. */
const STATES = [
  { variant: 'live', word: 'Live', prop: 'liveLabel' },
  { variant: 'ageing', word: 'Ageing', prop: 'ageingLabel' },
  { variant: 'estimated', word: 'Estimated', prop: 'estimatedLabel' },
  { variant: 'timetable-only', word: 'Timetable only', prop: 'timetableOnlyLabel' },
  { variant: 'no-signal', word: 'No signal', prop: 'noSignalLabel' },
] as const satisfies readonly { variant: string; word: string; prop: keyof VehicleDotLegendProps }[]

const WORDS: string[] = STATES.map((s) => s.word)

const INK = '--perron-color-text-primary'
const NO_SIGNAL = '--perron-color-data-state-no-signal'

const meta = {
  title: 'Components/VehicleDotLegend',
  component: VehicleDotLegend,
  args: {},
  decorators: [
    (Story) => (
      <div
        style={{
          padding: 'var(--perron-space-300)',
          background: 'var(--perron-color-surface-default)',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof VehicleDotLegend>

export default meta
type Story = StoryObj<typeof meta>

/** The legend's root in `scope`, once it has rendered. */
const legendIn = (scope: HTMLElement) =>
  waitFor(() => {
    const found = scope.querySelector<HTMLElement>('.pn-VehicleDotLegend')
    expect(found).not.toBeNull()
    return found!
  })

/** The words a legend's items show, in order. */
const wordsOf = (legend: Element) =>
  Array.from(legend.querySelectorAll('.pn-VehicleDotLegend-label'), (label) => label.textContent)

/** A legend's dots, each VehicleDot's root, in order. */
const dotsOf = (legend: Element) => [
  ...legend.querySelectorAll<HTMLElement>('.pn-VehicleDotLegend-dot'),
]

/** The five states in one row, each dot beside its word: the subject story. */
export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const list = within(canvasElement).getByRole('list')
    await step('a list of five items, read in the order of Data states (CR-1)', async () => {
      await expect(list.tagName).toBe('UL')
      await expect(list).toHaveClass('pn-VehicleDotLegend')
      const items = within(list).getAllByRole('listitem')
      await expect(items.map(heard)).toEqual(WORDS)
      // nothing else renders inside the list
      await expect(list.children).toHaveLength(STATES.length)
      for (const item of items) await expect(item.parentElement).toBe(list)
    })
    await step(
      'each dot: its item’s state, small, an icon.size.325 box, hidden (CR-2)',
      async () => {
        const side = Number.parseFloat(rendered('icon-size-325', 'width'))
        const dots = dotsOf(list)
        await expect(dots).toHaveLength(STATES.length)
        for (const [index, { variant }] of STATES.entries()) {
          const dot = dots[index]
          await expect(dot.className).toBe('pn-VehicleDot pn-VehicleDotLegend-dot')
          await expect(dot.parentElement).toHaveClass('pn-VehicleDotLegend-item')
          // the dot comes first, then its word
          await expect(dot.nextElementSibling).toHaveClass('pn-VehicleDotLegend-label')
          await expect(dot).toHaveAttribute('data-variant', variant)
          await expect(dot).toHaveAttribute('data-size', 'small')
          await expect(dot).toHaveAttribute('aria-hidden', 'true')
          await expect(isInaccessible(dot)).toBe(true)
          const box = dot.getBoundingClientRect()
          await expect(box.width).toBeCloseTo(side, 3)
          await expect(box.height).toBeCloseTo(side, 3)
        }
        await expect(within(list).queryAllByRole('img')).toHaveLength(0)
      },
    )
    await step('one ink: every dot but no signal’s in color.text.primary (CR-3)', async () => {
      const ink = colour(INK)
      await expect(getComputedStyle(list).color).toBe(ink)
      await expect(ink).not.toBe(colour('--perron-color-transit-line-m1'))
      for (const [index, dot] of dotsOf(list).entries()) {
        await expect(getComputedStyle(dot).color).toBe(ink)
        await expectVehicleDotShape(dot, STATES[index].variant, ink, colour(NO_SIGNAL))
      }
    })
    await step('the words: typography.label-sm in color.text.primary', async () => {
      const font = resolve('font', 'var(--perron-typography-label-sm)')
      const tracking = resolve('letterSpacing', 'var(--perron-typography-label-sm-tracking)')
      for (const label of list.querySelectorAll('.pn-VehicleDotLegend-label')) {
        const style = getComputedStyle(label)
        await expect(style.font).toBe(font)
        await expect(style.letterSpacing).toBe(tracking)
        await expect(style.color).toBe(colour(INK))
      }
    })
    await step('no surface, no bullets and no place of its own (CR-5)', async () => {
      const style = getComputedStyle(list)
      await expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)')
      await expect(style.borderStyle).toBe('none')
      await expect(style.boxShadow).toBe('none')
      await expect(style.position).toBe('static')
      await expect(style.zIndex).toBe('auto')
      await expect(style.margin).toBe('0px')
      await expect(style.padding).toBe('0px')
      await expect(style.listStyleType).toBe('none')
      // the items wrap between them, and each word stays whole (CR-8)
      await expect(style.flexWrap).toBe('wrap')
      await expect(style.whiteSpace).toBe('nowrap')
      await expect(style.columnGap).toBe(rendered('space-300', 'column-gap'))
      await expect(style.rowGap).toBe(rendered('space-100', 'row-gap'))
      for (const item of list.children)
        await expect(getComputedStyle(item).columnGap).toBe(rendered('space-100', 'column-gap'))
    })
    await step('Tab passes the legend by (CR-4)', async () => {
      await expect(list.querySelector('[tabindex]')).toBeNull()
      await mounted(
        canvasElement,
        <>
          <button type="button">Before</button>
          <VehicleDotLegend data-testid="between" />
          <button type="button">After</button>
        </>,
        async (host) => {
          const [before, after] = await waitFor(() => within(host).getAllByRole('button'))
          before.focus()
          await expectNoFocus(within(host).getByTestId('between'))
          await expect(before).toHaveFocus()
          await userEvent.tab()
          await expect(after).toHaveFocus()
          await userEvent.tab({ shift: true })
          await expect(before).toHaveFocus()
          before.blur()
        },
      )
    })
    for (const [index, { prop, word }] of STATES.entries())
      await step(`${prop} replaces only “${word}”`, async () => {
        await mounted(
          canvasElement,
          <VehicleDotLegend {...{ [prop]: `Own ${word}` }} />,
          async (host) => {
            const own = await legendIn(host)
            await expect(wordsOf(own)).toEqual(WORDS.with(index, `Own ${word}`))
          },
        )
      })
    await step('an aria-label or aria-labelledby names the list (CR-7)', async () => {
      await expect(list).not.toHaveAccessibleName()
      await mounted(
        canvasElement,
        <>
          <VehicleDotLegend aria-label="Vehicle data" />
          <p id="legend-title" style={typography('label')}>
            Key
          </p>
          <VehicleDotLegend aria-labelledby="legend-title" />
        </>,
        async (host) => {
          await waitFor(() => within(host).getByRole('list', { name: 'Vehicle data' }))
          await expect(within(host).getByRole('list', { name: 'Key' })).toBeInTheDocument()
        },
      )
    })
    await step('className follows pn-VehicleDotLegend on the root', async () => {
      await mounted(canvasElement, <VehicleDotLegend className="caller" />, async (host) => {
        const own = await legendIn(host)
        await expect(own.className).toBe('pn-VehicleDotLegend caller')
      })
    })
    await step('ref, as an object and as a callback, and style reach the root', async () => {
      const held = createRef<HTMLUListElement>()
      let called: HTMLUListElement | null = null
      await mounted(
        canvasElement,
        <>
          <VehicleDotLegend ref={held} style={{ opacity: 0.5 }} data-testid="object" />
          <VehicleDotLegend
            ref={(element) => {
              called = element
            }}
            data-testid="callback"
          />
        </>,
        async (host) => {
          const object = await waitFor(() => within(host).getByTestId('object'))
          await expect(held.current).toBe(object)
          await expect(held.current).toHaveClass('pn-VehicleDotLegend')
          await expect(called).toBe(within(host).getByTestId('callback'))
          await expect(getComputedStyle(object).opacity).toBe('0.5')
        },
      )
    })
    await step('its own props never reach the DOM (CR-6)', async () => {
      await mounted(
        canvasElement,
        <VehicleDotLegend
          className="caller"
          {...Object.fromEntries(STATES.map(({ prop, word }) => [prop, `Own ${word}`]))}
        />,
        async (host) => {
          const own = await legendIn(host)
          await expect(own.getAttributeNames()).toEqual(['class'])
          await expect(own.className).toBe('pn-VehicleDotLegend caller')
          await expect(wordsOf(own)).toEqual(WORDS.map((word) => `Own ${word}`))
        },
      )
    })
    await step('render swaps the element and keeps the class and the five items', async () => {
      await mounted(
        canvasElement,
        <VehicleDotLegend className="caller" render={<ol data-testid="swapped" />} />,
        async (host) => {
          const swapped = await waitFor(() => within(host).getByTestId('swapped'))
          await expect(swapped.tagName).toBe('OL')
          await expect(swapped.className).toBe('pn-VehicleDotLegend caller')
          await expect(within(swapped).getAllByRole('listitem').map(heard)).toEqual(WORDS)
          await expect(dotsOf(swapped)).toHaveLength(STATES.length)
        },
      )
    })
  },
}

/** The legend in Swedish, in a 320 px container, wrapped onto more than one row. */
export const Narrow: Story = {
  render: (args) => (
    <PerronProvider locale="sv">
      <div data-testid="narrow" style={{ inlineSize: 320 }}>
        <VehicleDotLegend {...args} />
      </div>
    </PerronProvider>
  ),
  play: async ({ canvasElement }) => {
    const container = within(canvasElement).getByTestId('narrow')
    await expect(container.getBoundingClientRect().width).toBe(320)
    const legend = await legendIn(container)
    await expect(wordsOf(legend)).toContain('Endast tidtabell')
    const items = [...legend.querySelectorAll<HTMLElement>('.pn-VehicleDotLegend-item')]
    // the items sit on more than one row
    const rows = new Set(items.map((item) => Math.round(item.getBoundingClientRect().top)))
    await expect(rows.size).toBeGreaterThan(1)
    // each word stays on one line
    for (const label of legend.querySelectorAll('.pn-VehicleDotLegend-label'))
      await expect(lines(label)).toBeLessThan(1.5)
    // no item reaches past the container's edge (CR-8)
    const edge = container.getBoundingClientRect()
    for (const item of items) {
      const box = item.getBoundingClientRect()
      await expect(box.left).toBeGreaterThanOrEqual(edge.left - 0.5)
      await expect(box.right).toBeLessThanOrEqual(edge.right + 0.5)
    }
    await expect(container.scrollWidth).toBe(container.clientWidth)
    await expect(legend.scrollWidth).toBe(legend.clientWidth)
  },
}

/**
 * The legend as `Default`. Its first render, which the docs page, the visual stage and the audits
 * show, is in normal colours: the forced-colours look exists only while its play test applies the
 * forced-colours rules (CR-9).
 */
export const ForcedColours: Story = {
  play: async ({ canvasElement, step }) => {
    const sheet = forcedColourSheet('pn-VehicleDot', 'pn-VehicleDotLegend')
    const selectors = Array.from(sheet.cssRules, (rule) => (rule as CSSStyleRule).selectorText)
    await expect(selectors.some((s) => s.includes('.pn-VehicleDotLegend-dot'))).toBe(true)
    await expect(selectors.some((s) => /\.pn-VehicleDot\[/.test(s))).toBe(true)
    const legend = await legendIn(canvasElement)
    const dots = dotsOf(legend)
    await expect(dots).toHaveLength(STATES.length)
    const text = resolve('color', 'CanvasText')
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]
    try {
      for (const [index, { variant, word }] of STATES.entries())
        await step(`${word}: drawn in CanvasText, in its own shape (CR-3)`, async () => {
          const dot = dots[index]
          await expect(getComputedStyle(dot).color).toBe(text)
          // no signal's circle takes CanvasText too, told apart by its cut
          await expectVehicleDotShape(dot, variant, text)
        })
    } finally {
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== sheet)
    }
    await step('the sheet comes off after', async () => {
      await expect(document.adoptedStyleSheets).not.toContain(sheet)
      await expect(getComputedStyle(dots[0]).color).toBe(colour(INK))
    })
  },
}
