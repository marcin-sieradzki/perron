import type { CSSProperties, ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, getRoles, isInaccessible, userEvent, within } from 'storybook/test'
import { StationIcon } from './StationIcon.tsx'
import type { StationIconProps } from './StationIcon.tsx'

/** The text beside each size of marker: caption, label and panel title (docs/components/station-icon.md). */
const TEXT = {
  small: 'caption',
  medium: 'label',
  large: 'heading-md',
} as const

const typography = (role: string): CSSProperties => ({
  font: `var(--perron-typography-${role})`,
  letterSpacing: `var(--perron-typography-${role}-tracking)`,
})

const row: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--perron-space-100)',
}

/**
 * A marker beside the stop's name, set in the text its size is for, with what a filled marker
 * means said in words after it.
 */
function Stop({
  name,
  note,
  children,
  size,
  as: Element = 'div',
}: {
  name: string
  note?: string
  children: ReactNode
  size: keyof typeof TEXT
  as?: 'div' | 'li'
}) {
  return (
    <Element style={{ ...row, ...typography(TEXT[size]) }}>
      {children}
      {/* the name and the note wrap as one line of text */}
      <span>
        {name}
        {note && (
          <>
            {' '}
            <span style={{ color: 'var(--perron-color-text-secondary)' }}>{note}</span>
          </>
        )}
      </span>
    </Element>
  )
}

/** What the filled marker means, said in words beside it, as the spec's Do and don't asks. */
const NOTE = 'Next stop'

const meta = {
  title: 'Components/StationIcon',
  component: StationIcon,
  args: { variant: 'outlined', size: 'medium' },
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
  render: (args) => (
    <Stop
      name="Nørreport"
      note={args.variant === 'filled' ? NOTE : undefined}
      size={args.size ?? 'medium'}
    >
      <StationIcon {...args} />
    </Stop>
  ),
} satisfies Meta<typeof StationIcon>

export default meta
type Story = StoryObj<typeof meta>

export const OutlinedSmall: Story = { args: { variant: 'outlined', size: 'small' } }

/** A pressable stop: its whole row is the target, with the marker inside it. */
function PressableStop({ name, children }: { name: string; children: ReactNode }) {
  return (
    <button
      type="button"
      style={{
        ...row,
        ...typography('label'),
        minBlockSize: 'var(--perron-size-target-min)',
        padding: '0 var(--perron-space-100)',
        border: 0,
        borderRadius: 'var(--perron-radius-md)',
        background: 'transparent',
        color: 'inherit',
        cursor: 'pointer',
      }}
    >
      {children}
      <span>{name}</span>
    </button>
  )
}

/**
 * Two pressable stops, each row the target; the marker inside the first is hidden, and Tab passes
 * it by from the first stop straight to the next.
 */
export const OutlinedMedium: Story = {
  args: { variant: 'outlined', size: 'medium' },
  render: (args) => (
    <div style={{ display: 'grid', justifyItems: 'start' }}>
      <PressableStop name="Nørreport">
        <StationIcon {...args} data-testid="marker" />
      </PressableStop>
      <PressableStop name="Kongens Nytorv">
        <StationIcon {...args} />
      </PressableStop>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const marker = canvas.getByTestId('marker')
    // hidden, with no role and no name: out of the accessibility tree, so no role query finds it
    await expect(marker).toHaveAttribute('aria-hidden', 'true')
    await expect(marker).not.toHaveAttribute('role')
    await expect(marker).not.toHaveAttribute('aria-label')
    await expect(marker).not.toHaveAttribute('aria-labelledby')
    await expect(marker).not.toHaveAttribute('title')
    await expect(marker).not.toHaveAccessibleName()
    await expect(isInaccessible(marker)).toBe(true)
    await expect(Object.values(getRoles(canvasElement)).flat()).not.toContain(marker)
    // the stop's name is only its words: the marker adds nothing to it
    const stop = canvas.getByRole('button', { name: 'Nørreport' })
    const next = canvas.getByRole('button', { name: 'Kongens Nytorv' })
    await expect(stop).toContainElement(marker)
    // the marker sits between the two stops in reading order, and Tab goes from one to the next
    await expect(marker).not.toHaveAttribute('tabindex')
    const start = document.activeElement
    await userEvent.tab()
    await expect(stop).toHaveFocus()
    await userEvent.tab()
    await expect(next).toHaveFocus()
    await expect(marker).not.toHaveFocus()
    await userEvent.tab({ shift: true })
    await expect(stop).toHaveFocus()
    // back to the resting state: focus where it started, before the first stop
    await userEvent.tab({ shift: true })
    await expect(document.activeElement).toBe(start)
  },
}

export const OutlinedLarge: Story = { args: { variant: 'outlined', size: 'large' } }

export const FilledSmall: Story = { args: { variant: 'filled', size: 'small' } }

export const FilledMedium: Story = { args: { variant: 'filled', size: 'medium' } }

export const FilledLarge: Story = { args: { variant: 'filled', size: 'large' } }

/** Every line, and none, each a stop on it with the line named after the stop's name. */
const LINES: { line: StationIconProps['line']; name: string }[] = [
  { line: 'm1', name: 'Vestamager, M1' },
  { line: 'm2', name: 'Lufthavnen, M2' },
  { line: 'm3', name: 'Marmorkirken, M3' },
  { line: 'm4', name: 'Orientkaj, M4' },
  { line: 'a', name: 'Hillerød, A' },
  { line: 'b', name: 'Farum, B' },
  { line: 'c', name: 'Klampenborg, C' },
  { line: 'e', name: 'Køge, E' },
  { line: 'f', name: 'Grøndal, F' },
  { line: 'h', name: 'Frederikssund, H' },
  { line: 'bus', name: 'Rådhuspladsen, bus 5C' },
  { line: 'regional', name: 'Roskilde, regional train' },
  { line: undefined, name: 'Nørreport, several lines' },
]

/**
 * Each line is its own two-stop list, so each list fills one stop and says why in words beside it:
 * an outlined stop, then the filled next stop.
 */
export const Lines: Story = {
  args: { size: 'medium' },
  render: (args) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, max-content))',
        rowGap: 'var(--perron-space-100)',
      }}
    >
      {LINES.map(({ line, name }) => (
        <ul
          key={name}
          style={{
            display: 'grid',
            gridColumn: '1 / -1',
            gridTemplateColumns: 'subgrid',
            columnGap: 'var(--perron-space-400)',
            margin: 0,
            padding: 0,
            listStyle: 'none',
          }}
        >
          {(['outlined', 'filled'] as const).map((variant) => (
            <Stop
              key={variant}
              as="li"
              name={name}
              note={variant === 'filled' ? NOTE : undefined}
              size="medium"
            >
              <StationIcon
                {...args}
                variant={variant}
                line={line}
                data-testid={`marker-${line ?? 'none'}-${variant}`}
              />
            </Stop>
          ))}
        </ul>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const lists = canvas.getAllByRole('list')
    await expect(lists).toHaveLength(LINES.length)
    for (const [index, { line, name }] of LINES.entries()) {
      // one filled stop per list, with its meaning in words beside it
      const items = within(lists[index]).getAllByRole('listitem')
      await expect(items.map((item) => item.textContent)).toEqual([name, `${name} ${NOTE}`])
      for (const variant of ['outlined', 'filled']) {
        const marker = canvas.getByTestId(`marker-${line ?? 'none'}-${variant}`)
        if (line) await expect(marker).toHaveAttribute('data-line', line)
        else await expect(marker).not.toHaveAttribute('data-line')
        await expect(marker).toHaveAttribute('data-variant', variant)
      }
    }
  },
}
