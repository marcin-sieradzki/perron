// FactList's stories: one per row of the spec's Stories table (docs/components/fact-list.md), with
// the design deferred, and their play tests, which read what the eye sees and what the ear hears.
import { createRef } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import { dictionaries, type Locale } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { heard } from '../../testing/stories.ts'
import { FactList, type FactListItem } from './FactList.tsx'

/** Four facts about a bus, every one known. */
const BUS: ReadonlyArray<FactListItem> = [
  { label: 'Operator', value: 'Movia' },
  { label: 'Vehicle', value: '8412' },
  { label: 'Speed', value: '32 km/h' },
  { label: 'Last report', value: '08:14' },
]

/** Three facts about a bus, its speed unknown. */
const BUS_UNKNOWN_SPEED: ReadonlyArray<FactListItem> = [
  { label: 'Operator', value: 'Movia' },
  { label: 'Speed' },
  { label: 'Last report', value: '08:14' },
]

export default {
  title: 'Components/FactList',
  component: FactList,
  args: { items: BUS },
} satisfies Meta<typeof FactList>

type Story = StoryObj<typeof FactList>

/** The root FactList rendered inside `canvas`. */
const rootIn = (canvas: HTMLElement) => canvas.querySelector<HTMLElement>('.pn-FactList')!

/** What the ear hears of each fact, part by part, in reading order. */
const heardInOrder = (root: HTMLElement) =>
  [...root.children].map((item) => [...item.children].map(heard))

/** Tab once, and expect focus to land nowhere inside `root`. */
async function expectNoFocus(root: HTMLElement) {
  await userEvent.tab()
  await expect(root.contains(document.activeElement)).toBe(false)
  await userEvent.tab({ shift: true })
}

/**
 * Render an empty FactList with a `ref` into the DOM beside `canvas`, and expect the `ref` and
 * `className` to land on its empty `dl` (CR-8).
 */
async function expectEmptyListTakesRef(canvas: HTMLElement) {
  const ref = createRef<HTMLDListElement>()
  const container = document.createElement('div')
  canvas.append(container)
  const root = createRoot(container)
  flushSync(() => root.render(<FactList items={[]} ref={ref} className="mine" />))
  const list = container.firstElementChild
  await expect(list?.tagName).toBe('DL')
  await expect(ref.current).toBe(list)
  await expect(list).toHaveClass('pn-FactList', 'mine')
  await expect(list?.childElementCount).toBe(0)
  root.unmount()
  container.remove()
}

/** Four facts about a bus, each a name and its value. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const root = rootIn(canvasElement)
    await expect(root.tagName).toBe('DL')
    const items = [...root.children]
    await expect(items).toHaveLength(4)
    for (const item of items) {
      await expect(item.tagName).toBe('DIV')
      await expect([...item.children].map((part) => part.tagName)).toEqual(['DT', 'DD'])
      await expect(item).not.toHaveAttribute('data-unknown')
    }
    await expect(heardInOrder(root)).toEqual([
      ['Operator', 'Movia'],
      ['Vehicle', '8412'],
      ['Speed', '32 km/h'],
      ['Last report', '08:14'],
    ])
    const value = root.querySelector('.pn-FactList-value')!
    await expect(getComputedStyle(value).fontVariantNumeric).toBe('tabular-nums')
    await expectNoFocus(root)
    await expectEmptyListTakesRef(canvasElement)
  },
}

/** The speed unknown: "—" beside "Speed", heard as "Unknown" (CR-4, CR-5). */
export const Unknown: Story = {
  args: { items: BUS_UNKNOWN_SPEED },
  play: async ({ canvasElement }) => {
    const root = rootIn(canvasElement)
    const [operator, speed, report] = [...root.children]
    await expect(speed).toHaveAttribute('data-unknown', '')
    await expect(speed.querySelector('.pn-FactList-value')).toHaveAttribute('data-unknown', '')
    for (const known of [operator, report]) {
      await expect(known).not.toHaveAttribute('data-unknown')
      await expect(known.querySelector('.pn-FactList-value')).not.toHaveAttribute('data-unknown')
    }
    const dash = speed.querySelector('.pn-FactList-value [aria-hidden="true"]')
    await expect(dash).toHaveTextContent('—')
    await expect(heardInOrder(root)[1]).toEqual(['Speed', 'Unknown'])
    await expectNoFocus(root)
    for (const locale of Object.keys(dictionaries) as Locale[])
      expectOwnedStrings(
        renderToStaticMarkup(
          <PerronProvider locale={locale}>
            <FactList items={BUS_UNKNOWN_SPEED} />
          </PerronProvider>,
        ),
        locale,
        ['Operator', 'Movia', 'Speed', 'Last report', '08:14'],
      )
  },
}
