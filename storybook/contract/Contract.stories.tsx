// The contract's story tests: every registered component and pattern against the Root rule, and the
// keyboard play pattern each component's stories copy. Hidden from the sidebar; they run in
// npm run test:stories.
import type { ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import registry from '../../packages/perron/components.json' with { type: 'json' }
import * as components from '../../packages/perron/src/index.ts'
import * as patterns from '../../packages/perron/src/patterns.ts'
import { rootStory } from './root.tsx'
import { subjects } from './subjects.ts'
import type { StoryModule } from './subjects.ts'

/** A button that keeps the Root rule, so the contract story has a subject before the registry does. */
function Sample({ ref, className, ...rest }: ComponentProps<'button'>) {
  return (
    <button {...rest} ref={ref} className={['pn-Sample', className].filter(Boolean).join(' ')} />
  )
}

const sample = { name: 'Sample', Component: Sample, args: { children: 'Sample' } }

export default {
  title: 'Contract',
  tags: ['!dev', '!autodocs'],
} satisfies Meta

/** Every registered component and pattern takes a ref and a data-testid on its root. */
export const Root: StoryObj = rootStory([
  sample,
  ...subjects(
    registry,
    { ...components, ...patterns },
    import.meta.glob<StoryModule>('../../packages/perron/src/*/*/*.stories.tsx', { eager: true }),
  ),
])

/** Tab reaches the button and Shift+Tab leaves it, so focus ends where it started. */
export const Keyboard: StoryObj = {
  render: () => <Sample>Sample</Sample>,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Sample' })
    await userEvent.tab()
    await expect(button).toHaveFocus()
    await userEvent.tab({ shift: true })
    await expect(button).not.toHaveFocus()
  },
}
