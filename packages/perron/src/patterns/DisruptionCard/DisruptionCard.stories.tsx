// DisruptionCard's stories: one per row of the spec's Stories table (docs/patterns/disruption-card.md),
// with the design deferred, and their play tests. Every line used has a badge pair that reaches 4.5:1,
// so axe's color-contrast rule stays on (CR-11). Hover and focus render at rest.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, isInaccessible, userEvent, within } from 'storybook/test'
import { LinkButton } from '../../components/LinkButton/LinkButton.tsx'
import { heard, onHover, pressedAfterHover, stateRules } from '../../testing/stories.ts'
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

/** Five stops on M2 and M3's shared stretch, more than the three a list names. */
const FIVE_STOPS = ['Nørreport', 'Kongens Nytorv', 'Christianshavn', 'Islands Brygge', 'DR Byen']

/** The action the spec's stories give: one link to the disruption on the map. */
const SHOW_ON_MAP = (
  <LinkButton href="#map" size="small">
    Show on map
  </LinkButton>
)

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

/**
 * "Affected lines" is read just before an unnamed list in the header, which holds one item per line, with
 * its short name, in this order.
 */
const listsLines = async (scope: HTMLElement, names: string[]) => {
  const list = within(scope).getByRole('list')
  await expect(list).toHaveAccessibleName('')
  await expect(list.closest('.pn-DisruptionCard-header')).not.toBeNull()
  const said = list.previousElementSibling as HTMLElement | null
  await expect(said?.textContent).toBe('Affected lines')
  await expect(isInaccessible(said as HTMLElement)).toBe(false)
  // read, never seen: the VisuallyHidden part's 1 px clipped box
  await expect(said?.getBoundingClientRect().width).toBeLessThanOrEqual(1)
  const items = within(list).getAllByRole('listitem')
  await expect(items.map((item) => item.textContent)).toEqual(names)
  for (const item of items) await expect(item).toHaveClass('pn-DisruptionCard-line', 'pn-LineBadge')
}

/**
 * One of the card's caption parts, `stops` or `time`: a paragraph after the parts before it, read as
 * its words.
 */
const readsPart = async (canvasElement: HTMLElement, part: 'stops' | 'time', words: string) => {
  const root = rootOf(canvasElement)
  const element = root.querySelector<HTMLElement>(`.pn-DisruptionCard-${part}`)
  await expect(element).not.toBeNull()
  await expect(element?.tagName).toBe('P')
  await expect(element).toHaveClass('pn-Text')
  await expect(element).toHaveAttribute('data-variant', 'caption')
  await expect(element).toHaveAttribute('data-emphasis', 'secondary')
  await expect(heard(element!)).toBe(words)
  return element!
}

/**
 * Every part: the kind, two lines, the title, the sentence, the stops, the time and the action, with
 * no `slotProps`.
 */
export const Default: Story = {
  args: { ...delay, stops: FIVE_STOPS, time: { from: '08:03' }, action: SHOW_ON_MAP },
}

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
    await step('"Affected lines" is read just before an unnamed list holding M2 and M3', () =>
      listsLines(canvasElement, ['M2', 'M3']),
    )
    await step('the title is a level-3 heading', async () => {
      const heading = within(canvasElement).getByRole('heading', {
        level: 3,
        name: 'Signal fault at Kongens Nytorv',
      })
      await expect(heading).toHaveClass('pn-DisruptionCard-title', 'pn-Text')
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

/** A service notice: a message whose fields don't say which kind it is, shown as received. */
export const Notice: Story = {
  args: {
    severity: 'notice',
    lines: [{ line: 'bus', name: '5C' }],
    title: 'New stop names on 5C',
    children: 'From Sunday, Ålholm Plads is called Ålholm Station.',
  },
  play: async ({ canvasElement, step }) => {
    await step('data-severity is notice', async () => {
      await expect(rootOf(canvasElement)).toHaveAttribute('data-severity', 'notice')
    })
    await step('"Service notice" is read', () => readsKind(canvasElement, 'Service notice'))
    await step('the list holds one item, 5C', () => listsLines(canvasElement, ['5C']))
  },
}

/** Planned works on three S-tog lines, in a 200 px container, so the badges wrap under the kind. */
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
      <div style={{ maxInlineSize: 200 }}>
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

/** A delay affecting five stops: the list names the first two and counts the other three. */
export const Stops: Story = {
  args: { ...delay, stops: FIVE_STOPS },
  play: async ({ canvasElement, step }) => {
    await step(
      '"Affects Nørreport, Kongens Nytorv and 3 more" is read, after the sentence',
      async () => {
        const stops = await readsPart(
          canvasElement,
          'stops',
          'Affects Nørreport, Kongens Nytorv and 3 more',
        )
        await expect(stops.previousElementSibling).toHaveClass('pn-DisruptionCard-description')
      },
    )
    await step('no time and no action render', async () => {
      const root = rootOf(canvasElement)
      await expect(root.querySelector('.pn-DisruptionCard-time')).toBeNull()
      await expect(root.querySelector('.pn-DisruptionCard-action')).toBeNull()
    })
  },
}

/** Replacement buses on a stretch, between its two ends, over two days. */
export const Stretch: Story = {
  args: {
    severity: 'planned',
    lines: [{ line: 'regional', name: 'RE' }],
    title: 'Buses replace trains on the coast line',
    children: 'Regional trains run as far as Hellerup. Buses run on to Klampenborg every 10 min.',
    stops: { from: 'Hellerup', to: 'Klampenborg' },
    time: { from: '24', to: '25 October' },
  },
  play: async ({ canvasElement, step }) => {
    await step('"Between Hellerup and Klampenborg" is read', async () => {
      await readsPart(canvasElement, 'stops', 'Between Hellerup and Klampenborg')
    })
    await step('"24 to 25 October" is read, after the stops', async () => {
      const time = await readsPart(canvasElement, 'time', '24 to 25 October')
      await expect(time.previousElementSibling).toHaveClass('pn-DisruptionCard-stops')
    })
  },
}

/** A delay with a start and no end, its time a `<time>` element. */
export const Time: Story = {
  args: { ...delay, time: { from: <time dateTime="08:03">08:03</time> } },
  play: async ({ canvasElement, step }) => {
    await step('"From 08:03" is read, the caller\'s <time> element kept inside it', async () => {
      const time = await readsPart(canvasElement, 'time', 'From 08:03')
      await expect(time.querySelector('time')).toHaveAttribute('datetime', '08:03')
      await expect(time.previousElementSibling).toHaveClass('pn-DisruptionCard-description')
    })
  },
}

/** A delay with one action at its foot, a link to the disruption on the map. */
export const Action: Story = {
  args: { ...delay, action: SHOW_ON_MAP },
  play: async ({ canvasElement, step }) => {
    const root = rootOf(canvasElement)
    const link = within(canvasElement).getByRole('link', { name: 'Show on map' })
    await step("the action is the last part, holding the caller's link", async () => {
      const action = link.closest('.pn-DisruptionCard-action')
      await expect(action).not.toBeNull()
      await expect(action?.parentElement).toBe(root)
      await expect(root.lastElementChild).toBe(action)
      await expect(link).toHaveAttribute('href', '#map')
    })
    await step("the link keeps its own width rather than the card's", async () => {
      await expect(link.getBoundingClientRect().width).toBeLessThan(
        root.getBoundingClientRect().width / 2,
      )
    })
    await step('Tab focuses the link, not the card, and Shift+Tab leaves it', async () => {
      const before = document.activeElement
      await userEvent.tab()
      await expect(link).toHaveFocus()
      await userEvent.tab({ shift: true })
      await expect(document.activeElement).toBe(before)
    })
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
  await step('it hovers, presses a step past hover and takes the pointer (CR-8)', async () => {
    await expect(onHover(link, 'background-image')).toContain('--perron-color-surface-hover')
    await expect(
      stateRules(link, ':active').some((s) =>
        s.getPropertyValue('background-image').includes('--perron-color-surface-selected'),
      ),
    ).toBe(true)
    await expect(pressedAfterHover(link)).toBe(true)
    await expect(getComputedStyle(link).cursor).toBe('pointer')
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
