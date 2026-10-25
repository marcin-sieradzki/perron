// Delay's stories, one per kind the deferred design will draw, each with a play test that reads the
// accessibility tree: the kind, the visible figure and what a screen reader hears.
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import { dictionaries, type Locale } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { heard } from '../../testing/stories.ts'
import { Delay } from './Delay.tsx'

const meta = {
  title: 'Components/Delay',
  component: Delay,
  args: { minutes: 0 },
} satisfies Meta<typeof Delay>

export default meta
type Story = StoryObj<typeof meta>

/** The root Delay rendered inside `canvas`. */
const rootIn = (canvas: HTMLElement) => canvas.querySelector<HTMLElement>('.pn-Delay')!

/** What the eye reads: the figure and its unit, as a copy of them reads. */
function seen(root: HTMLElement) {
  const parts = root.querySelectorAll('.pn-Delay-value, .pn-Delay-unit')
  return [...parts].map((part) => part.textContent).join(' ')
}

/** A Delay rendered apart from the story, as its root element. */
function renderApart(element: ReactElement) {
  const holder = document.createElement('div')
  holder.innerHTML = renderToStaticMarkup(element)
  return rootIn(holder)
}

/** Every word each locale's render of `minutes` shows or announces is the dictionary's. */
function expectOwnedInEveryLocale(minutes: number | null) {
  for (const locale of Object.keys(dictionaries) as Locale[])
    expectOwnedStrings(
      renderToStaticMarkup(
        <PerronProvider locale={locale}>
          <Delay minutes={minutes} />
        </PerronProvider>,
      ),
      locale,
    )
}

/** On time: "On time" in the on-time colour, read as shown. */
export const OnTime: Story = {
  args: { minutes: 0 },
  play: async ({ canvasElement }) => {
    const root = rootIn(canvasElement)
    await expect(root).toHaveAttribute('data-delay', 'on-time')
    await expect(seen(root)).toBe('On time')
    await expect(heard(root)).toBe('On time')
    await expect(root.querySelector('[aria-hidden]')).toBeNull()
    await expect(root.children).toHaveLength(1)
    const rounded = renderApart(<Delay minutes={0.4} />)
    await expect(rounded.outerHTML).toBe(renderApart(<Delay minutes={0} />).outerHTML)
    await expect(renderApart(<Delay minutes={-0.4} />)).toHaveAttribute('data-delay', 'on-time')
    expectOwnedInEveryLocale(0)
  },
}

/** Slightly late: "+2 min", heard as "2 min late". */
export const Slight: Story = {
  args: { minutes: 2 },
  play: async ({ canvasElement }) => {
    const root = rootIn(canvasElement)
    await expect(root).toHaveAttribute('data-delay', 'slight')
    await expect(seen(root)).toBe('+2 min')
    await expect(root.querySelector('.pn-Delay-value')).toHaveAttribute('aria-hidden', 'true')
    await expect(root.querySelector('.pn-Delay-unit')).toHaveAttribute('aria-hidden', 'true')
    await expect(heard(root)).toBe('2 min late')
    await expect(renderApart(<Delay minutes={1} />)).toHaveAttribute('data-delay', 'slight')
    expectOwnedInEveryLocale(2)
  },
}

/** Late: "+7 min", heard as "7 min late". */
export const Late: Story = {
  args: { minutes: 7 },
  play: async ({ canvasElement }) => {
    const root = rootIn(canvasElement)
    await expect(root).toHaveAttribute('data-delay', 'late')
    await expect(seen(root)).toBe('+7 min')
    await expect(heard(root)).toBe('7 min late')
    const rounded = renderApart(<Delay minutes={2.6} />)
    await expect(rounded).toHaveAttribute('data-delay', 'late')
    await expect(seen(rounded)).toBe('+3 min')
    await expect(heard(rounded)).toBe('3 min late')
    const overridden = renderApart(<Delay minutes={7} minutesLateLabel="min behind" />)
    await expect(heard(overridden)).toBe('7 min behind')
    expectOwnedInEveryLocale(7)
  },
}

/** Early: "−1 min" with the true minus sign, heard as "1 min early". */
export const Early: Story = {
  args: { minutes: -1 },
  play: async ({ canvasElement }) => {
    const root = rootIn(canvasElement)
    await expect(root).toHaveAttribute('data-delay', 'early')
    await expect(seen(root)).toBe('−1 min')
    await expect(seen(root).startsWith('−')).toBe(true)
    await expect(heard(root)).toBe('1 min early')
    const far = renderApart(<Delay minutes={-12} />)
    await expect(far).toHaveAttribute('data-delay', 'early')
    await expect(heard(far)).toBe('12 min early')
    expectOwnedInEveryLocale(-1)
  },
}

/** Unknown: "—" in the unknown colour, heard as "Delay unknown". */
export const Unknown: Story = {
  args: { minutes: null },
  play: async ({ canvasElement }) => {
    const root = rootIn(canvasElement)
    await expect(root).toHaveAttribute('data-delay', 'unknown')
    await expect(seen(root)).toBe('—')
    await expect(root.querySelector('.pn-Delay-value')).toHaveAttribute('aria-hidden', 'true')
    await expect(root.querySelector('.pn-Delay-unit')).toBeNull()
    await expect(heard(root)).toBe('Delay unknown')
    const markup = renderApart(<Delay minutes={null} />).outerHTML
    await expect(renderApart(<Delay minutes={NaN} />).outerHTML).toBe(markup)
    await expect(renderApart(<Delay minutes={Infinity} />).outerHTML).toBe(markup)
    expectOwnedInEveryLocale(null)
  },
}
