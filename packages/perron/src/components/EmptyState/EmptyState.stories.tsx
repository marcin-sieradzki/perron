// EmptyState's stories: one per row of the spec's Stories table (docs/components/empty-state.md),
// with the design deferred, and their play tests.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { EmptyState } from './EmptyState.tsx'

/** The `search` icon, packages/perron/icons/search.svg, inline as an app renders it. */
const searchIcon = (
  <svg
    className="perron-icon"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="7" cy="7" r="4.6" />
    <path d="m10.5 10.5 3.2 3.2" />
  </svg>
)

/**
 * The caller's action: a native button drawn with the tokens, standing in for Perron's Button,
 * which is not built yet.
 */
const clearSearch = (
  <button
    type="button"
    style={{
      minBlockSize: 'var(--perron-size-button)',
      paddingInline: 'var(--perron-space-300)',
      border: 'var(--perron-border-width-025) solid var(--perron-color-border-control)',
      borderRadius: 'var(--perron-radius-md)',
      background: 'transparent',
      font: 'var(--perron-typography-label)',
      letterSpacing: 'var(--perron-typography-label-tracking)',
      color: 'var(--perron-color-text-primary)',
    }}
  >
    Clear search
  </button>
)

export default {
  title: 'Components/EmptyState',
  component: EmptyState,
  args: { title: 'No matches for Nørrebro st' },
} satisfies Meta<typeof EmptyState>

type Story = StoryObj<typeof EmptyState>

/** Every part: the icon, the title, the sentence and an action, at rest. */
export const Default: Story = {
  args: {
    icon: searchIcon,
    title: 'No matches for Nørrebro st',
    children: 'Try a line number such as 5C.',
    action: clearSearch,
  },
  play: async ({ canvasElement }) => {
    const icon = canvasElement.querySelector('.pn-EmptyState-icon')
    await expect(icon).toHaveAttribute('aria-hidden', 'true')
    const button = within(canvasElement).getByRole('button', { name: 'Clear search' })
    await userEvent.tab()
    await expect(button).toHaveFocus()
    await userEvent.tab({ shift: true })
    await expect(button).not.toHaveFocus()
  },
}

/** The title alone: the optional parts render nothing when not given (CR-1). */
export const TitleOnly: Story = {
  args: { title: 'No departures in the next hour' },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('.pn-EmptyState')
    await expect(root).not.toBeNull()
    await expect(root?.querySelector('.pn-EmptyState-title')).toHaveTextContent(
      'No departures in the next hour',
    )
    for (const part of ['icon', 'description', 'action'])
      await expect(root?.querySelector(`.pn-EmptyState-${part}`)).toBeNull()
    await expect(root?.children).toHaveLength(1)
    await userEvent.tab()
    await expect(root?.contains(document.activeElement)).toBe(false)
  },
}
