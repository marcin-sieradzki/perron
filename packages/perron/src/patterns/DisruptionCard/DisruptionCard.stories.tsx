// DisruptionCard's stories: one per row of the spec's Stories table (docs/patterns/disruption-card.md),
// with the design deferred, and their play tests. Every line used has a badge pair that reaches 4.5:1,
// so axe's color-contrast rule stays on (CR-11). Hover and focus render at rest.
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, isInaccessible, userEvent, waitFor, within } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { DisruptionCard } from './DisruptionCard.tsx'
import type { DisruptionCardLine, DisruptionCardProps } from './DisruptionCard.tsx'

const meta = {
  title: 'Patterns/DisruptionCard',
  component: DisruptionCard,
  args: { severity: 'delay', title: 'Signal fault at Kongens Nytorv' },
} satisfies Meta<typeof DisruptionCard>

export default meta

type Story = StoryObj<typeof meta>
type Play = NonNullable<Story['play']>

const METRO: DisruptionCardLine[] = [
  { line: 'm2', name: 'M2' },
  { line: 'm3', name: 'M3' },
]

/** The delay the spec's Default and Delay stories show, with every word the caller gives. */
const delay = {
  severity: 'delay',
  lines: METRO,
  title: 'Signal fault at Kongens Nytorv',
  children: 'M2 and M3 trains between Kongens Nytorv and Christianshavn run slower than planned.',
} satisfies DisruptionCardProps

/** The card's root in the story. */
const rootOf = (canvasElement: HTMLElement) => {
  const root = canvasElement.querySelector<HTMLElement>('.pn-DisruptionCard')
  if (!root) throw new Error('no .pn-DisruptionCard rendered')
  return root
}

/** The kind's name is shown and read: SeverityLabel's word, in the card's header. */
const readsKind = async (canvasElement: HTMLElement, word: string) => {
  const label = within(canvasElement).getByText(word)
  await expect(label.closest('.pn-DisruptionCard-severity')).not.toBeNull()
  await expect(label.closest('.pn-DisruptionCard-header')).not.toBeNull()
  await expect(isInaccessible(label)).toBe(false)
}

/** The list named "Affected lines" holds one item per line, with its short name, in this order. */
const listsLines = async (canvasElement: HTMLElement, names: string[]) => {
  const list = within(canvasElement).getByRole('list', { name: 'Affected lines' })
  const items = within(list).getAllByRole('listitem')
  await expect(items.map((item) => item.textContent)).toEqual(names)
  for (const item of items) await expect(item).toHaveClass('pn-DisruptionCard-line', 'pn-LineBadge')
}

/** Every part: the kind, two lines, the title and the sentence, with no `slotProps`. */
export const Default: Story = { args: delay }

/** A data feed problem across the network: no lines, so no list. */
export const Data: Story = {
  args: {
    severity: 'data',
    title: 'Bus positions not updating',
    children: 'Buses across the network show timetable positions until the data feed returns.',
  },
  play: async ({ canvasElement, step }) => {
    const root = rootOf(canvasElement)
    await step('data-severity is data', async () => {
      await expect(root).toHaveAttribute('data-severity', 'data')
    })
    await step('"Data feed problems" is read', () => readsKind(canvasElement, 'Data feed problems'))
    await step('no list renders', async () => {
      await expect(within(canvasElement).queryByRole('list')).toBeNull()
      await expect(root.querySelector('.pn-DisruptionCard-lines')).toBeNull()
    })
    await step('the title is a paragraph', async () => {
      const title = root.querySelector('.pn-DisruptionCard-title')
      await expect(title?.tagName).toBe('P')
      await expect(title).toHaveTextContent('Bus positions not updating')
      await expect(within(canvasElement).queryByRole('heading')).toBeNull()
    })
  },
}

/** A delay on M2 and M3, its title made a level-3 heading through `slotProps.title.render`. */
export const Delay: Story = {
  args: { ...delay, slotProps: { title: { render: <h3 /> } } },
  play: async ({ canvasElement, step }) => {
    await step('"Delays" is read', () => readsKind(canvasElement, 'Delays'))
    await step('a list named "Affected lines" holds M2 and M3', () =>
      listsLines(canvasElement, ['M2', 'M3']),
    )
    await step('the title is a level-3 heading', async () => {
      const heading = within(canvasElement).getByRole('heading', {
        level: 3,
        name: 'Signal fault at Kongens Nytorv',
      })
      await expect(heading).toHaveClass('pn-DisruptionCard-title', 'pn-Text')
    })
    await step('affectedLinesLabel="Lines" names the list "Lines"', async () => {
      const props: DisruptionCardProps = { ...delay, affectedLinesLabel: 'Lines' }
      const host = document.createElement('div')
      canvasElement.append(host)
      const root = createRoot(host)
      root.render(<DisruptionCard {...props} />)
      try {
        const list = await waitFor(() => within(host).getByRole('list', { name: 'Lines' }))
        await expect(within(list).getAllByRole('listitem')).toHaveLength(2)
        await expect(within(host).queryByRole('list', { name: 'Affected lines' })).toBeNull()
        expectOwnedStrings(
          renderToStaticMarkup(
            <PerronProvider locale="da">
              <DisruptionCard {...props} />
            </PerronProvider>,
          ),
          'da',
          ['Lines', 'M2', 'M3', props.title as string, props.children as string],
        )
      } finally {
        root.unmount()
        host.remove()
      }
    })
  },
}

/** A bus diverted: one line, 5C. */
export const Diversion: Story = {
  args: {
    severity: 'diversion',
    lines: [{ line: 'bus', name: '5C' }],
    title: '5C diverted at Nørrebros Runddel',
    children: 'Buses towards Herlev skip Nørrebrogade and stop on Jagtvej instead.',
  },
  play: async ({ canvasElement, step }) => {
    await step('"Diversions" is read', () => readsKind(canvasElement, 'Diversions'))
    await step('the list holds one item, 5C', () => listsLines(canvasElement, ['5C']))
  },
}

/** Planned works on three S-tog lines, in a 320 px container, the narrowest screen. */
export const Planned: Story = {
  args: {
    severity: 'planned',
    lines: [
      { line: 'e', name: 'E' },
      { line: 'f', name: 'F' },
      { line: 'h', name: 'H' },
    ],
    title: 'Track works between Valby and Østerport',
    children: 'From Saturday 06:00 to Sunday 22:00, E, F and H trains run every 20 min.',
  },
  decorators: [
    (Story) => (
      <div style={{ maxInlineSize: 320 }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement, step }) => {
    await step('"Planned works" is read', () => readsKind(canvasElement, 'Planned works'))
    await step('the list holds E, F and H in the given order', () =>
      listsLines(canvasElement, ['E', 'F', 'H']),
    )
  },
}

/** Tab reaches the card made a link and Shift+Tab leaves it, so focus ends where it started. */
const tabsThrough: Play = async ({ canvasElement, step }) => {
  const root = rootOf(canvasElement)
  const link = within(canvasElement).getByRole('link', {
    name: /Signal fault at Kongens Nytorv/,
  })
  await step('the root is the link, and keeps its classes and data-severity', async () => {
    await expect(link).toBe(root)
    await expect(link).toHaveAttribute('href', '#line-m2')
    await expect(link).toHaveClass('pn-DisruptionCard', 'pn-Surface')
    await expect(link).toHaveAttribute('data-severity', 'delay')
  })
  await step('Tab focuses it and Shift+Tab leaves it', async () => {
    const before = document.activeElement
    await userEvent.tab()
    await expect(link).toHaveFocus()
    await userEvent.tab({ shift: true })
    await expect(document.activeElement).toBe(before)
  })
}

/** The whole card as a link to the line, through `render` (CR-8). */
export const Link: Story = {
  args: { ...Delay.args, render: <a href="#line-m2" /> },
  play: tabsThrough,
}
