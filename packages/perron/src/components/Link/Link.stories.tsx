// Link's stories: one per row of the spec's Stories table (docs/components/link.md), with the design
// deferred: the drawing's Default, Hover and Focus, then Link where callers put it. Hover and focus
// render at rest; the visual stage drives them. A decorator prevents every link's navigation, so no
// story leaves the page.
import { createRef } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Text } from '../Text/Text.tsx'
import {
  colour,
  heard,
  mounted,
  pressedAfterHover,
  resolve,
  RouterLink,
  stateFill,
  stateRules,
} from '../../testing/stories.ts'
import { Link } from './Link.tsx'

const LABEL = 'Show all departures'
const REJSEPLANEN = 'https://www.rejseplanen.dk'

const meta = {
  title: 'Components/Link',
  component: Link,
  args: { children: LABEL, href: '/departures', onClick: fn() },
  decorators: [
    (Story) => (
      // capturing every click here prevents the navigation and still lets the link's onClick fire
      <div style={{ display: 'contents' }} onClickCapture={(event) => event.preventDefault()}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Link>

export default meta

type Story = StoryObj<typeof meta>

/** The one link the story renders. */
const linkIn = (canvas: HTMLElement) => within(canvas).getAllByRole('link')[0]

/** The declarations every rule for `state` adds to `link`, by property name. */
const stateProperties = (link: Element, state: ':hover' | ':active') =>
  stateRules(link, state).flatMap((declarations) => Array.from(declarations))

/**
 * "Show all departures" alone, at rest: a native link with its words as its name, underlined in its
 * parent's colour; the contract story's subject. Its play presses every key of the Keyboard table.
 */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const link = within(canvasElement).getByRole('link', { name: LABEL })
    // a native <a href>, with no role of its own (CR-1)
    await expect(link.tagName).toBe('A')
    await expect(link).toHaveAttribute('href', '/departures')
    await expect(link).not.toHaveAttribute('role')
    await expect(link).toHaveClass('pn-Link')
    // underlined, in the colour of the text around it (CR-2)
    const style = getComputedStyle(link)
    await expect(style.textDecorationLine).toBe('underline')
    await expect(style.color).toBe(getComputedStyle(link.parentElement!).color)
    // a visited link looks as it did before: no :visited rule reaches it (CR-2)
    await expect(stateRules(link, ':visited')).toHaveLength(0)
    // Tab focuses it, Enter follows it, Space does nothing to it, Shift+Tab leaves it (CR-5)
    await userEvent.tab()
    await expect(link).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(args.onClick).toHaveBeenCalledTimes(1)
    await userEvent.keyboard(' ')
    await expect(args.onClick).toHaveBeenCalledTimes(1)
    await userEvent.tab({ shift: true })
    await expect(link).not.toHaveFocus()
  },
}

/**
 * "Show all departures", hover: the rules lay `color.surface.hover` behind it under the pointer and
 * `color.surface.selected` while pressed, and change nothing else (CR-3, CR-4).
 */
export const Hover: Story = {
  play: async ({ canvasElement }) => {
    const link = linkIn(canvasElement)
    const [hover, pressed] = ['color-surface-hover', 'color-surface-selected'].map(
      (token) => `var(--perron-${token})`,
    )
    await expect(stateFill(link, ':hover')).toBe(hover)
    await expect(stateFill(link, ':active')).toBe(pressed)
    await expect(pressedAfterHover(link)).toBe(true)
    // the hover, the pressed and the rest fill render apart from each other
    const rest = getComputedStyle(link).backgroundColor
    const [hoverFill, pressedFill] = [hover, pressed].map((v) => resolve('backgroundColor', v))
    await expect(hoverFill).not.toBe(rest)
    await expect(pressedFill).not.toBe(rest)
    await expect(pressedFill).not.toBe(hoverFill)
    // at once, with no transition (CR-11)
    await expect(getComputedStyle(link).transitionDuration).toBe('0s')
    // neither state sets a colour, an underline or a length: the background only
    for (const state of [':hover', ':active'] as const)
      for (const property of stateProperties(link, state))
        await expect(`${state} ${property}`).toBe(`${state} background-color`)
  },
}

/** "Show all departures", focus: Tab gives it `:focus-visible` and the ring perron.css draws (CR-6). */
export const Focus: Story = {
  play: async ({ canvasElement }) => {
    const link = linkIn(canvasElement)
    await userEvent.tab()
    await expect(link).toHaveFocus()
    await expect(link.matches(':focus-visible')).toBe(true)
    const ring = getComputedStyle(link)
    await expect(ring.outlineStyle).toBe('solid')
    await expect(ring.outlineColor).toBe(resolve('borderColor', 'var(--perron-color-border-focus)'))
    await expect(ring.outlineWidth).toBe(resolve('outlineWidth', 'var(--perron-focus-width)'))
    await expect(ring.outlineOffset).toBe(resolve('outlineOffset', 'var(--perron-focus-offset)'))
    await userEvent.tab({ shift: true })
    await expect(link).not.toHaveFocus()
  },
}

/** A sentence of `typography.body` in `color.text.primary`, with its source's name a Link. */
export const InText: Story = {
  args: { children: 'Rejseplanen', href: REJSEPLANEN },
  render: (args) => (
    <Text variant="body">
      Departures from <Link {...args} />, updated every 30 s.
    </Text>
  ),
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', { name: 'Rejseplanen' })
    const sentence = link.closest('.pn-Text')!
    // inline, with no padding of its own, so it never moves the text around it (CR-4)
    const [own, around] = [link, sentence].map((e) => getComputedStyle(e))
    await expect(own.display).toBe('inline')
    for (const side of ['Top', 'Right', 'Bottom', 'Left'] as const)
      await expect(own[`padding${side}`]).toBe('0px')
    // the sentence's font, line height and colour (CR-2, CR-12)
    for (const property of ['font', 'lineHeight', 'letterSpacing', 'color'] as const)
      await expect(`${property}: ${own[property]}`).toBe(`${property}: ${around[property]}`)
    await expect(heard(sentence)).toBe('Departures from Rejseplanen, updated every 30 s.')
  },
}

/** The same sentence in `typography.caption` and `color.text.secondary`. */
export const InSecondaryText: Story = {
  args: { children: 'Rejseplanen', href: REJSEPLANEN },
  render: (args) => (
    <Text variant="caption" emphasis="secondary" render={<p />}>
      Departures from <Link {...args} />, updated every 30 s.
    </Text>
  ),
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', { name: 'Rejseplanen' })
    const style = getComputedStyle(link)
    await expect(style.color).toBe(colour('--perron-color-text-secondary'))
    await expect(style.textDecorationLine).toBe('underline')
  },
}

/** A link of several words in a sentence in a 160 px column, over more than one line. */
export const Wrapping: Story = {
  args: { children: 'See every departure from Nørreport today' },
  render: (args) => (
    <div style={{ inlineSize: 160 }}>
      <Text variant="body">
        Trains run all day. <Link {...args} />.
      </Text>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const link = linkIn(canvasElement)
    // over more than one line, each with its own rounded layer (CR-4)
    await expect(link.getClientRects().length).toBeGreaterThan(1)
    await expect(getComputedStyle(link).getPropertyValue('box-decoration-break')).toBe('clone')
    // inside its column: nothing overflows it
    const column = link.closest('.pn-Text')!.parentElement!
    await expect(column.scrollWidth).toBeLessThanOrEqual(column.clientWidth)
  },
}

/** "Rejseplanen", opening in a new tab, with the caller's `target` and `rel`. */
export const NewTab: Story = {
  args: {
    children: 'Rejseplanen',
    href: REJSEPLANEN,
    target: '_blank',
    rel: 'noopener noreferrer',
  },
  play: async ({ canvasElement }) => {
    const link = linkIn(canvasElement)
    // both reach the <a> as given, and Link adds no word, icon or rel of its own (CR-10)
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    await expect(link).toHaveAccessibleName('Rejseplanen')
    await expect(link.childElementCount).toBe(0)
    await expect(link.textContent).toBe('Rejseplanen')
  },
}

/** A file to save: "Download the Nørreport timetable", with the caller's `download`. */
export const Download: Story = {
  args: {
    children: 'Download the Nørreport timetable',
    href: '/timetables/norreport.pdf',
    download: 'norreport-timetable.pdf',
  },
  play: async ({ canvasElement }) => {
    const link = linkIn(canvasElement)
    // `download` reaches the <a> as given, and Link adds no target or rel of its own (CR-10)
    await expect(link).toHaveAttribute('download', 'norreport-timetable.pdf')
    await expect(link).toHaveAttribute('href', '/timetables/norreport.pdf')
    await expect(link).not.toHaveAttribute('target')
    await expect(link).not.toHaveAttribute('rel')
    await expect(link).toHaveAccessibleName('Download the Nørreport timetable')
  },
}

/**
 * The link's words given as an element, a Danish name marked with its language, in a sentence;
 * its play renders them as a list of strings and elements too.
 */
export const RichContent: Story = {
  args: { children: <span lang="da">Rejseplanen</span>, href: REJSEPLANEN },
  render: (args) => (
    <Text variant="body">
      Departures from <Link {...args} />, updated every 30 s.
    </Text>
  ),
  play: async ({ canvasElement, step }) => {
    await step('an element renders inside the link, and names it', async () => {
      const link = within(canvasElement).getByRole('link', { name: 'Rejseplanen' })
      const words = link.querySelector('span[lang="da"]')
      await expect(words).toHaveTextContent(/^Rejseplanen$/)
      await expect(words).toBeVisible()
      await expect(heard(link.closest('.pn-Text')!)).toBe(
        'Departures from Rejseplanen, updated every 30 s.',
      )
    })
    await step('a list of strings and elements renders whole, and names it', async () => {
      await mounted(
        canvasElement,
        <Link href="/departures">
          {[
            'Departures from ',
            <span key="stop" lang="da">
              Nørreport
            </span>,
          ]}
        </Link>,
        async (host) => {
          const link = await within(host).findByRole('link', { name: 'Departures from Nørreport' })
          await expect(link).toHaveClass('pn-Link')
          await expect(link.querySelector('span[lang="da"]')).toHaveTextContent(/^Nørreport$/)
          await expect(link).toBeVisible()
        },
      )
    })
  },
}

const renderedRef = createRef<HTMLAnchorElement>()

/**
 * `render` gives a router-style link that renders an `<a>` and brings its own destination; the
 * root keeps Link's class, then the caller's, and takes the caller's style and ref.
 */
export const RenderedLink: Story = {
  args: {
    href: undefined,
    className: 'departures-link',
    style: { scrollMarginBlockStart: 'var(--perron-space-400)' },
    render: <RouterLink to="/departures" />,
  },
  render: (args) => <Link {...args} ref={renderedRef} />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('link')).toHaveLength(1)
    const link = within(canvasElement).getByRole('link', { name: LABEL })
    await expect(link).toHaveAttribute('data-router-link')
    await expect(link).toHaveAttribute('href', '/departures')
    await expect(link.className).toBe('pn-Link departures-link')
    await expect(link.style.scrollMarginBlockStart).toBe('var(--perron-space-400)')
    await expect(renderedRef.current).toBe(link)
  },
}
