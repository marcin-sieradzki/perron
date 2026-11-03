// Brand's stories: the brand with every prop a control, each variant, each as a link, and the brand
// name overridden.
import { createRef } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { showcase } from '../../testing/Showcase.tsx'
import { expect, userEvent, within } from 'storybook/test'
import { Brand } from './Brand.tsx'

const meta = {
  title: 'Components/Brand',
  component: Brand,
  args: { variant: 'full' },
  decorators: [
    (Story) => (
      <div
        style={{
          display: 'flex',
          padding: 'var(--perron-space-300)',
          background: 'var(--perron-color-surface-raised)',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Brand>

export default meta

type Story = StoryObj<typeof meta>
/** The args a story renders with: the meta's and its own. */
type StoryArgs = Parameters<NonNullable<Story['render']>>[0]

/** The one `.pn-Brand` root a story renders. */
const rootOf = (canvasElement: HTMLElement) => {
  const root = canvasElement.querySelector<HTMLElement>('.pn-Brand')
  if (!root) throw new Error('no .pn-Brand root rendered')
  return root
}

/**
 * Tab focuses the link, a box at least size.target-min tall (and, with `wide`, wide), and
 * Shift+Tab moves focus back to where it started.
 */
async function expectLinkTarget(link: HTMLElement, { wide = false } = {}) {
  const start = document.activeElement
  await userEvent.tab()
  await expect(link).toHaveFocus()
  const box = link.getBoundingClientRect()
  const targetMin = resolveBlockSize('var(--perron-size-target-min)')
  await expect(box.height).toBeGreaterThanOrEqual(targetMin)
  if (wide) await expect(box.width).toBeGreaterThanOrEqual(targetMin)
  await userEvent.tab({ shift: true })
  await expect(link).not.toHaveFocus()
  await expect(document.activeElement).toBe(start)
}

/** A value as it renders, through a probe that reads it as a block size. */
function resolveBlockSize(value: string) {
  const probe = document.createElement('span')
  probe.style.display = 'block'
  probe.style.blockSize = value
  document.body.append(probe)
  const rendered = probe.getBoundingClientRect().height
  probe.remove()
  return rendered
}

const defaultRef = createRef<HTMLSpanElement>()

/** The mark beside the wordmark "mylder". */
const full = {
  args: { variant: 'full' },
  play: async ({ canvasElement }) => {
    const root = rootOf(canvasElement)
    await expect(root).toHaveAttribute('data-variant', 'full')
    await expect(root).toHaveTextContent(/^Mylder$/)
    const mark = root.querySelector('.pn-Brand-mark')
    await expect(mark).toHaveAttribute('aria-hidden', 'true')
    await expect(mark).toHaveAttribute('focusable', 'false')
    await expect(mark?.querySelector('title')).toBeNull()
    // nothing in the lockup takes focus: Tab passes it by
    const start = document.activeElement
    await userEvent.tab()
    await expect(root).not.toHaveFocus()
    await expect(root.contains(document.activeElement)).toBe(false)
    await userEvent.tab({ shift: true })
    await expect(document.activeElement).toBe(start)
  },
} satisfies Story

/** The mark alone, with the brand name read to screen readers. */
const markStory = {
  args: { variant: 'mark' },
  play: async ({ canvasElement }) => {
    const root = rootOf(canvasElement)
    await expect(root).toHaveAttribute('data-variant', 'mark')
    await expect(root.querySelector('.pn-Brand-wordmark')).toBeNull()
    // the label: the VisuallyHidden shared part after the mark, kept for screen readers in a 1px clipped box
    const label = root.lastElementChild as HTMLElement
    await expect(label.tagName).toBe('SPAN')
    await expect(label).toHaveTextContent(/^Mylder$/)
    await expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(1)
    await expect(getComputedStyle(label).position).toBe('absolute')
    await expect(root).toHaveTextContent(/^Mylder$/)
    await expect(root.querySelector('.pn-Brand-mark')).toHaveAttribute('aria-hidden', 'true')
  },
} satisfies Story

/** Rendered as a link to the start screen: the brand name is the link's name, one tab stop. */
const linkStory = {
  args: { variant: 'full', render: <a href="/" /> },
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', { name: /^mylder$/i })
    await expect(link).toHaveClass('pn-Brand')
    await expect(link).toHaveAttribute('href', '/')
    await expectLinkTarget(link)
  },
} satisfies Story

/** The mark alone as a link: the hidden brand name is the link's only name. */
const markLink = {
  args: { variant: 'mark', render: <a href="/" /> },
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', { name: /^mylder$/i })
    await expect(link).toHaveClass('pn-Brand')
    await expect(link).toHaveAttribute('data-variant', 'mark')
    await expect(link.querySelector('.pn-Brand-wordmark')).toBeNull()
    await expectLinkTarget(link, { wide: true })
  },
} satisfies Story

/** The default props, as the docs page and the contract story show Brand. */
export const Default: Story = {
  render: (args) => <Brand {...args} ref={defaultRef} />,
  play: async ({ canvasElement }) => {
    const root = rootOf(canvasElement)
    await expect(root.tagName).toBe('SPAN')
    await expect(root).toHaveAttribute('data-variant', 'full')
    await expect(root).toHaveTextContent(/^Mylder$/)
    await expect(defaultRef.current).toBe(root)
  },
}

/** Each variant: the mark beside the wordmark, and the mark alone. */
export const Variants: Story = {
  ...showcase<StoryArgs>(
    [
      { label: 'Full', story: full },
      { label: 'Mark', story: markStory },
    ],
    (args) => <Brand {...args} />,
  ),
}

/** Each variant as a link to the start screen. */
export const Links: Story = {
  ...showcase<StoryArgs>(
    [
      { label: 'Full', story: linkStory },
      { label: 'Mark', story: markLink },
    ],
    (args) => <Brand {...args} />,
  ),
}

/** `brandNameLabel` in both variants: seen lowercase in the wordmark, heard alone with the mark. */
export const BrandNameLabel: Story = {
  args: { brandNameLabel: 'Perron', render: <a href="/" /> },
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--perron-space-300)' }}>
      <Brand {...args} variant="full" />
      <Brand {...args} variant="mark" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const links = canvas.getAllByRole('link', { name: /^perron$/i })
    await expect(links).toHaveLength(2)
    const [full, mark] = links
    await expect(canvas.queryByRole('link', { name: /mylder/i })).toBeNull()
    const wordmark = full.querySelector<HTMLElement>('.pn-Brand-wordmark')
    await expect(wordmark).toHaveTextContent(/^Perron$/)
    await expect(getComputedStyle(wordmark!).textTransform).toBe('lowercase')
    await expect(mark).toHaveAttribute('data-variant', 'mark')
    await expect(mark).toHaveTextContent(/^Perron$/)
  },
}
