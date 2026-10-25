// Separator's stories: one per row of the spec's Stories table (docs/components/separator.md),
// with the design deferred, and their play tests, which read the DOM and the accessibility tree.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { colour, mounted, resolve, typography } from '../../testing/stories.ts'
import { Separator } from './Separator.tsx'

const meta = {
  title: 'Components/Separator',
  component: Separator,
  // only the orientation, so the contract story renders the separator alone
  args: { orientation: 'horizontal' },
} satisfies Meta<typeof Separator>

export default meta

type Story = StoryObj<typeof meta>

/** The story's own text, in `typography.body`. */
const line = (words: string) => <p style={typography('body')}>{words}</p>

/** The line's width and colour, `border.width.025` in `color.border.subtle`, as they render. */
const hairline = () => ({
  width: resolve('borderTopWidth', 'var(--perron-border-width-025)'),
  colour: colour('--perron-color-border-subtle'),
})

type Side = 'BlockStart' | 'BlockEnd' | 'InlineStart' | 'InlineEnd'

/** One border, on `side`, in the shared hairline, and no border on the other three (CR-3, CR-7). */
async function oneBorder(separator: HTMLElement, side: Side) {
  const style = getComputedStyle(separator)
  const { width, colour: subtle } = hairline()
  await expect(style[`border${side}Style`]).toBe('solid')
  await expect(style[`border${side}Width`]).toBe(width)
  await expect(style[`border${side}Color`]).toBe(subtle)
  for (const other of ['BlockStart', 'BlockEnd', 'InlineStart', 'InlineEnd'] as const) {
    if (other !== side) await expect(style[`border${other}Style`]).toBe('none')
  }
}

/** Never a tab stop, and `focus()` leaves focus where it was (CR-6). */
async function notFocusable(separator: HTMLElement) {
  await expect(separator).not.toHaveAttribute('tabindex')
  const before = document.activeElement
  separator.focus()
  await expect(document.activeElement).toBe(before)
}

/** The default orientation between two lines of a panel, in a flex column with a `space.100` gap. */
export const Horizontal: Story = {
  args: { orientation: 'horizontal' },
  render: (args) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--perron-space-100)',
        maxInlineSize: 320,
      }}
    >
      {line('Line 5C to Husum Torv')}
      <Separator {...args} />
      {line('Next departure in 4 min')}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const separator = within(canvasElement).getByRole('separator')
    // Base UI's role, aria-orientation and data-orientation, and Perron's class (CR-1, CR-2)
    await expect(separator).toHaveAttribute('aria-orientation', 'horizontal')
    await expect(separator).toHaveAttribute('data-orientation', 'horizontal')
    await expect(separator).toHaveClass('pn-Separator')
    // one border, on the block start, in the shared hairline (CR-3, CR-7)
    await oneBorder(separator, 'BlockStart')
    // as wide as its column (CR-4)
    const column = separator.parentElement!
    await expect(separator.getBoundingClientRect().width).toBe(column.getBoundingClientRect().width)
    await notFocusable(separator)
    // rendered as an <hr>, the user agent's inset border is cleared and the one hairline stays (CR-3)
    await mounted(column, <Separator render={<hr />} />, async (host) => {
      const hr = await within(host).findByRole('separator')
      await expect(hr.tagName).toBe('HR')
      await oneBorder(hr, 'BlockStart')
      await expect(hr.getBoundingClientRect().height).toBe(parseFloat(hairline().width))
    })
  },
}

/** A vertical line between two words in a flex row with a `space.100` gap. */
export const Vertical: Story = {
  args: { orientation: 'vertical' },
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--perron-space-100)' }}>
      {line('Bus')}
      <Separator {...args} />
      {line('Metro')}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const separator = within(canvasElement).getByRole('separator')
    await expect(separator).toHaveAttribute('aria-orientation', 'vertical')
    await expect(separator).toHaveAttribute('data-orientation', 'vertical')
    // one border, on the inline start, in the shared hairline (CR-3, CR-7)
    await oneBorder(separator, 'InlineStart')
    // as tall as its row, and the hairline wide (CR-4)
    const box = separator.getBoundingClientRect()
    await expect(box.height).toBe(separator.parentElement!.getBoundingClientRect().height)
    await expect(box.width).toBe(parseFloat(hairline().width))
    await notFocusable(separator)
  },
}
