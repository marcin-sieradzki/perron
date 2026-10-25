// Count's stories: one per row of the spec's Stories table (docs/components/count.md), with the
// design deferred, each the `color` value in PascalCase, and Unknown for the missing count.
import { createRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import { dictionaries, type Locale } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { Count } from './Count.tsx'

const meta = {
  title: 'Components/Count',
  component: Count,
  // No prop is required and a count holds no words, so the meta sets the default intent alone;
  // each story gives its own count
  args: { color: 'neutral' },
} satisfies Meta<typeof Count>

export default meta

type Story = StoryObj<typeof meta>

/** The root Count rendered inside `canvas`. */
const rootIn = (canvas: HTMLElement) => canvas.querySelector<HTMLElement>('.pn-Count')!

/** What a screen reader reads of `element`: its text outside `aria-hidden`. */
function heard(element: Element) {
  const copy = element.cloneNode(true) as HTMLElement
  for (const hidden of copy.querySelectorAll('[aria-hidden="true"]')) hidden.remove()
  return copy.textContent!.replace(/\s+/g, ' ').trim()
}

/**
 * A status story's render: the caller's words, then the pill, so the tint is never the only sign
 * (CR-9). The args stay Count's alone, so the subject story still renders the subject alone.
 */
const after =
  (words: string): Story['render'] =>
  (args) => (
    <>
      {words} <Count {...args} />
    </>
  )

/** The ref the Neutral story hands Count, to prove it reaches the root. */
const neutralRef = createRef<HTMLSpanElement>()

/** The subject story: a count of bad news, "Delays 3" on the danger tint. */
export const Danger: Story = {
  args: { color: 'danger', children: 3 },
  render: after('Delays'),
  play: async ({ canvasElement }) => {
    await expect(rootIn(canvasElement)).toHaveAttribute('data-color', 'danger')
  },
}

/** A count to know about: "Planned works 2" on the info tint. */
export const Info: Story = {
  args: { color: 'info', children: 2 },
  render: after('Planned works'),
}

/** The default intent, a plain tally: "12" on the inset surface. */
export const Neutral: Story = {
  args: { color: 'neutral', children: '12' },
  render: (args) => <Count {...args} ref={neutralRef} />,
  play: async ({ canvasElement }) => {
    const root = rootIn(canvasElement)
    await expect(root.tagName).toBe('SPAN')
    await expect(root).toHaveClass('pn-Count')
    await expect(root).toHaveAttribute('data-color', 'neutral')
    await expect(root).not.toHaveAttribute('data-unknown')
    await expect(neutralRef.current).toBe(root)
    const style = getComputedStyle(root)
    await expect(style.fontVariantNumeric).toBe('tabular-nums')
    await expect(style.whiteSpace).toBe('nowrap')
    // CR-8: nothing in it takes focus
    await userEvent.tab()
    await expect(root.contains(document.activeElement)).toBe(false)
    await userEvent.tab({ shift: true })
  },
}

/** `0` is a count, and shows (CR-4): "Delays 0", the good news. */
export const Success: Story = {
  args: { color: 'success', children: 0 },
  render: after('Delays'),
  play: async ({ canvasElement }) => {
    const root = rootIn(canvasElement)
    await expect(root).toHaveTextContent(/^0$/)
    await expect(root).not.toHaveAttribute('data-unknown')
  },
}

/** A single digit sits in a circle, the min-width matching the height: "Diversions 5". */
export const Warning: Story = {
  args: { color: 'warning', children: 5 },
  render: after('Diversions'),
  play: async ({ canvasElement }) => {
    await document.fonts.ready
    const { width, height } = rootIn(canvasElement).getBoundingClientRect()
    await expect(Math.abs(width - height)).toBeLessThan(1)
  },
}

/** No count: "—", heard as "Unknown", untinted (CR-4 to CR-6). */
export const Unknown: Story = {
  args: { color: 'neutral' },
  play: async ({ canvasElement }) => {
    const root = rootIn(canvasElement)
    await expect(root).toHaveAttribute('data-unknown', '')
    const dash = root.querySelector('[aria-hidden="true"]')
    await expect(dash).toHaveTextContent(/^—$/)
    await expect(heard(root)).toBe('Unknown')
    for (const locale of Object.keys(dictionaries) as Locale[])
      expectOwnedStrings(
        renderToStaticMarkup(
          <PerronProvider locale={locale}>
            <Count />
          </PerronProvider>,
        ),
        locale,
      )
  },
}
