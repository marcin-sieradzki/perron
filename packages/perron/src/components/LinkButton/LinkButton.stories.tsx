// LinkButton's stories: the link alone with every prop a control, each variant at each size, its
// icons, full width, a router link, and LinkButton beside Button. Hover and focus are play steps,
// not stories; the visual stage drives them.
import { createRef, Fragment } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { showcase } from '../../testing/Showcase.tsx'
import { expect, fn, within } from 'storybook/test'
import plus from '../../../icons/plus.svg?raw'
import search from '../../../icons/search.svg?raw'
import { Button } from '../Button/Button.tsx'
import {
  expectFocusRing,
  expectFollows,
  icon,
  pressedAfterHover,
  resolve,
  RouterLink,
  stateFill,
  stateRules,
} from '../../testing/stories.ts'
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
/** The args a story renders with: the meta's and its own. */
type StoryArgs = Parameters<NonNullable<Story['render']>>[0]
type Play = NonNullable<Story['play']>

/** The link the story renders, by its role and name. */
const linkIn = (canvas: HTMLElement) => within(canvas).getByRole('link', { name: LABEL })

/**
 * Hovering sets the `fill` token's background, and changes neither the border nor the geometry;
 * pressing sets the `pressed` token's, a step past it.
 */
const hoverFill =
  (fill: string, pressed: string): Play =>
  async ({ canvasElement }) => {
    const link = linkIn(canvasElement)
    const hover = stateRules(link, ':hover')
    await expect(stateFill(link, ':hover')).toBe(fill)
    await expect(resolve('backgroundColor', fill)).not.toBe(getComputedStyle(link).backgroundColor)
    for (const declarations of hover)
      for (const property of Array.from(declarations))
        await expect(['background-color']).toContain(property)
    await expect(stateFill(link, ':active')).toBe(pressed)
    await expect(pressedAfterHover(link)).toBe(true)
    await expect(resolve('backgroundColor', pressed)).not.toBe(resolve('backgroundColor', fill))
    await expect(resolve('backgroundColor', pressed)).not.toBe(
      getComputedStyle(link).backgroundColor,
    )
    for (const declarations of stateRules(link, ':active'))
      for (const property of Array.from(declarations))
        await expect(['background-color']).toContain(property)
  }

const renderedRef = createRef<HTMLAnchorElement>()

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

/**
 * The link is named by its label and goes to its `href`; Tab focuses it, Enter fires `onClick`
 * once, Space fires none, and Shift+Tab moves focus back to the element before it.
 */
const solidMediumDefault = {
  args: { variant: 'solid', size: 'medium', onClick: fn() },
  play: async ({ args, canvasElement }) => {
    const link = linkIn(canvasElement)
    await expect(link).toHaveAttribute('href', '/map')
    await expect(link).not.toHaveAttribute('role')
    await expectFollows(canvasElement, link, args.onClick)
  },
} satisfies Story

const solidMediumHover = {
  args: { variant: 'solid', size: 'medium' },
  play: hoverFill(
    'var(--perron-color-surface-inverse-hover)',
    'var(--perron-color-surface-inverse-pressed)',
  ),
} satisfies Story

const solidMediumFocus = {
  args: { variant: 'solid', size: 'medium' },
  play: async ({ canvasElement }) => expectFocusRing(canvasElement, linkIn(canvasElement)),
} satisfies Story

const solidSmallDefault = {
  args: { variant: 'solid', size: 'small' },
} satisfies Story

const outlineMediumHover = {
  args: { variant: 'outline', size: 'medium' },
  play: hoverFill('var(--perron-color-surface-hover)', 'var(--perron-color-surface-selected)'),
} satisfies Story

const outlineSmallDefault = {
  args: { variant: 'outline', size: 'small' },
} satisfies Story

/** The link alone, every prop a control: solid, medium. */
export const Default: Story = {
  args: { variant: 'solid', size: 'medium', onClick: fn() },
  play: async (context) => {
    await solidMediumDefault.play(context)
    await solidMediumFocus.play(context)
  },
}

/** Each variant at each size. */
export const Variants: Story = {
  ...showcase<StoryArgs>(
    [
      { label: 'Solid, medium', story: solidMediumHover },
      { label: 'Solid, small', story: solidSmallDefault },
      { label: 'Outline, medium', story: outlineMediumHover },
      { label: 'Outline, small', story: outlineSmallDefault },
    ],
    (args) => <LinkButton {...args} />,
  ),
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
