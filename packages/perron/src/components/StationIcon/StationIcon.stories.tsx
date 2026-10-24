import type { CSSProperties, ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
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
}: {
  name: string
  note?: string
  children: ReactNode
  size: keyof typeof TEXT
}) {
  return (
    <div style={{ ...row, ...typography(TEXT[size]) }}>
      {children}
      <span>{name}</span>
      {note && <span style={{ color: 'var(--perron-color-text-secondary)' }}>{note}</span>}
    </div>
  )
}

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
      note={args.variant === 'filled' ? 'Next stop' : undefined}
      size={args.size ?? 'medium'}
    >
      <StationIcon {...args} />
    </Stop>
  ),
} satisfies Meta<typeof StationIcon>

export default meta
type Story = StoryObj<typeof meta>

export const OutlinedSmall: Story = { args: { variant: 'outlined', size: 'small' } }

/** A pressable stop makes its whole row the target; the marker inside is hidden and Tab passes it by. */
export const OutlinedMedium: Story = {
  args: { variant: 'outlined', size: 'medium' },
  render: (args) => (
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
      <StationIcon {...args} data-testid="marker" />
      <span>Nørreport</span>
    </button>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const marker = canvas.getByTestId('marker')
    await expect(marker).toHaveAttribute('aria-hidden', 'true')
    await expect(marker).not.toHaveAttribute('role')
    await expect(marker).not.toHaveAttribute('aria-label')
    await expect(marker).not.toHaveAttribute('tabindex')
    const stop = canvas.getByRole('button', { name: 'Nørreport' })
    await userEvent.tab()
    await expect(stop).toHaveFocus()
    await expect(marker).not.toHaveFocus()
    await userEvent.tab({ shift: true })
    await expect(stop).not.toHaveFocus()
  },
}

export const OutlinedLarge: Story = { args: { variant: 'outlined', size: 'large' } }

export const FilledSmall: Story = { args: { variant: 'filled', size: 'small' } }

export const FilledMedium: Story = { args: { variant: 'filled', size: 'medium' } }

export const FilledLarge: Story = { args: { variant: 'filled', size: 'large' } }

/** Every line, and none, named beside its marker. */
const LINES: { line: StationIconProps['line']; name: string }[] = [
  { line: 'm1', name: 'M1' },
  { line: 'm2', name: 'M2' },
  { line: 'm3', name: 'M3' },
  { line: 'm4', name: 'M4' },
  { line: 'a', name: 'A' },
  { line: 'b', name: 'B' },
  { line: 'c', name: 'C' },
  { line: 'e', name: 'E' },
  { line: 'f', name: 'F' },
  { line: 'h', name: 'H' },
  { line: 'bus', name: 'Bus' },
  { line: 'regional', name: 'Regional train' },
  { line: undefined, name: 'Several lines' },
]

export const Lines: Story = {
  args: { size: 'medium' },
  render: (args) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, max-content)',
        gap: 'var(--perron-space-100) var(--perron-space-400)',
      }}
    >
      {LINES.map(({ line, name }) =>
        (['outlined', 'filled'] as const).map((variant) => (
          <Stop key={`${name}-${variant}`} name={name} size="medium">
            <StationIcon
              {...args}
              variant={variant}
              line={line}
              data-testid={`marker-${line ?? 'none'}-${variant}`}
            />
          </Stop>
        )),
      )}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const { line } of LINES)
      for (const variant of ['outlined', 'filled']) {
        const marker = canvas.getByTestId(`marker-${line ?? 'none'}-${variant}`)
        if (line) await expect(marker).toHaveAttribute('data-line', line)
        else await expect(marker).not.toHaveAttribute('data-line')
        await expect(marker).toHaveAttribute('data-variant', variant)
      }
  },
}
