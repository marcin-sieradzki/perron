// Stat's stories: one per row of the spec's Stories table (docs/components/stat.md), with the
// design deferred, and their play tests, which read what the eye sees and what the ear hears.
import { renderToStaticMarkup } from 'react-dom/server'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import { dictionaries, type Locale } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { heard } from '../../testing/stories.ts'
import { Stat } from './Stat.tsx'

export default {
  title: 'Components/Stat',
  component: Stat,
  args: { label: 'Reporting live' },
} satisfies Meta<typeof Stat>

type Story = StoryObj<typeof Stat>

/** The root Stat rendered inside `canvas`. */
const rootIn = (canvas: HTMLElement) => canvas.querySelector<HTMLElement>('.pn-Stat')!

/** What the ear hears of each part, in reading order. */
const heardInOrder = (root: HTMLElement) => [...root.children].map(heard).filter(Boolean)

/** Tab once, and expect focus to land nowhere inside `root`. */
async function expectNoFocus(root: HTMLElement) {
  await userEvent.tab()
  await expect(root.contains(document.activeElement)).toBe(false)
  await userEvent.tab({ shift: true })
}

/** The label over the figure: "Reporting live" over "412". */
export const Default: Story = {
  args: { label: 'Reporting live', children: '412' },
  play: async ({ canvasElement }) => {
    const root = rootIn(canvasElement)
    await expect(heardInOrder(root)).toEqual(['Reporting live', '412'])
    await expect(root.firstElementChild).toHaveClass('pn-Stat-label')
    await expect(root).not.toHaveAttribute('data-unknown')
    const value = root.querySelector('.pn-Stat-value')!
    await expect(value).not.toHaveAttribute('data-unknown')
    await expect(getComputedStyle(value).fontVariantNumeric).toBe('tabular-nums')
    // CR-10: the root is as wide as its widest part, not its container
    await document.fonts.ready
    const widest = Math.max(...[...root.children].map((part) => part.getBoundingClientRect().width))
    await expect(root.getBoundingClientRect().width).toBeCloseTo(widest, 0)
    await expectNoFocus(root)
  },
}

/** No figure: "—" under the label, heard as "Unknown" (CR-3, CR-4). */
export const Unknown: Story = {
  args: { label: 'Reporting live' },
  play: async ({ canvasElement }) => {
    const root = rootIn(canvasElement)
    await expect(root).toHaveAttribute('data-unknown', '')
    await expect(root.querySelector('.pn-Stat-value')).toHaveAttribute('data-unknown', '')
    const dash = root.querySelector('.pn-Stat-value [aria-hidden="true"]')
    await expect(dash).toHaveTextContent('—')
    await expect(heardInOrder(root)).toEqual(['Reporting live', 'Unknown'])
    await expectNoFocus(root)
    for (const locale of Object.keys(dictionaries) as Locale[])
      expectOwnedStrings(
        renderToStaticMarkup(
          <PerronProvider locale={locale}>
            <Stat label="Reporting live" />
          </PerronProvider>,
        ),
        locale,
        ['Reporting live'],
      )
  },
}
