// VehicleDot's stories: one per data state, then every size, every line, and forced colours, each
// with a play test that reads the accessibility tree and the drawing (docs/components/vehicle-dot.md).
import { createRef } from 'react'
import type { CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, isInaccessible, userEvent, waitFor, within } from 'storybook/test'
import { VehicleDot } from './VehicleDot.tsx'
import type { VehicleDotProps } from './VehicleDot.tsx'
import {
  colour,
  expectNoFocus,
  expectVehicleDotCut,
  expectVehicleDotShape,
  forcedColourSheet,
  mounted,
  rendered,
  resolve,
  STATE_LABELS,
  STATE_WORDS,
  typography,
} from '../../testing/stories.ts'

type Line = VehicleDotProps['line']
type Size = NonNullable<VehicleDotProps['size']>

/** The twelve lines, each with the token that colours it and its name as riders write it. */
const LINES: { line: Line; token: string; name: string }[] = [
  { line: 'm1', token: '--perron-color-transit-line-m1', name: 'M1' },
  { line: 'm2', token: '--perron-color-transit-line-m2', name: 'M2' },
  { line: 'm3', token: '--perron-color-transit-line-m3', name: 'M3' },
  { line: 'm4', token: '--perron-color-transit-line-m4', name: 'M4' },
  { line: 'a', token: '--perron-color-transit-line-a', name: 'A' },
  { line: 'b', token: '--perron-color-transit-line-b', name: 'B' },
  { line: 'c', token: '--perron-color-transit-line-c', name: 'C' },
  { line: 'e', token: '--perron-color-transit-line-e', name: 'E' },
  { line: 'f', token: '--perron-color-transit-line-f', name: 'F' },
  { line: 'h', token: '--perron-color-transit-line-h', name: 'H' },
  { line: 'bus', token: '--perron-color-transit-mode-bus', name: 'Bus' },
  { line: 'regional', token: '--perron-color-transit-mode-regional', name: 'Regional train' },
]

/** Each size, its icon-size token, and the text it sits beside (the spec's Props). */
const SIZES: { size: Size; token: string; text: string; role: string }[] = [
  {
    size: 'small',
    token: 'icon-size-325',
    text: 'Small, beside a caption or label',
    role: 'caption',
  },
  {
    size: 'medium',
    token: 'icon-size-400',
    text: 'Medium, inside a control or row',
    role: 'label',
  },
  {
    size: 'large',
    token: 'icon-size-450',
    text: 'Large, beside a panel title',
    role: 'heading-md',
  },
]

const NO_SIGNAL = '--perron-color-data-state-no-signal'

const row: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  columnGap: 'var(--perron-space-300)',
  rowGap: 'var(--perron-space-100)',
}

const pair: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--perron-space-100)',
}

/**
 * The five states in a row, each dot beside its word, as a screen shows them (CR-5): the word is
 * read, so each dot passes `aria-hidden` and the state is heard once.
 */
function States({ line, size }: { line: Line; size: Size }) {
  const role = SIZES.find((s) => s.size === size)!.role
  return (
    <div style={{ ...row, ...typography(role) }}>
      {STATE_WORDS.map(({ variant, word }) => (
        <span key={variant} style={pair}>
          <VehicleDot variant={variant} line={line} size={size} aria-hidden />
          {word}
        </span>
      ))}
    </div>
  )
}

const meta = {
  title: 'Components/VehicleDot',
  component: VehicleDot,
  args: { line: 'm1', size: 'medium' },
  decorators: [
    (Story) => (
      <div
        style={{
          padding: 'var(--perron-space-300)',
          background: 'var(--perron-color-surface-default)',
          color: 'var(--perron-color-text-primary)',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof VehicleDot>

export default meta
type Story = StoryObj<typeof meta>

/** A VehicleDot's dot, the `<circle>` inside its root. */
const dotOf = (root: Element) => root.querySelector<SVGCircleElement>('.pn-VehicleDot-dot')!

/** The first VehicleDot in `scope`, and its dot. */
function parts(scope: Element) {
  const root = scope.querySelector<HTMLElement>('.pn-VehicleDot')!
  return { root, dot: dotOf(root) }
}

/** The colour a line's token renders as, which `currentColor` takes on the root. */
const lineColour = (line: Line) => colour(LINES.find((l) => l.line === line)!.token)

/** The subject story: a fainter dot with a rim, on M1, alone. */
export const Ageing: Story = {
  args: { variant: 'ageing' },
  play: async ({ canvasElement }) => {
    const root = within(canvasElement).getByRole('img', { name: 'Ageing' })
    await expect(root).toHaveAttribute('data-variant', 'ageing')
    await expect(root).toHaveAttribute('data-line', 'm1')
    await expect(root).toHaveAttribute('data-size', 'medium')
    const style = getComputedStyle(parts(canvasElement).dot)
    await expect(style.fill).toBe(lineColour('m1'))
    await expect(style.fillOpacity).toBe(
      rendered('vehicle-dot-ageing-fill-opacity', 'fill-opacity'),
    )
    // the rim: the line's colour, the ageing stroke's width, unbroken
    await expect(style.stroke).toBe(lineColour('m1'))
    await expect(style.strokeWidth).toBe(
      rendered('vehicle-dot-ageing-stroke-width', 'stroke-width'),
    )
    await expect(style.strokeDasharray).toBe('none')
  },
}

/** A ring in the line's colour. */
export const Estimated: Story = {
  args: { variant: 'estimated' },
  play: async ({ canvasElement }) => {
    within(canvasElement).getByRole('img', { name: 'Estimated' })
    const style = getComputedStyle(parts(canvasElement).dot)
    await expect(style.fill).toBe('none')
    await expect(style.stroke).toBe(lineColour('m1'))
    await expect(style.strokeWidth).toBe(
      rendered('vehicle-dot-estimated-stroke-width', 'stroke-width'),
    )
    await expect(style.strokeDasharray).toBe('none')
  },
}

/** A solid dot in the line's colour, the default state. */
export const Live: Story = {
  args: { variant: 'live' },
  play: async ({ canvasElement, step }) => {
    const root = within(canvasElement).getByRole('img', { name: 'Live' })
    await step('a solid dot in the line colour, with no rim and no mask', async () => {
      const style = getComputedStyle(parts(canvasElement).dot)
      await expect(style.fill).toBe(lineColour('m1'))
      await expect(style.fillOpacity).toBe('1')
      await expect(style.stroke).toBe('none')
      await expect(getComputedStyle(root).maskImage).toBe('none')
      // the glyph is hidden: the root names the dot (CR-6)
      const glyph = root.querySelector('.pn-VehicleDot-glyph')!
      await expect(glyph).toHaveAttribute('aria-hidden', 'true')
    })
    await step('Tab passes the dot by (CR-2)', async () => {
      await expect(root).not.toHaveAttribute('tabindex')
      await mounted(
        canvasElement,
        <>
          <button type="button">Before</button>
          <VehicleDot line="m1" data-testid="between" />
          <button type="button">After</button>
        </>,
        async (host) => {
          const [before, after] = await waitFor(() => within(host).getAllByRole('button'))
          const dot = within(host).getByTestId('between')
          before.focus()
          await expectNoFocus(dot)
          await expect(before).toHaveFocus()
          await userEvent.tab()
          await expect(after).toHaveFocus()
          await userEvent.tab({ shift: true })
          await expect(before).toHaveFocus()
          before.blur()
        },
      )
    })
    await step('with aria-hidden, the root leaves the accessibility tree (CR-6)', async () => {
      await mounted(canvasElement, <VehicleDot line="m1" aria-hidden />, async (host) => {
        const hidden = await waitFor(() => parts(host).root)
        await expect(hidden).toHaveAttribute('aria-hidden', 'true')
        await expect(isInaccessible(hidden)).toBe(true)
        await expect(within(host).queryByRole('img')).toBeNull()
      })
    })
    await step('with variant and size left out, a live dot at medium (CR-7)', async () => {
      await mounted(canvasElement, <VehicleDot line="m1" />, async (host) => {
        const plain = await waitFor(() => within(host).getByRole('img', { name: 'Live' }))
        await expect(plain).toHaveAttribute('data-variant', 'live')
        await expect(plain).toHaveAttribute('data-size', 'medium')
        await expect(plain).toHaveAttribute('data-line', 'm1')
        const side = Number.parseFloat(rendered('icon-size-400', 'width'))
        const box = plain.getBoundingClientRect()
        await expect(box.width).toBeCloseTo(side, 3)
        await expect(box.height).toBeCloseTo(side, 3)
        const style = getComputedStyle(dotOf(plain))
        await expect(style.fill).toBe(lineColour('m1'))
        await expect(style.fillOpacity).toBe('1')
        await expect(style.stroke).toBe('none')
      })
    })
    await step('each *Label names its own state', async () => {
      await mounted(
        canvasElement,
        <>
          {STATE_WORDS.map(({ variant }) => (
            <VehicleDot
              key={variant}
              variant={variant}
              line="m1"
              {...{ [STATE_LABELS[variant]]: `Own ${variant}` }}
            />
          ))}
        </>,
        async (host) => {
          for (const { variant } of STATE_WORDS) {
            const own = await waitFor(() =>
              within(host).getByRole('img', { name: `Own ${variant}` }),
            )
            await expect(own).toHaveAttribute('data-variant', variant)
          }
          await expect(within(host).getAllByRole('img')).toHaveLength(STATE_WORDS.length)
        },
      )
    })
    await step('className follows pn-VehicleDot on the root', async () => {
      await mounted(canvasElement, <VehicleDot line="m1" className="caller" />, async (host) => {
        const own = await waitFor(() => parts(host).root)
        await expect(own.className).toBe('pn-VehicleDot caller')
      })
    })
    await step('ref and style reach the root', async () => {
      const held = createRef<HTMLSpanElement>()
      let called: HTMLSpanElement | null = null
      const own = { marginInlineStart: '7px', opacity: 0.5 }
      await mounted(
        canvasElement,
        <>
          <VehicleDot line="m1" ref={held} style={own} data-testid="object" />
          <VehicleDot
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
          await expect(held.current).toHaveClass('pn-VehicleDot')
          await expect(called).toBe(within(host).getByTestId('callback'))
          await expect(object.style.marginInlineStart).toBe('7px')
          await expect(getComputedStyle(object).marginInlineStart).toBe('7px')
          await expect(getComputedStyle(object).opacity).toBe('0.5')
        },
      )
    })
    await step('its own props never reach the DOM (CR-10)', async () => {
      await mounted(
        canvasElement,
        <VehicleDot
          variant="ageing"
          line="bus"
          size="small"
          liveLabel="Own live"
          ageingLabel="Own ageing"
          estimatedLabel="Own estimated"
          timetableOnlyLabel="Own timetable only"
          noSignalLabel="Own no signal"
        />,
        async (host) => {
          const own = await waitFor(() => parts(host).root)
          await expect(own.getAttributeNames().toSorted()).toEqual([
            'aria-label',
            'class',
            'data-line',
            'data-size',
            'data-variant',
            'role',
          ])
          await expect(own).toHaveAttribute('data-variant', 'ageing')
          await expect(own).toHaveAttribute('data-line', 'bus')
          await expect(own).toHaveAttribute('data-size', 'small')
          await expect(own).toHaveAccessibleName('Own ageing')
        },
      )
    })
    await step('render swaps the element and keeps the class, data and glyph', async () => {
      await mounted(
        canvasElement,
        <VehicleDot
          line="m2"
          variant="estimated"
          size="large"
          className="caller"
          render={<i data-testid="swapped" />}
        />,
        async (host) => {
          const swapped = await waitFor(() => within(host).getByTestId('swapped'))
          await expect(swapped.tagName).toBe('I')
          await expect(swapped.className).toBe('pn-VehicleDot caller')
          await expect(swapped).toHaveAttribute('role', 'img')
          await expect(swapped).toHaveAccessibleName('Estimated')
          await expect(swapped).toHaveAttribute('data-variant', 'estimated')
          await expect(swapped).toHaveAttribute('data-line', 'm2')
          await expect(swapped).toHaveAttribute('data-size', 'large')
          const glyph = swapped.querySelector(':scope > svg.pn-VehicleDot-glyph')!
          await expect(glyph).toHaveAttribute('aria-hidden', 'true')
          await expect(glyph.querySelector('circle.pn-VehicleDot-dot')).not.toBeNull()
          await expect(getComputedStyle(dotOf(swapped)).stroke).toBe(lineColour('m2'))
        },
      )
    })
  },
}

/** A grey dot cut by a slash, whatever the line. */
export const NoSignal: Story = {
  args: { variant: 'no-signal' },
  play: async ({ canvasElement, step }) => {
    const root = within(canvasElement).getByRole('img', { name: 'No signal' })
    await step('grey on the meta line, cut, and never a ring (CR-8)', async () => {
      const style = getComputedStyle(parts(canvasElement).dot)
      await expect(style.fill).toBe(colour(NO_SIGNAL))
      await expect(style.stroke).toBe('none')
      await expectVehicleDotCut(root)
    })
    await step('the cut is not mirrored in right-to-left text (CR-8)', async () => {
      await mounted(
        canvasElement,
        <div dir="rtl">
          <VehicleDot variant="no-signal" line="m1" />
        </div>,
        async (host) => {
          const { root: rtl } = await waitFor(() => parts(host))
          await expect(getComputedStyle(rtl).direction).toBe('rtl')
          await expectVehicleDotCut(rtl)
          await expect(getComputedStyle(rtl).maskImage).toBe(getComputedStyle(root).maskImage)
        },
      )
    })
    await step('the gap is as wide as vehicle-dot.no-signal.cut-width says (CR-8)', async () => {
      const wide = { '--perron-vehicle-dot-no-signal-cut-width': '4px' } as CSSProperties
      await mounted(
        canvasElement,
        <VehicleDot variant="no-signal" line="m1" style={wide} />,
        async (host) => {
          const { root: other } = await waitFor(() => parts(host))
          await expectVehicleDotCut(other, '4px')
          await expect(getComputedStyle(other).maskImage).not.toBe(getComputedStyle(root).maskImage)
        },
      )
    })
    for (const { line, name } of LINES)
      await step(`grey on ${name}`, async () => {
        await mounted(
          canvasElement,
          <VehicleDot variant="no-signal" line={line} />,
          async (host) => {
            const { root: other, dot } = await waitFor(() => parts(host))
            await expect(other).toHaveAttribute('data-line', line)
            await expect(getComputedStyle(dot).fill).toBe(colour(NO_SIGNAL))
            await expect(getComputedStyle(dot).stroke).toBe('none')
            await expectVehicleDotCut(other)
          },
        )
      })
    await step('no other state has a cut (CR-8)', async () => {
      await mounted(
        canvasElement,
        <>
          {STATE_WORDS.filter((s) => s.variant !== 'no-signal').map(({ variant }) => (
            <VehicleDot key={variant} variant={variant} line="m1" />
          ))}
        </>,
        async (host) => {
          const roots = await waitFor(() => {
            const found = host.querySelectorAll('.pn-VehicleDot')
            expect(found).toHaveLength(4)
            return [...found]
          })
          for (const other of roots) await expect(getComputedStyle(other).maskImage).toBe('none')
        },
      )
    })
  },
}

/** A ring dashed by the timetable dash. */
export const TimetableOnly: Story = {
  args: { variant: 'timetable-only' },
  play: async ({ canvasElement }) => {
    within(canvasElement).getByRole('img', { name: 'Timetable only' })
    const style = getComputedStyle(parts(canvasElement).dot)
    await expect(style.fill).toBe('none')
    await expect(style.stroke).toBe(lineColour('m1'))
    await expect(style.strokeWidth).toBe(
      rendered('vehicle-dot-timetable-stroke-width', 'stroke-width'),
    )
    await expect(style.strokeDasharray).toBe(
      rendered('vehicle-dot-timetable-dash', 'stroke-dasharray'),
    )
  },
}

/** The outer edge of a dot, from the centre: its radius, plus half its stroke when it has one. */
function outerEdge(dot: SVGCircleElement) {
  const style = getComputedStyle(dot)
  const stroke = style.stroke === 'none' ? 0 : Number.parseFloat(style.strokeWidth) / 2
  return dot.getBBox().width / 2 + stroke
}

/** Each state at each size, beside the text that size is for. */
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--perron-space-300)' }}>
      {SIZES.map(({ size, text, role }) => (
        <div
          key={size}
          data-size-row={size}
          style={{ display: 'grid', gap: 'var(--perron-space-100)' }}
        >
          <p style={{ ...typography(role), color: 'var(--perron-color-text-secondary)' }}>{text}</p>
          <States line={args.line} size={size} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    for (const { size, token } of SIZES)
      await step(`${size}: an ${token} square, every state one outer size (CR-1)`, async () => {
        const scope = canvasElement.querySelector(`[data-size-row='${size}']`)!
        const roots = [...scope.querySelectorAll<HTMLElement>('.pn-VehicleDot')]
        await expect(roots).toHaveLength(STATE_WORDS.length)
        const side = Number.parseFloat(rendered(token, 'width'))
        const live = outerEdge(dotOf(roots[0]))
        for (const root of roots) {
          await expect(root).toHaveAttribute('data-size', size)
          const box = root.getBoundingClientRect()
          await expect(box.width).toBeCloseTo(side, 3)
          await expect(box.height).toBeCloseTo(side, 3)
          const edge = outerEdge(dotOf(root))
          await expect(Math.abs(edge - live)).toBeLessThanOrEqual(0.1 + 1e-6)
        }
      })
  },
}

const cell: CSSProperties = {
  padding: 'var(--perron-space-100) var(--perron-space-200)',
  textAlign: 'start',
  fontWeight: 'inherit',
}

/** Each state on each of the twelve lines, a row per line, named by its words. */
export const Lines: Story = {
  render: () => (
    <table style={{ borderCollapse: 'collapse', ...typography('label') }}>
      <thead>
        <tr>
          <th scope="col" style={cell}>
            Line
          </th>
          {STATE_WORDS.map(({ variant, word }) => (
            <th key={variant} scope="col" style={cell}>
              {word}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {LINES.map(({ line, name }) => (
          <tr key={line}>
            <th scope="row" style={cell}>
              {name}
            </th>
            {STATE_WORDS.map(({ variant }) => (
              <td key={variant} style={cell}>
                <VehicleDot variant={variant} line={line} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
  play: async ({ canvasElement, step }) => {
    for (const { line, name } of LINES)
      await step(`${name}: every state in its line colour, no signal grey`, async () => {
        const roots = [
          ...canvasElement.querySelectorAll<HTMLElement>(`.pn-VehicleDot[data-line='${line}']`),
        ]
        await expect(roots).toHaveLength(STATE_WORDS.length)
        for (const root of roots) {
          await expect(getComputedStyle(root).color).toBe(lineColour(line))
          const style = getComputedStyle(dotOf(root))
          const ink =
            root.dataset.variant === 'estimated' || root.dataset.variant === 'timetable-only'
              ? style.stroke
              : style.fill
          await expect(ink).toBe(
            root.dataset.variant === 'no-signal' ? colour(NO_SIGNAL) : lineColour(line),
          )
        }
      })
  },
}

/**
 * The five states with no line, beside their words, as a dot that stands for a state across many
 * lines shows them: each in the colour of the text around it (CR-7), and in `CanvasText` in forced
 * colours (CR-9).
 */
export const NoLine: Story = {
  args: { line: undefined },
  render: () => <States line={undefined} size="medium" />,
  play: async ({ canvasElement, step }) => {
    const roots = [...canvasElement.querySelectorAll<HTMLElement>('.pn-VehicleDot')]
    await expect(roots).toHaveLength(STATE_WORDS.length)
    const ink = colour('--perron-color-text-primary')
    await expect(ink).not.toBe(lineColour('m1'))
    for (const [index, { variant, word }] of STATE_WORDS.entries())
      await step(`${word}: no data-line, drawn in the text's colour`, async () => {
        const root = roots[index]
        await expect(root).not.toHaveAttribute('data-line')
        await expect(root).toHaveAttribute('data-variant', variant)
        await expect(root).toHaveAttribute('role', 'img')
        await expect(root).toHaveAttribute('aria-label', word)
        await expect(getComputedStyle(root).color).toBe(ink)
        await expectVehicleDotShape(root, variant, ink, colour(NO_SIGNAL))
      })
    const sheet = forcedColourSheet('pn-VehicleDot')
    const text = resolve('color', 'CanvasText')
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]
    try {
      await step('in forced colours, every dot with no line draws in CanvasText', async () => {
        for (const [index, { variant }] of STATE_WORDS.entries()) {
          await expect(getComputedStyle(roots[index]).color).toBe(text)
          await expectVehicleDotShape(roots[index], variant, text)
        }
      })
    } finally {
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== sheet)
    }
    await step('the sheet comes off after', async () => {
      await expect(document.adoptedStyleSheets).not.toContain(sheet)
      await expect(getComputedStyle(roots[0]).color).toBe(ink)
    })
  },
}

/** A dot's shape without its colour: its fill and opacity, its rim and dash, and its cut. */
function shape(root: Element) {
  const style = getComputedStyle(dotOf(root))
  return [
    style.fill === 'none' ? 'no fill' : `fill ${style.fillOpacity}`,
    style.stroke === 'none' ? 'no rim' : `rim ${style.strokeWidth} dash ${style.strokeDasharray}`,
    getComputedStyle(root).maskImage === 'none' ? 'whole' : 'cut',
  ].join(', ')
}

/**
 * The five states on M1 at medium, beside their words. Its first render, which the docs page, the
 * visual stage and the audits show, is in normal colours: the forced-colours look exists only while
 * its play test applies the sheet (CR-11).
 */
export const ForcedColours: Story = {
  render: (args) => <States line={args.line} size="medium" />,
  play: async ({ canvasElement, step }) => {
    const sheet = forcedColourSheet('pn-VehicleDot')
    await expect(
      sheet.cssRules.length,
      'VehicleDot rules in (forced-colors: active)',
    ).toBeGreaterThan(0)
    const roots = [...canvasElement.querySelectorAll<HTMLElement>('.pn-VehicleDot')]
    await expect(roots).toHaveLength(STATE_WORDS.length)
    const text = resolve('color', 'CanvasText')
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]
    try {
      for (const [index, { variant, word }] of STATE_WORDS.entries())
        await step(`${word}: drawn in CanvasText, in its own shape`, async () => {
          const root = roots[index]
          await expect(root).toHaveAttribute('data-variant', variant)
          await expect(getComputedStyle(root).forcedColorAdjust).toBe('none')
          await expect(getComputedStyle(root).color).toBe(text)
          await expectVehicleDotShape(root, variant, text)
        })
      await step('the five shapes differ; no signal is cut and live is not', async () => {
        const shapes = roots.map(shape)
        await expect(new Set(shapes).size, shapes.join(' | ')).toBe(STATE_WORDS.length)
        await expect(shapes[4]).toContain('cut')
        await expect(shapes[0]).toContain('whole')
        await expect(shapes[0]).toContain('fill 1')
      })
    } finally {
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== sheet)
    }
    await step('the sheet comes off after', async () => {
      await expect(document.adoptedStyleSheets).not.toContain(sheet)
      await expect(getComputedStyle(roots[0]).color).toBe(lineColour('m1'))
    })
  },
}
