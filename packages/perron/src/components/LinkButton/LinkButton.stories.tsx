// LinkButton's stories: one per variant of the deferred design, named as the spec's Stories table
// names them, and the play tests it asks for. Hover and focus render at rest; the visual stage drives
// them. A decorator prevents every link's navigation, so no story leaves the page.
import { createRef, Fragment, type ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import plus from '../../../icons/plus.svg?raw'
import search from '../../../icons/search.svg?raw'
import { Button } from '../Button/Button.tsx'
import { icon, resolve, stateFill, stateRules } from '../../testing/stories.ts'
import { LinkButton } from './LinkButton.tsx'

const LABEL = 'Back to the map'

const meta = {
  title: 'Components/LinkButton',
  component: LinkButton,
  args: { children: LABEL, href: '/map' },
  decorators: [
    (Story) => (
      // capturing every click here prevents the navigation and still lets the link's onClick fire
      <div style={{ display: 'contents' }} onClickCapture={(event) => event.preventDefault()}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LinkButton>

export default meta

type Story = StoryObj<typeof meta>
type Play = NonNullable<Story['play']>

/** The link the story renders, by its role and name. */
const linkIn = (canvas: HTMLElement) => within(canvas).getByRole('link', { name: LABEL })

/**
 * Tab focuses the link, Enter fires `onClick` once, Space fires none, Shift+Tab returns focus. The
 * link is named by its label and goes to its `href`.
 */
const follows: Play = async ({ args, canvasElement }) => {
  const link = linkIn(canvasElement)
  await expect(link).toHaveAttribute('href', '/map')
  await expect(link).not.toHaveAttribute('role')
  await userEvent.tab()
  await expect(link).toHaveFocus()
  await userEvent.keyboard('{Enter}')
  await expect(args.onClick).toHaveBeenCalledTimes(1)
  await userEvent.keyboard(' ')
  await expect(args.onClick).toHaveBeenCalledTimes(1)
  await userEvent.tab({ shift: true })
  await expect(link).not.toHaveFocus()
}

/** Hovering sets the `fill` token's background, and changes neither the border nor the geometry. */
const hoverFill =
  (fill: string): Play =>
  async ({ canvasElement }) => {
    const link = linkIn(canvasElement)
    const hover = stateRules(link, ':hover')
    await expect(stateFill(link, ':hover')).toBe(fill)
    await expect(resolve('backgroundColor', fill)).not.toBe(getComputedStyle(link).backgroundColor)
    for (const declarations of hover)
      for (const property of Array.from(declarations))
        await expect(['background-color']).toContain(property)
    await expect(stateFill(link, ':active')).toBe(fill)
  }

/** Tab gives the root `:focus-visible` and the ring perron.css draws; Shift+Tab leaves it. */
const focusRing: Play = async ({ canvasElement }) => {
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
}

export const SolidMediumDefault: Story = {
  args: { variant: 'solid', size: 'medium', onClick: fn() },
  play: follows,
}
export const SolidMediumHover: Story = {
  args: { variant: 'solid', size: 'medium' },
  play: hoverFill('var(--perron-color-surface-inverse-hover)'),
}
export const SolidMediumFocus: Story = {
  args: { variant: 'solid', size: 'medium' },
  play: focusRing,
}
export const SolidSmallDefault: Story = {
  args: { variant: 'solid', size: 'small' },
}
export const SolidSmallHover: Story = {
  args: { variant: 'solid', size: 'small' },
}
export const SolidSmallFocus: Story = {
  args: { variant: 'solid', size: 'small' },
}
export const OutlineMediumDefault: Story = {
  args: { variant: 'outline', size: 'medium' },
}
export const OutlineMediumHover: Story = {
  args: { variant: 'outline', size: 'medium' },
  play: hoverFill('var(--perron-color-surface-hover)'),
}
export const OutlineMediumFocus: Story = {
  args: { variant: 'outline', size: 'medium' },
}
export const OutlineSmallDefault: Story = {
  args: { variant: 'outline', size: 'small' },
}
export const OutlineSmallHover: Story = {
  args: { variant: 'outline', size: 'small' },
}
export const OutlineSmallFocus: Story = {
  args: { variant: 'outline', size: 'small' },
}

/** A start icon and an end icon from packages/perron/icons, hidden from screen readers. */
export const WithIcons: Story = {
  args: { variant: 'solid', size: 'medium', startIcon: icon(search), endIcon: icon(plus) },
  play: async ({ canvasElement }) => {
    const link = linkIn(canvasElement)
    const icons = link.querySelectorAll('.pn-LinkButton-startIcon, .pn-LinkButton-endIcon')
    await expect(icons).toHaveLength(2)
    for (const span of Array.from(icons)) await expect(span).toHaveAttribute('aria-hidden', 'true')
    await expect(link).toHaveAccessibleName(LABEL)
  },
}

/** `fullWidth` in a narrow container, as a bottom sheet's main link, on a phone. */
export const FullWidth: Story = {
  args: { variant: 'outline', size: 'medium', fullWidth: true },
  decorators: [
    (Story) => (
      <div style={{ maxInlineSize: 320 }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const link = linkIn(canvasElement)
    await expect(link).toHaveAttribute('data-full-width')
    const container = link.parentElement!
    await expect(link.getBoundingClientRect().width).toBe(container.getBoundingClientRect().width)
  },
}

/** A router's link component as a stand-in: it renders an `<a>` and brings its own destination. */
function RouterLink({ to, ...rest }: ComponentProps<'a'> & { to: string }) {
  return <a {...rest} href={to} data-router-link="" />
}

const renderedRef = createRef<HTMLAnchorElement>()

/** `render` gives a router-style link; the root keeps LinkButton's class and data attributes. */
export const RenderedLink: Story = {
  args: { variant: 'solid', size: 'medium', href: undefined, render: <RouterLink to="/map" /> },
  render: (args) => <LinkButton {...args} ref={renderedRef} />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('link')).toHaveLength(1)
    const link = linkIn(canvasElement)
    await expect(link).toHaveAttribute('data-router-link')
    await expect(link).toHaveAttribute('href', '/map')
    await expect(link).toHaveClass('pn-LinkButton')
    await expect(link).toHaveAttribute('data-variant', 'solid')
    await expect(link).toHaveAttribute('data-size', 'medium')
    await expect(renderedRef.current).toBe(link)
  },
}

const PAIRS = [
  ['solid', 'medium'],
  ['solid', 'small'],
  ['outline', 'medium'],
  ['outline', 'small'],
] as const

/** The computed properties a LinkButton shares with a neutral Button of its variant and size. */
const ROOT_PROPERTIES = [
  'height',
  'width',
  'paddingTop',
  'paddingBottom',
  'paddingInlineStart',
  'paddingInlineEnd',
  'columnGap',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'backgroundColor',
  'color',
  'textDecorationLine',
] as const
const LABEL_PROPERTIES = ['font', 'letterSpacing', 'color'] as const

/** A LinkButton beside a neutral Button with the same label, in each variant and size (CR-3). */
export const MatchesButton: Story = {
  args: { variant: 'solid', size: 'medium' },
  render: (args) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, max-content)',
        gap: 'var(--perron-space-400)',
        alignItems: 'center',
        // each at its own width, so the pair's widths are compared, not the column's
        justifyItems: 'start',
      }}
    >
      {PAIRS.map(([variant, size]) => (
        <Fragment key={`${variant}-${size}`}>
          <LinkButton {...args} variant={variant} size={size} />
          <Button variant={variant} color="neutral" size={size}>
            {args.children}
          </Button>
        </Fragment>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const links = canvas.getAllByRole('link', { name: LABEL })
    const buttons = canvas.getAllByRole('button', { name: LABEL })
    await expect(links).toHaveLength(PAIRS.length)
    for (const [i, link] of links.entries()) {
      const button = buttons[i]
      const [l, b] = [getComputedStyle(link), getComputedStyle(button)]
      for (const property of ROOT_PROPERTIES)
        await expect(`${PAIRS[i]} ${property}: ${l[property]}`).toBe(
          `${PAIRS[i]} ${property}: ${property === 'textDecorationLine' ? 'none' : b[property]}`,
        )
      const [ll, bl] = [link, button].map((e) =>
        getComputedStyle(e.querySelector('[class$="-label"]')!),
      )
      for (const property of LABEL_PROPERTIES)
        await expect(`${PAIRS[i]} label ${property}: ${ll[property]}`).toBe(
          `${PAIRS[i]} label ${property}: ${bl[property]}`,
        )
      await expect(stateFill(link, ':hover')).toBe(stateFill(button, ':hover'))
      await expect(stateFill(link, ':active')).toBe(stateFill(button, ':active'))
      // a visited link looks as it did before: no :visited rule reaches it (CR-6)
      await expect(stateRules(link, ':visited')).toHaveLength(0)
    }
  },
}
