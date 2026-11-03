// Count's stories: the count alone with every prop a control, then each intent side by side.
import { createRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { showcase } from '../../testing/Showcase.tsx'
import { expect, fn, userEvent } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import { dictionaries, type Locale } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { heard } from '../../testing/stories.ts'
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
/** The args a story renders with: the meta's and its own. */
type StoryArgs = Parameters<NonNullable<Story['render']>>[0]

/** The root Count rendered inside `canvas`. */
const rootIn = (canvas: HTMLElement) => canvas.querySelector<HTMLElement>('.pn-Count')!

/**
 * A story's render: the caller's words, then the pill, so the tint is never the only sign (CR-9)
 * and the dash of an unknown count sits next to stronger text. The args stay Count's alone, so
 * the subject story still renders the subject alone.
 */
const afterWords =
  (words: string): Story['render'] =>
  (args) => (
    <>
      {words} <Count {...args} />
    </>
  )

/** The ref the Neutral story hands Count, to prove it reaches the root. */
const neutralRef = createRef<HTMLSpanElement>()

/** The subject story: a count of bad news, "Delays 3" on the danger tint. */
const danger = {
  args: { color: 'danger', children: 3 },
  render: afterWords('Delays'),
  play: async ({ canvasElement }) => {
    await expect(rootIn(canvasElement)).toHaveAttribute('data-color', 'danger')
  },
} satisfies Story

/** A count of diversions, which the foundations give the info intent: "Diversions 2". */
const info = {
  args: { color: 'info', children: 2 },
  render: afterWords('Diversions'),
} satisfies Story

/** The default intent, a plain tally: "12" on the inset surface. */
const neutral = {
  args: { color: 'neutral', children: '12', onClick: fn() },
  render: (args) => <Count {...args} ref={neutralRef} />,
  play: async ({ args, canvasElement }) => {
    const root = rootIn(canvasElement)
    await expect(root.tagName).toBe('SPAN')
    await expect(root).toHaveClass('pn-Count')
    await expect(root).toHaveAttribute('data-color', 'neutral')
    await expect(root).not.toHaveAttribute('data-unknown')
    await expect(neutralRef.current).toBe(root)
    const style = getComputedStyle(root)
    await expect(style.fontVariantNumeric).toBe('tabular-nums')
    await expect(style.whiteSpace).toBe('nowrap')
    // CR-8: the caller's handler reaches the root and fires
    await userEvent.click(root)
    await expect(args.onClick).toHaveBeenCalledOnce()
    // CR-8: nothing in it takes focus
    await userEvent.tab()
    await expect(root.contains(document.activeElement)).toBe(false)
    await userEvent.tab({ shift: true })
  },
} satisfies Story

/** `0` is a count, and shows (CR-4): "Delays 0", the good news of a line running normally. */
const success = {
  args: { color: 'success', children: 0 },
  render: afterWords('Delays'),
  play: async ({ canvasElement }) => {
    const root = rootIn(canvasElement)
    await expect(root).toHaveTextContent(/^0$/)
    await expect(root).not.toHaveAttribute('data-unknown')
  },
} satisfies Story

/**
 * A count of vehicles whose reports are ageing, a partial live picture, which the foundations give
 * the warning intent: "Ageing 5". A single digit sits in a circle, the min-width matching the height.
 */
const warning = {
  args: { color: 'warning', children: 5 },
  render: afterWords('Ageing'),
  play: async ({ canvasElement }) => {
    const { width, height } = rootIn(canvasElement).getBoundingClientRect()
    await expect(Math.abs(width - height)).toBeLessThan(1)
  },
} satisfies Story

/** The count alone, every prop a control. */
export const Default: Story = {
  ...danger,
  play: async (context) => {
    await danger.play(context)
  },
}

/** Each intent, side by side. */
export const Intents: Story = {
  ...showcase<StoryArgs>(
    [
      { label: 'Neutral', story: neutral },
      { label: 'Info', story: info },
      { label: 'Success', story: success },
      { label: 'Warning', story: warning },
      { label: 'Danger', story: danger },
    ],
    (args) => <Count {...args} />,
  ),
}

/** No count: "—", heard as "Unknown", untinted (CR-4 to CR-6). */
export const Unknown: Story = {
  args: { color: 'neutral' },
  render: afterWords('Delays'),
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
