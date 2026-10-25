// Section's stories: one per row of the spec's Stories table (docs/components/section.md), with the
// design deferred, each on a raised Surface as a section sits in a panel, and their play tests.
import type { CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { LinkButton } from '../LinkButton/LinkButton.tsx'
import { Surface } from '../Surface/Surface.tsx'
import { Section } from './Section.tsx'

const typography = (role: string): CSSProperties => ({
  font: `var(--perron-typography-${role})`,
  letterSpacing: `var(--perron-typography-${role}-tracking)`,
  margin: 0,
})

/** The caller's content: three departures in a list, each row one string. */
const departures = (
  <ul
    style={{
      ...typography('label'),
      display: 'grid',
      gap: 'var(--perron-space-200)',
      padding: 0,
      listStyle: 'none',
    }}
  >
    <li>5C Husum Torv 08:14</li>
    <li>5C Lufthavnen 08:17</li>
    <li>350S Ballerup St. 08:21</li>
  </ul>
)

/** The caller's action: one small, neutral link to the whole list, as the spec's Do and don't asks. */
const allDepartures = (
  <LinkButton href="#departures" variant="outline" size="small">
    All departures
  </LinkButton>
)

export default {
  title: 'Components/Section',
  component: Section,
  args: { title: 'Departures' },
  decorators: [
    (Story) => (
      <Surface variant="raised" style={{ maxInlineSize: '24rem' }}>
        <Story />
      </Surface>
    ),
  ],
} satisfies Meta<typeof Section>

type Story = StoryObj<typeof Section>

/** Every part: the title, a small outline LinkButton and a list of departures, at rest. */
export const Default: Story = {
  args: {
    title: 'Departures',
    action: allDepartures,
    children: departures,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const region = canvas.getByRole('region', { name: 'Departures' })
    const heading = within(region).getByRole('heading', { level: 3, name: 'Departures' })
    // the capitals are style: the DOM keeps the sentence case (CR-7)
    await expect(getComputedStyle(heading).textTransform).toBe('uppercase')
    await expect(heading.textContent).toBe('Departures')
    const link = within(region).getByRole('link', { name: 'All departures' })
    const before = document.activeElement
    await userEvent.tab()
    await expect(link).toHaveFocus()
    await userEvent.tab({ shift: true })
    await expect(document.activeElement).toBe(before)
  },
}

/** The title and a sentence, with no action: the action part renders nothing (CR-1). */
export const TitleOnly: Story = {
  args: {
    title: 'Lines here',
    children: <p style={typography('body')}>Buses 5C and 350S call at this stop.</p>,
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('.pn-Section')
    await expect(root).not.toBeNull()
    await expect(root?.querySelector('.pn-Section-action')).toBeNull()
    await expect(root?.querySelector('.pn-Section-content')).toHaveTextContent(
      'Buses 5C and 350S call at this stop.',
    )
    await userEvent.tab()
    await expect(root?.contains(document.activeElement)).toBe(false)
  },
}

/** The title made an `h2` through `slotProps.title.render`, keeping its class and the region's name (CR-4). */
export const HeadingLevel: Story = {
  args: {
    title: 'Planned works',
    slotProps: { title: { render: <h2 /> } },
    children: (
      <p style={typography('body')}>
        No M3 trains between Kongens Nytorv and Nørrebro on Saturday and Sunday.
      </p>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const heading = canvas.getByRole('heading', { level: 2, name: 'Planned works' })
    await expect(heading).toHaveClass('pn-Section-title')
    await expect(canvas.getByRole('region', { name: 'Planned works' })).toContainElement(heading)
  },
}
