// Attribution's stories: one per row of the spec's Stories table (docs/components/attribution.md),
// with the design deferred, each on a map-like backdrop of color.map.land, so the glass is seen over
// what it sits on in Mylder. The play tests read the DOM and the accessibility tree, not the pixels.
import type { CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Attribution } from './Attribution.tsx'

/** Land with streets and water across it, under the strip, so the blur has something to soften. */
const BACKDROP: CSSProperties = {
  background: [
    'repeating-linear-gradient(35deg, var(--perron-color-map-street) 0 var(--perron-space-100), transparent var(--perron-space-100) var(--perron-space-600))',
    'radial-gradient(circle at 30% 20%, var(--perron-color-map-water) 0 30%, transparent 30%)',
    'var(--perron-color-map-land)',
  ].join(', '),
  padding: 'var(--perron-space-500)',
}

const OSM = 'https://www.openstreetmap.org/copyright'

const meta = {
  title: 'Components/Attribution',
  component: Attribution,
  // the one required prop, the caller's words, so any story renders alone
  args: {
    children: (
      <>
        Map data © <a href={OSM}>OpenStreetMap contributors</a>
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div style={BACKDROP}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Attribution>

export default meta

type Story = StoryObj<typeof meta>

/** The one Attribution rendered inside `canvas`. */
const rootIn = (canvas: HTMLElement) => canvas.querySelector<HTMLElement>('.pn-Attribution')!

/** `element`'s text content, its white space collapsed: the strip has no role and no hidden text, so this is what a screen reader reads. */
const textOf = (element: Element) => element.textContent!.replace(/\s+/g, ' ').trim()

/** A token's value as it renders, through a probe that reads it as `color`. */
function rendered(token: string) {
  const probe = document.createElement('div')
  probe.style.color = `var(--perron-${token})`
  document.body.append(probe)
  const value = getComputedStyle(probe).color
  probe.remove()
  return value
}

/** Start from the top of the page, whatever a story before left focused. */
const blur = () => (document.activeElement as HTMLElement | null)?.blur()

/** "Map data © OpenStreetMap contributors", with the source's name a link to its terms; the contract story's subject. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const root = rootIn(canvasElement)
    // the native <small>, with Perron's class and no role, ARIA or data attribute (CR-1)
    await expect(root.tagName).toBe('SMALL')
    await expect(root).toHaveClass('pn-Attribution')
    const names = root.getAttributeNames()
    await expect(names.filter((n) => n === 'role' || n.startsWith('aria-'))).toEqual([])
    await expect(names.filter((n) => n.startsWith('data-'))).toEqual([])
    await expect(textOf(root)).toBe('Map data © OpenStreetMap contributors')
    // the caller's link, named by its text and underlined (CR-4)
    const link = within(root).getByRole('link', { name: 'OpenStreetMap contributors' })
    await expect(link).toHaveAttribute('href', OSM)
    await expect(getComputedStyle(link).textDecorationLine).toBe('underline')
    // the link is the one tab stop; the strip never takes focus (CR-2)
    await expect(root).not.toHaveAttribute('tabindex')
    blur()
    await userEvent.tab()
    await expect(link).toHaveFocus()
    await userEvent.tab({ shift: true })
    await expect(link).not.toHaveFocus()
    await expect(root).not.toHaveFocus()
  },
}

/** "Departures from Rejseplanen": a string, with no link. */
export const PlainText: Story = {
  args: { children: 'Departures from Rejseplanen' },
  play: async ({ canvasElement }) => {
    const root = rootIn(canvasElement)
    await expect(textOf(root)).toBe('Departures from Rejseplanen')
    // nothing in it takes focus (CR-2)
    blur()
    await userEvent.tab()
    await expect(root.contains(document.activeElement)).toBe(false)
    await userEvent.tab({ shift: true })
    // the credits' ink is secondary text, not tertiary
    await expect(getComputedStyle(root).color).toBe(rendered('color-text-secondary'))
  },
}

/** Two credits, each with its link, as a list of children, wrapping in a 200 px column (CR-3). */
export const Wrapping: Story = {
  args: {
    children: [
      'Map data © ',
      <a key="osm" href={OSM}>
        OpenStreetMap contributors
      </a>,
      '. Departures from ',
      <a key="rejseplanen" href="https://www.rejseplanen.dk">
        Rejseplanen
      </a>,
    ],
  },
  render: (args) => (
    <div style={{ inlineSize: 200 }}>
      <Attribution {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = rootIn(canvasElement)
    const column = root.parentElement!.getBoundingClientRect()
    const style = getComputedStyle(root)
    const oneLine =
      parseFloat(style.lineHeight) + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)
    // more than one line tall, so the credits wrap rather than overflow
    await expect(root.getBoundingClientRect().height).toBeGreaterThan(oneLine)
    // inside its column: nothing overflows the strip, and the strip no wider than what holds it
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
    await expect(root.getBoundingClientRect().right).toBeLessThanOrEqual(column.right)
    // both credits, read in order, with both links
    await expect(textOf(root)).toBe(
      'Map data © OpenStreetMap contributors. Departures from Rejseplanen',
    )
    const links = within(root).getAllByRole('link')
    await expect(links.map(textOf)).toEqual(['OpenStreetMap contributors', 'Rejseplanen'])
  },
}
