// Separator's stories: one per row of the spec's Stories table (docs/components/separator.md),
// with the design deferred, and their play tests, which read the DOM and the accessibility tree.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { colour, resolve, typography } from '../../testing/stories.ts'
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
    const style = getComputedStyle(separator)
    const { width, colour: subtle } = hairline()
    await expect(style.borderBlockStartStyle).toBe('solid')
    await expect(style.borderBlockStartWidth).toBe(width)
    await expect(style.borderBlockStartColor).toBe(subtle)
    for (const side of ['borderBlockEndStyle', 'borderInlineStartStyle', 'borderInlineEndStyle']) {
      await expect(style[side as 'borderBlockEndStyle']).toBe('none')
    }
    // as wide as its column (CR-4)
    const column = separator.parentElement!
    await expect(separator.getBoundingClientRect().width).toBe(column.getBoundingClientRect().width)
    await notFocusable(separator)
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
    const style = getComputedStyle(separator)
    const { width, colour: subtle } = hairline()
    await expect(style.borderInlineStartStyle).toBe('solid')
    await expect(style.borderInlineStartWidth).toBe(width)
    await expect(style.borderInlineStartColor).toBe(subtle)
    for (const side of ['borderBlockStartStyle', 'borderBlockEndStyle', 'borderInlineEndStyle']) {
      await expect(style[side as 'borderBlockStartStyle']).toBe('none')
    }
    // as tall as its row, and the hairline wide (CR-4)
    const box = separator.getBoundingClientRect()
    await expect(box.height).toBe(separator.parentElement!.getBoundingClientRect().height)
    await expect(box.width).toBe(parseFloat(width))
    await notFocusable(separator)
  },
}
