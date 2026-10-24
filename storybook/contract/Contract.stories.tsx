// The contract's story tests: every registered component and pattern against the Root rule and
// the Words rule, and the keyboard play pattern each component's stories copy. Hidden from the
// sidebar; they run in npm run test:stories.
import type { ComponentProps } from 'react'
import { createPortal } from 'react-dom'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import registry from '../../packages/perron/components.json' with { type: 'json' }
import { parseRegistry } from '../../scripts/lib/entry.ts'
import * as components from '../../packages/perron/src/index.ts'
import { dictionaries, type Locale } from '../../packages/perron/src/locale/index.ts'
import * as patterns from '../../packages/perron/src/patterns.ts'
import { expectOwnedStrings } from '../../packages/perron/src/testing/owned-strings.ts'
import { rootStory } from './root.tsx'
import { callerStrings, subjects } from './subjects.ts'
import type { StoryModule } from './subjects.ts'

/** A button that keeps the Root rule, so the contract story has a subject before the registry does. */
function Sample({ ref, className, ...rest }: ComponentProps<'button'>) {
  return (
    <button {...rest} ref={ref} className={['pn-Sample', className].filter(Boolean).join(' ')} />
  )
}

const sample = { name: 'Sample', Component: Sample, args: { children: 'Sample' } }

/**
 * A root a portal moves out of the canvas to the end of `<body>`, as an overlay's popup is, so the
 * Root story holds its own lookup to finding one. The server renderer has no portals, so the
 * OwnedStrings story leaves it out.
 */
function PortalSample({ ref, className, ...rest }: ComponentProps<'div'>) {
  return createPortal(
    <div
      {...rest}
      ref={ref}
      className={['pn-PortalSample', className].filter(Boolean).join(' ')}
    />,
    document.body,
  )
}

export default {
  title: 'Contract',
  tags: ['!dev', '!autodocs'],
} satisfies Meta

const all = [
  sample,
  ...subjects(
    parseRegistry(registry),
    { ...components, ...patterns },
    import.meta.glob<StoryModule>('../../packages/perron/src/*/*/*.stories.tsx', { eager: true }),
  ),
]

/** Every registered component and pattern takes a ref and a data-testid on its root. */
export const Root: StoryObj = rootStory([
  ...all,
  { name: 'PortalSample', Component: PortalSample, args: {} },
])

/**
 * Every word each one's Default story shows or announces, in each locale, is the caller's or the
 * locale dictionary's.
 */
export const OwnedStrings: StoryObj = {
  render: () => <></>,
  play: async ({ step }) => {
    for (const { name, Component, args } of all)
      for (const locale of Object.keys(dictionaries) as Locale[])
        await step(`${name} in ${locale}: every word is the caller's or the dictionary's`, () => {
          const markup = renderToStaticMarkup(
            <components.PerronProvider locale={locale}>
              <Component {...args} />
            </components.PerronProvider>,
          )
          expectOwnedStrings(markup, locale, callerStrings(args))
        })
  },
}

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
