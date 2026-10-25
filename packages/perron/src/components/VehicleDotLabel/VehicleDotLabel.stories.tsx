// VehicleDotLabel's stories: one per data state, and a long word wrapping in a narrow container,
// each with a play test that reads the accessibility tree (docs/components/vehicle-dot-label.md).
import { createRef } from 'react'
import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, getRoles, isInaccessible, userEvent, waitFor, within } from 'storybook/test'
import { VehicleDotLabel } from './VehicleDotLabel.tsx'
import type { VehicleDotLabelProps } from './VehicleDotLabel.tsx'
import {
  colour,
  expectNoFocus,
  expectVehicleDotShape,
  heard,
  lines,
  mounted,
  resolve,
  stateRules,
  typography,
} from '../../testing/stories.ts'

type Variant = NonNullable<VehicleDotLabelProps['variant']>

/** The five data states, in the order Data states lists them, each with its word. */
const STATES: { variant: Variant; word: string }[] = [
  { variant: 'live', word: 'Live' },
  { variant: 'ageing', word: 'Ageing' },
  { variant: 'estimated', word: 'Estimated' },
  { variant: 'timetable-only', word: 'Timetable only' },
  { variant: 'no-signal', word: 'No signal' },
]

/** A Danish compound longer than a narrow column, for the long-word checks. */
const COMPOUND = 'regionaltogsforbindelserne'

/**
 * Three places too narrow for two labels on one line, each of which must leave a label's longest
 * word whole: a row that wraps, a row that never wraps, and an auto-layout table cell beside longer
 * text (CR-5).
 */
const WHOLE_WORD_HOLDERS: [string, (labels: ReactNode) => ReactNode][] = [
  [
    'in a row that wraps',
    (labels) => (
      <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: 8, inlineSize: 120 }}>
        {labels}
      </div>
    ),
  ],
  [
    'in a row that never wraps',
    (labels) => <div style={{ display: 'flex', columnGap: 8, inlineSize: 120 }}>{labels}</div>,
  ],
  [
    'in an auto-layout table cell beside longer text',
    (labels) => (
      <table style={{ inlineSize: 120 }}>
        <tbody>
          <tr>
            <td>{labels}</td>
            <td style={typography('body')}>
              A much longer cell of text beside the label, which takes the row's width
            </td>
          </tr>
        </tbody>
      </table>
    ),
  ],
]

/** The prop that overrides each state's word. */
const LABELS = {
  live: 'liveLabel',
  ageing: 'ageingLabel',
  estimated: 'estimatedLabel',
  'timetable-only': 'timetableOnlyLabel',
  'no-signal': 'noSignalLabel',
} as const satisfies Record<Variant, keyof VehicleDotLabelProps>

const meta = {
  title: 'Components/VehicleDotLabel',
  component: VehicleDotLabel,
  args: { line: 'm1' },
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
} satisfies Meta<typeof VehicleDotLabel>

export default meta
type Story = StoryObj<typeof meta>

/** A VehicleDotLabel's root, its dot and its word. */
function partsOf(root: HTMLElement) {
  return {
    root,
    dot: root.querySelector<HTMLElement>(':scope > .pn-VehicleDot')!,
    label: root.querySelector<HTMLElement>(':scope > .pn-VehicleDotLabel-label')!,
  }
}

/** The first VehicleDotLabel in `scope`, its dot and its word. */
const parts = (scope: Element) => partsOf(scope.querySelector<HTMLElement>('.pn-VehicleDotLabel')!)

/**
 * What every state's story checks: the label is heard as the state's word alone, and its dot is a
 * VehicleDot of the same state, hidden from screen readers (CR-1, CR-2).
 */
async function expectState(scope: HTMLElement, variant: Variant) {
  const { word } = STATES.find((s) => s.variant === variant)!
  const { root, dot, label } = parts(scope)
  await expect(root).toHaveAttribute('data-variant', variant)
  await expect(heard(root)).toBe(word)
  await expect(label.textContent).toBe(word)
  await expect(isInaccessible(label)).toBe(false)
  await expect(dot).toHaveAttribute('data-variant', variant)
  await expect(dot).toHaveAttribute('aria-hidden', 'true')
  await expect(isInaccessible(dot)).toBe(true)
  await expect(Object.values(getRoles(scope)).flat()).not.toContain(dot)
}

/** The word's colour and type: `color.text.primary` in `typography.label-sm`, whatever the state. */
async function expectWordStyle(label: Element) {
  const style = getComputedStyle(label)
  await expect(style.color).toBe(colour('--perron-color-text-primary'))
  await expect(style.font).toBe(resolve('font', 'var(--perron-typography-label-sm)'))
  await expect(style.letterSpacing).toBe(
    resolve('letterSpacing', 'var(--perron-typography-label-sm-tracking)'),
  )
}

/** A fainter dot and "Ageing", on M1. The subject story: its args render the label alone. */
export const Ageing: Story = {
  args: { variant: 'ageing' },
  play: async ({ canvasElement }) => {
    await expectState(canvasElement, 'ageing')
    const { root, dot } = parts(canvasElement)
    await expect(root).toHaveAttribute('data-line', 'm1')
    await expect(dot).toHaveAttribute('data-line', 'm1')
    await expect(dot).toHaveAttribute('data-size', 'small')
  },
}

/** A ring and "Estimated". */
export const Estimated: Story = {
  args: { variant: 'estimated' },
  play: ({ canvasElement }) => expectState(canvasElement, 'estimated'),
}

/** A solid dot and "Live", the default state. */
export const Live: Story = {
  args: { variant: 'live' },
  play: async ({ canvasElement, step }) => {
    const { root, dot, label } = parts(canvasElement)
    await step('heard as "Live", with no role, the dot hidden', async () => {
      await expectState(canvasElement, 'live')
      await expect(root).not.toHaveAttribute('role')
      // a plain <span>: generic, which a screen reader passes over to read its text in place
      const roles = getRoles(canvasElement)
      await expect(Object.keys(roles).filter((role) => roles[role].includes(root))).toEqual([
        'generic',
      ])
    })
    await step('the dot comes before the word, on the start side (CR-2)', async () => {
      await expect(root.firstElementChild).toBe(dot)
      await expect(dot.nextElementSibling).toBe(label)
      await expect(dot.getBoundingClientRect().right).toBeLessThanOrEqual(
        label.getBoundingClientRect().left,
      )
      await mounted(
        canvasElement,
        <div dir="rtl">
          <VehicleDotLabel line="m1" />
        </div>,
        async (host) => {
          const rtl = await waitFor(() => parts(host))
          await expect(getComputedStyle(rtl.root).direction).toBe('rtl')
          await expect(rtl.dot.getBoundingClientRect().left).toBeGreaterThanOrEqual(
            rtl.label.getBoundingClientRect().right,
          )
        },
      )
    })
    await step('the word is color.text.primary in typography.label-sm', () =>
      expectWordStyle(label),
    )
    await step('no hover or pressed look and no pointer cursor (CR-6)', async () => {
      for (const part of [root, dot, label]) {
        await expect(stateRules(part, ':hover')).toHaveLength(0)
        await expect(stateRules(part, ':active')).toHaveLength(0)
        await expect(getComputedStyle(part).cursor).not.toBe('pointer')
      }
    })
    await step('Tab passes the label by (CR-6)', async () => {
      await expect(root).not.toHaveAttribute('tabindex')
      await mounted(
        canvasElement,
        <>
          <button type="button">Before</button>
          <VehicleDotLabel line="m1" data-testid="between" />
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
    await step('with variant left out, a live label (CR-3)', async () => {
      await mounted(canvasElement, <VehicleDotLabel line="m2" />, async (host) => {
        const plain = await waitFor(() => parts(host))
        await expect(plain.root).toHaveAttribute('data-variant', 'live')
        await expect(plain.root).toHaveAttribute('data-line', 'm2')
        await expect(heard(plain.root)).toBe('Live')
        await expect(plain.dot).toHaveAttribute('data-variant', 'live')
        await expect(plain.dot).toHaveAttribute('data-line', 'm2')
      })
    })
    for (const { variant: given } of STATES)
      await step(`${LABELS[given]} replaces ${given}'s word and no other's (CR-2, CR-4)`, () =>
        mounted(
          canvasElement,
          <>
            {STATES.map(({ variant }) => (
              <VehicleDotLabel
                key={variant}
                variant={variant}
                line="m1"
                {...{ [LABELS[given]]: 'Own word' }}
              />
            ))}
          </>,
          async (host) => {
            const roots = await waitFor(() => {
              const found = host.querySelectorAll<HTMLElement>('.pn-VehicleDotLabel')
              expect(found).toHaveLength(STATES.length)
              return [...found]
            })
            for (const [index, { variant, word }] of STATES.entries()) {
              const shown = variant === given ? 'Own word' : word
              const { root: one, dot: itsDot, label: itsWord } = partsOf(roots[index])
              await expect(one).toHaveAttribute('data-variant', variant)
              await expect(itsWord.textContent).toBe(shown)
              await expect(heard(one)).toBe(shown)
              await expect(itsDot).toHaveAttribute('aria-label', shown)
            }
          },
        ),
      )
    await step('className follows pn-VehicleDotLabel on the root', async () => {
      await mounted(
        canvasElement,
        <VehicleDotLabel line="m1" className="caller" />,
        async (host) => {
          const own = await waitFor(() => parts(host).root)
          await expect(own.className).toBe('pn-VehicleDotLabel caller')
        },
      )
    })
    await step('ref and style reach the root', async () => {
      const held = createRef<HTMLSpanElement>()
      let called: HTMLSpanElement | null = null
      const own = { marginInlineStart: '7px', opacity: 0.5 }
      await mounted(
        canvasElement,
        <>
          <VehicleDotLabel line="m1" ref={held} style={own} data-testid="object" />
          <VehicleDotLabel
            line="m1"
            ref={(element) => {
              called = element
            }}
            data-testid="callback"
          />
        </>,
        async (host) => {
          const object = await waitFor(() => within(host).getByTestId('object'))
          await expect(held.current).toBe(object)
          await expect(held.current).toHaveClass('pn-VehicleDotLabel')
          await expect(called).toBe(within(host).getByTestId('callback'))
          await expect(called).toHaveClass('pn-VehicleDotLabel')
          await expect(object.style.marginInlineStart).toBe('7px')
          await expect(getComputedStyle(object).marginInlineStart).toBe('7px')
          await expect(getComputedStyle(object).opacity).toBe('0.5')
        },
      )
    })
    await step('its own props never reach the DOM (CR-7)', async () => {
      await mounted(
        canvasElement,
        <VehicleDotLabel
          variant="estimated"
          line="bus"
          liveLabel="Own live"
          ageingLabel="Own ageing"
          estimatedLabel="Own estimated"
          timetableOnlyLabel="Own timetable only"
          noSignalLabel="Own no signal"
        />,
        async (host) => {
          const { root: own } = await waitFor(() => parts(host))
          await expect(own.getAttributeNames().toSorted()).toEqual([
            'class',
            'data-line',
            'data-variant',
          ])
          await expect(own).toHaveAttribute('data-variant', 'estimated')
          await expect(own).toHaveAttribute('data-line', 'bus')
          await expect(heard(own)).toBe('Own estimated')
        },
      )
    })
    await step('aria-hidden reaches the root and hides the label (CR-7)', async () => {
      await mounted(canvasElement, <VehicleDotLabel line="m1" aria-hidden />, async (host) => {
        const { root: hidden, label: word } = await waitFor(() => parts(host))
        await expect(hidden).toHaveAttribute('aria-hidden', 'true')
        await expect(isInaccessible(hidden)).toBe(true)
        await expect(isInaccessible(word)).toBe(true)
      })
    })
    await step('render swaps the element and keeps the class, data, dot and word', async () => {
      await mounted(
        canvasElement,
        <VehicleDotLabel
          line="m3"
          variant="no-signal"
          className="caller"
          render={<div data-testid="swapped" />}
        />,
        async (host) => {
          const swapped = await waitFor(() => within(host).getByTestId('swapped'))
          await expect(swapped.tagName).toBe('DIV')
          await expect(swapped.className).toBe('pn-VehicleDotLabel caller')
          await expect(swapped).toHaveAttribute('data-variant', 'no-signal')
          await expect(swapped).toHaveAttribute('data-line', 'm3')
          const { dot: itsDot, label: itsWord } = parts(host)
          await expect(itsDot).toHaveAttribute('data-variant', 'no-signal')
          await expect(itsDot).toHaveAttribute('aria-hidden', 'true')
          await expect(itsWord.textContent).toBe('No signal')
          await expect(heard(swapped)).toBe('No signal')
        },
      )
    })
  },
}

/**
 * A solid dot and "Live" with no line, as a label that stands for a state across many lines shows
 * it: the dot in the word's ink (CR-3).
 */
export const NoLine: Story = {
  args: { variant: 'live', line: undefined },
  play: async ({ canvasElement }) => {
    await expectState(canvasElement, 'live')
    const { root, dot, label } = parts(canvasElement)
    await expect(root).not.toHaveAttribute('data-line')
    await expect(dot).not.toHaveAttribute('data-line')
    await expectWordStyle(label)
    const ink = colour('--perron-color-text-primary')
    await expect(ink).not.toBe(colour('--perron-color-transit-line-m1'))
    await expect(getComputedStyle(dot).color).toBe(ink)
    await expectVehicleDotShape(dot, 'live', ink)
  },
}

/** A grey dot cut by a slash and "No signal", the word at full strength. */
export const NoSignal: Story = {
  args: { variant: 'no-signal' },
  play: async ({ canvasElement }) => {
    await expectState(canvasElement, 'no-signal')
    const { label } = parts(canvasElement)
    await expectWordStyle(label)
    await expect(getComputedStyle(label).color).not.toBe(
      colour('--perron-color-data-state-no-signal'),
    )
  },
}

/** A dashed ring and "Timetable only". */
export const TimetableOnly: Story = {
  args: { variant: 'timetable-only' },
  play: ({ canvasElement }) => expectState(canvasElement, 'timetable-only'),
}

/**
 * "Timetable only" overridden by a long phrase holding one long compound word, in a narrow
 * container: the word wraps inside the label, and the dot stays beside its first line (CR-5).
 */
export const Wrapping: Story = {
  args: {
    variant: 'timetable-only',
    timetableOnlyLabel: `Kun køreplan for ${COMPOUND}`,
  },
  render: (args) => (
    <div data-testid="column" style={{ inlineSize: 120 }}>
      <VehicleDotLabel {...args} />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const column = within(canvasElement).getByTestId('column')
    const { root, dot, label } = parts(column)
    await step('the word wraps and stays inside its column (CR-5)', async () => {
      await expect(lines(label)).toBeGreaterThan(1)
      await expect(column.scrollWidth).toBeLessThanOrEqual(column.clientWidth)
      await expect(root.getBoundingClientRect().right).toBeLessThanOrEqual(
        column.getBoundingClientRect().right,
      )
      // the long compound breaks inside the word rather than running past it
      await expect(getComputedStyle(root).overflowWrap).toBe('break-word')
      await expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth)
    })
    await step("the dot's centre sits within the word's first line (CR-5)", async () => {
      const word = label.getBoundingClientRect()
      const line = Number.parseFloat(getComputedStyle(label).lineHeight)
      const mark = dot.getBoundingClientRect()
      const centre = mark.top + mark.height / 2
      await expect(centre).toBeGreaterThan(word.top)
      await expect(centre).toBeLessThan(word.top + line)
      await expect(Math.abs(centre - (word.top + line / 2))).toBeLessThanOrEqual(1)
    })
    for (const [where, holder] of WHOLE_WORD_HOLDERS)
      await step(`${where}, each label keeps its longest word whole (CR-5)`, () =>
        mounted(
          canvasElement,
          <>
            <span data-testid="whole" style={{ ...typography('label-sm'), whiteSpace: 'nowrap' }}>
              Timetable
            </span>
            {holder(
              <>
                <VehicleDotLabel line="m1" variant="timetable-only" />
                <VehicleDotLabel line="m2" variant="timetable-only" />
              </>,
            )}
          </>,
          async (host) => {
            const whole = await waitFor(() => within(host).getByTestId('whole'))
            const words = [...host.querySelectorAll('.pn-VehicleDotLabel-label')]
            await expect(words).toHaveLength(2)
            // "Timetable" never breaks, however narrow its row or cell
            for (const word of words)
              await expect(word.getBoundingClientRect().width).toBeGreaterThanOrEqual(
                whole.getBoundingClientRect().width - 0.5,
              )
          },
        ),
      )
  },
}
