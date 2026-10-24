import type { CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Prik } from './Prik.tsx'
import type { PrikProps } from './Prik.tsx'

const VARIANTS = [
  ['live', 'Live'],
  ['ageing', 'Ageing'],
  ['estimated', 'Estimated'],
  ['timetable-only', 'Timetable only'],
  ['no-signal', 'No signal'],
] as const satisfies [NonNullable<PrikProps['variant']>, string][]

const SIZES = [
  ['small', 'Small', '--perron-icon-size-325'],
  ['medium', 'Medium', '--perron-icon-size-400'],
  ['large', 'Large', '--perron-icon-size-450'],
] as const satisfies [NonNullable<PrikProps['size']>, string, string][]

const LINES = [
  ['m1', 'M1'],
  ['m2', 'M2'],
  ['m3', 'M3'],
  ['m4', 'M4'],
  ['a', 'A'],
  ['b', 'B'],
  ['c', 'C'],
  ['e', 'E'],
  ['f', 'F'],
  ['h', 'H'],
  ['bus', 'Bus'],
  ['regional', 'Regional'],
] as const satisfies [PrikProps['line'], string][]

const meta = {
  title: 'Components/Prik',
  component: Prik,
  args: { line: 'm1', size: 'medium' },
} satisfies Meta<typeof Prik>

export default meta

type Story = StoryObj<typeof meta>

/** A play test: the root is an img named `name`, the state's owned string. */
const namedImg =
  (name: string): Story['play'] =>
  async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('img', { name })).toBeInTheDocument()
  }

/** A solid dot. */
export const Live: Story = {
  args: { variant: 'live' },
  play: namedImg('Live'),
}

/** A fainter dot with a rim. */
export const Ageing: Story = {
  args: { variant: 'ageing' },
  play: namedImg('Ageing'),
}

/** A ring. */
export const Estimated: Story = {
  args: { variant: 'estimated' },
  play: namedImg('Estimated'),
}

/** A dashed ring. */
export const TimetableOnly: Story = {
  args: { variant: 'timetable-only' },
  play: namedImg('Timetable only'),
}

/** A grey dot, whatever the line. */
export const NoSignal: Story = {
  args: { variant: 'no-signal' },
  play: async ({ canvasElement }) => {
    const root = within(canvasElement).getByRole('img', { name: 'No signal' })
    const dot = root.querySelector('.pn-Prik-dot')!
    // the token as the browser resolves a colour, read from a probe and then removed
    const probe = document.createElement('span')
    probe.style.color = 'var(--perron-color-data-state-no-signal)'
    canvasElement.append(probe)
    const grey = getComputedStyle(probe).color
    probe.remove()
    await expect(getComputedStyle(dot).fill).toBe(grey)
    await expect(getComputedStyle(dot).fill).not.toBe(getComputedStyle(root).color)
  },
}

const table: CSSProperties = {
  borderCollapse: 'collapse',
  font: 'var(--perron-typography-caption)',
  letterSpacing: 'var(--perron-typography-caption-tracking)',
  color: 'var(--perron-color-text-secondary)',
}
const header: CSSProperties = {
  padding: 'var(--perron-space-100) var(--perron-space-200)',
  fontWeight: 'inherit',
  textAlign: 'start',
}
const cell: CSSProperties = {
  padding: 'var(--perron-space-100) var(--perron-space-200)',
  lineHeight: 0,
}

/**
 * A table of every state, a row each: the column headers say the state, so each Prik is
 * `aria-hidden`, as the spec's Do and don't asks.
 */
function StateTable({
  rows,
  ...args
}: Omit<PrikProps, 'variant'> & {
  rows: { key: string; label: string; props: Partial<PrikProps> }[]
}) {
  return (
    <table style={table}>
      <thead>
        <tr>
          <td style={header} />
          {VARIANTS.map(([variant, label]) => (
            <th key={variant} scope="col" style={header}>
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ key, label, props }) => (
          <tr key={key}>
            <th scope="row" style={header}>
              {label}
            </th>
            {VARIANTS.map(([variant]) => (
              <td key={variant} style={cell}>
                <Prik {...args} {...props} variant={variant} aria-hidden />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Each state at `small`, `medium` and `large`. */
export const Sizes: Story = {
  render: (args) => (
    <StateTable
      {...args}
      rows={SIZES.map(([size, label]) => ({ key: size, label, props: { size } }))}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const root = getComputedStyle(document.documentElement)
    for (const [size, label, token] of SIZES)
      await step(`${label}: an ${token} square, every state as wide as live`, async () => {
        const side = parseFloat(root.getPropertyValue(token))
        const priks = [
          ...canvasElement.querySelectorAll<SVGSVGElement>(`.pn-Prik[data-size='${size}']`),
        ]
        await expect(priks).toHaveLength(VARIANTS.length)
        // the outer edge of each state's dot: its radius plus half its stroke, if it has one
        const edge = (prik: SVGSVGElement) => {
          const dot = prik.querySelector<SVGCircleElement>('.pn-Prik-dot')!
          const style = getComputedStyle(dot)
          const stroke = style.stroke === 'none' ? 0 : parseFloat(style.strokeWidth)
          return dot.getBBox().width / 2 + stroke / 2
        }
        const live = edge(priks.find((p) => p.dataset.variant === 'live')!)
        for (const prik of priks) {
          const box = prik.getBoundingClientRect()
          await expect(box.width).toBe(side)
          await expect(box.height).toBe(side)
          // rounded to the hundredth, so float error never fails an edge 0.1 px off
          const off = Math.round(Math.abs(edge(prik) - live) * 100) / 100
          await expect(off, `${prik.dataset.variant}'s edge against live's`).toBeLessThanOrEqual(
            0.1,
          )
        }
      })
  },
}

/** Each state on each of the twelve lines. */
export const Lines: Story = {
  render: (args) => (
    <StateTable
      {...args}
      rows={LINES.map(([line, label]) => ({ key: line, label, props: { line } }))}
    />
  ),
}
