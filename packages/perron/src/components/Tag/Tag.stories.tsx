// Tag's stories: one per variant of the deferred design, every `variant` with every `color`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, getRoles, waitFor, within } from 'storybook/test'
import { mounted } from '../../testing/stories.ts'
import { Tag } from './Tag.tsx'
import type { TagProps } from './Tag.tsx'

const meta = {
  title: 'Components/Tag',
  component: Tag,
  // every required prop and caller word, so any story renders alone
  args: { variant: 'filled', color: 'neutral', children: 'Night bus' },
} satisfies Meta<typeof Tag>

export default meta

type Story = StoryObj<typeof meta>

/** The tag in the canvas: the one `.pn-Tag` element. */
const tagIn = (canvasElement: HTMLElement) => {
  const tag = canvasElement.querySelector<HTMLElement>('.pn-Tag')
  if (!tag) throw new Error('no .pn-Tag in the canvas')
  return tag
}

/** Renders `props` into a host appended to `parent`, waits for the tag, and hands it to `test`. */
async function withTag(
  parent: HTMLElement,
  props: TagProps,
  test: (tag: HTMLElement) => Promise<void>,
) {
  await mounted(parent, <Tag {...props} />, async (host) => test(await waitFor(() => tagIn(host))))
}

/**
 * The steps every story shares: the root's data attributes; in the accessibility tree a generic
 * `<span>` with no role and no name, and nothing in it focusable (Keyboard and ARIA); and, where
 * given, its text.
 */
const carries =
  (variant: TagProps['variant'], color: TagProps['color'], text?: string): Story['play'] =>
  async ({ canvasElement, step }) => {
    const tag = tagIn(canvasElement)
    await step(`data-variant is ${variant} and data-color is ${color}`, async () => {
      await expect(tag).toHaveAttribute('data-variant', variant)
      await expect(tag).toHaveAttribute('data-color', color)
    })
    await step(
      'the root has no role and no name, and nothing in it is focusable (CR-7)',
      async () => {
        await expect(tag.tagName).toBe('SPAN')
        await expect(tag).not.toHaveAttribute('role')
        // no role query finds the tag, except as the generic container a <span> is
        const roles = Object.entries(getRoles(canvasElement))
          .filter(([, elements]) => elements.includes(tag))
          .map(([role]) => role)
        await expect(roles.filter((role) => role !== 'generic')).toEqual([])
        // its words are read in place, as the row's text, not as a name of its own
        await expect(tag).not.toHaveAccessibleName()
        await expect(tag).not.toHaveAttribute('tabindex')
        await expect(
          tag.querySelector('a[href], button, input, select, textarea, [tabindex]'),
        ).toBeNull()
        tag.focus()
        await expect(tag).not.toHaveFocus()
      },
    )
    if (text)
      await step(`the text is "${text}"`, async () => {
        await expect(within(canvasElement).getByText(text)).toBe(tag)
        await expect(tag.textContent).toBe(text)
      })
  }

/** `variant='filled'`, `color='neutral'`, the defaults: "Night bus". */
export const FilledNeutral: Story = {
  args: { variant: 'filled', color: 'neutral', children: 'Night bus' },
  play: async (context) => {
    const { canvasElement, step } = context
    await carries('filled', 'neutral', 'Night bus')!(context)
    const tag = tagIn(canvasElement)
    await step(
      'the DOM keeps the sentence case, and the capitals are text-transform (CR-8)',
      async () => {
        await expect(tag.textContent).toBe('Night bus')
        await expect(getComputedStyle(tag).textTransform).toBe('uppercase')
      },
    )
    await step('children as an element and as a list render inside the one root', async () => {
      await withTag(
        canvasElement,
        { children: <time dateTime="23:40">From 23:40</time> },
        async (t) => {
          await expect(t.querySelector('time')).toHaveTextContent('From 23:40')
          await expect(t.children).toHaveLength(1)
        },
      )
      await withTag(
        canvasElement,
        {
          children: [
            'Until ',
            <time key="t" dateTime="05:00">
              05:00
            </time>,
          ],
        },
        async (t) => {
          await expect(t.textContent).toBe('Until 05:00')
          await expect(t.querySelector('time')).toHaveTextContent('05:00')
        },
      )
    })
    await step(
      'in a canvas a few characters wide, the tag wraps and stays inside (CR-6)',
      async () => {
        const atRest = tag.getBoundingClientRect().height
        const width = canvasElement.style.inlineSize
        canvasElement.style.inlineSize = '5ch'
        try {
          // it wraps onto more than one line: its box is taller than at rest
          await waitFor(() => expect(tag.getBoundingClientRect().height).toBeGreaterThan(atRest))
          const box = tag.getBoundingClientRect()
          const canvas = canvasElement.getBoundingClientRect()
          await expect(box.left).toBeGreaterThanOrEqual(canvas.left - 0.5)
          await expect(box.right).toBeLessThanOrEqual(canvas.right + 0.5)
          await expect(getComputedStyle(tag).whiteSpace).not.toBe('nowrap')
          await expect(getComputedStyle(tag).textOverflow).not.toBe('ellipsis')
        } finally {
          canvasElement.style.inlineSize = width
        }
        await waitFor(() => expect(tag.getBoundingClientRect().height).toBe(atRest))
      },
    )
    await step(
      'in a 320 px flex row beside a long text, the tag keeps "Night" whole (CR-6)',
      async () => {
        const row = document.createElement('div')
        row.style.cssText = 'display: flex; gap: var(--perron-space-200); inline-size: 320px'
        const text = document.createElement('span')
        text.textContent = 'Nørreport St. via Rådhuspladsen, Hovedbanegården og Enghave Plads'
        row.append(text)
        canvasElement.append(row)
        try {
          await withTag(row, { children: 'Night bus' }, async (t) => {
            // the first word's own width, measured on the tag's text node
            const word = document.createRange()
            word.setStart(t.firstChild!, 0)
            word.setEnd(t.firstChild!, 'Night'.length)
            const style = getComputedStyle(t)
            const content =
              t.getBoundingClientRect().width -
              parseFloat(style.paddingInlineStart) -
              parseFloat(style.paddingInlineEnd) -
              parseFloat(style.borderInlineStartWidth) -
              parseFloat(style.borderInlineEndWidth)
            await expect(content).toBeGreaterThanOrEqual(word.getBoundingClientRect().width - 0.5)
            await expect(word.getClientRects()).toHaveLength(1)
          })
        } finally {
          row.remove()
        }
      },
    )
  },
}

/** `variant='filled'`, `color='success'`: "Step-free". */
export const FilledSuccess: Story = {
  args: { variant: 'filled', color: 'success', children: 'Step-free' },
  play: carries('filled', 'success', 'Step-free'),
}

/** `variant='filled'`, `color='warning'`: "Replacement bus". */
export const FilledWarning: Story = {
  args: { variant: 'filled', color: 'warning', children: 'Replacement bus' },
  play: carries('filled', 'warning', 'Replacement bus'),
}

/** `variant='filled'`, `color='danger'`: "Cancelled". */
export const FilledDanger: Story = {
  args: { variant: 'filled', color: 'danger', children: 'Cancelled' },
  play: carries('filled', 'danger', 'Cancelled'),
}

/** `variant='filled'`, `color='info'`: "Extra departure". */
export const FilledInfo: Story = {
  args: { variant: 'filled', color: 'info', children: 'Extra departure' },
  play: carries('filled', 'info', 'Extra departure'),
}

/** `variant='dashed'`, `color='neutral'`: "Night bus planned". */
export const DashedNeutral: Story = {
  args: { variant: 'dashed', color: 'neutral', children: 'Night bus planned' },
  play: async (context) => {
    const { canvasElement, step } = context
    await carries('dashed', 'neutral', 'Night bus planned')!(context)
    const tag = tagIn(canvasElement)
    await step(
      'the edge is a dashed border.width.025 hairline, as filled draws (CR-4)',
      async () => {
        // the token as the browser resolves it on an edge, so a rem or fractional token compares
        const probe = document.createElement('div')
        probe.style.borderTop = 'var(--perron-border-width-025) solid'
        canvasElement.append(probe)
        const hairline = getComputedStyle(probe).borderTopWidth
        probe.remove()
        const dashed = getComputedStyle(tag)
        await expect(dashed.borderTopStyle).toBe('dashed')
        await expect(dashed.borderTopWidth).toBe(hairline)
        await withTag(
          canvasElement,
          { variant: 'filled', children: 'Night bus planned' },
          async (filled) => {
            const solid = getComputedStyle(filled)
            await expect(solid.borderTopStyle).toBe('solid')
            await expect(solid.borderTopWidth).toBe(hairline)
            // the same words in either variant make the same box
            await expect(filled.offsetWidth).toBe(tag.offsetWidth)
            await expect(filled.offsetHeight).toBe(tag.offsetHeight)
          },
        )
      },
    )
  },
}

/** `variant='dashed'`, `color='success'`: "Step-free expected". */
export const DashedSuccess: Story = {
  args: { variant: 'dashed', color: 'success', children: 'Step-free expected' },
  play: carries('dashed', 'success', 'Step-free expected'),
}

/** `variant='dashed'`, `color='warning'`: "Replacement bus planned". */
export const DashedWarning: Story = {
  args: { variant: 'dashed', color: 'warning', children: 'Replacement bus planned' },
  play: carries('dashed', 'warning', 'Replacement bus planned'),
}

/** `variant='dashed'`, `color='danger'`: "Cancellation expected". */
export const DashedDanger: Story = {
  args: { variant: 'dashed', color: 'danger', children: 'Cancellation expected' },
  play: carries('dashed', 'danger', 'Cancellation expected'),
}

/** `variant='dashed'`, `color='info'`: "Extra departure planned". */
export const DashedInfo: Story = {
  args: { variant: 'dashed', color: 'info', children: 'Extra departure planned' },
  play: carries('dashed', 'info', 'Extra departure planned'),
}
