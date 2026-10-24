// EmptyState's stories: one per row of the spec's Stories table (docs/components/empty-state.md),
// with the design deferred, and their play tests.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import search from '../../../icons/search.svg?raw'
import { Button } from '../Button/Button.tsx'
import { EmptyState } from './EmptyState.tsx'

/** The `search` icon, packages/perron/icons/search.svg, inline as an app renders it. */
const searchIcon = (
  <span
    style={{ display: 'contents' }}
    dangerouslySetInnerHTML={{ __html: search.replace('<svg ', '<svg class="perron-icon" ') }}
  />
)

/** The caller's action: one neutral Button, as the spec's Do and don't asks. */
const clearSearch = (
  <Button variant="outline" color="neutral">
    Clear search
  </Button>
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
    const before = document.activeElement
    await userEvent.tab()
    await expect(button).toHaveFocus()
    await userEvent.tab({ shift: true })
    await expect(document.activeElement).toBe(before)
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
