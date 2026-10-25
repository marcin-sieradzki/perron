// ScaleBar's stories: one per row of the spec's Stories table (docs/patterns/scale-bar.md), with the
// design deferred, each over a map-like backdrop that shows the glass, and their play tests, which
// read what the eye sees, the bar's length, and what the ear hears.
import type { CSSProperties } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import { dictionaries, type Locale } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { heard, mounted } from '../../testing/stories.ts'
import { ScaleBar } from './ScaleBar.tsx'

/** Land with a street running behind the scale, as the map it floats over, so the glass shows. */
const BACKDROP: CSSProperties = {
  background: [
    'linear-gradient(80deg, transparent 0 8%, var(--perron-color-map-street) 8% 14%, transparent 14%)',
    'var(--perron-color-map-land)',
  ].join(', '),
  padding: 'var(--perron-size-panel-gap)',
}

/** The map the scale floats over, `size.panel-gap` from its edges, as its screen places it. */
const overTheMap: Decorator = (Story) => (
  <div style={BACKDROP}>
    <Story />
  </div>
)

const meta = {
  title: 'Patterns/ScaleBar',
  component: ScaleBar,
  args: { metersPerPixel: 4.2 },
  decorators: [overTheMap],
} satisfies Meta<typeof ScaleBar>

export default meta

type Story = StoryObj<typeof meta>

/** The scale rendered inside `host`. */
const rootIn = (host: HTMLElement) => host.querySelector<HTMLElement>('.pn-ScaleBar')!

/** The scale's label inside `host`. */
const labelIn = (host: HTMLElement) => host.querySelector<HTMLElement>('.pn-ScaleBar-label')!

/** The scale's bar inside `host`, once the scale has measured its longest length (CR-4). */
const barIn = (host: HTMLElement) =>
  waitFor(() => {
    const bar = host.querySelector<HTMLElement>('.pn-ScaleBar-bar')
    expect(bar).not.toBeNull()
    return bar!
  })

/** The bar's drawn length as a share of the root's content box, its longest length. */
const shareOf = (root: HTMLElement, bar: HTMLElement) =>
  bar.getBoundingClientRect().width / parseFloat(getComputedStyle(root).inlineSize)

/** Every text node inside `element`, each as written. */
function texts(element: Element) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  const out: string[] = []
  while (walker.nextNode()) out.push(walker.currentNode.textContent!)
  return out
}

/**
 * Markup of each text node inside `element` in its own element, as a server render keeps
 * adjacent text apart, for `expectOwnedStrings`: the browser's own markup joins "300" and "m".
 */
const textMarkup = (element: Element) =>
  texts(element)
    .map((text) => `<i>${text.replaceAll('&', '&amp;').replaceAll('<', '&lt;')}</i>`)
    .join('')

/** Expects every word the measured scale at `metersPerPixel` shows to be its locale's, in every locale. */
async function expectMeasuredOwnedStrings(parent: HTMLElement, metersPerPixel: number) {
  for (const locale of Object.keys(dictionaries) as Locale[])
    await mounted(
      parent,
      <PerronProvider locale={locale}>
        <ScaleBar metersPerPixel={metersPerPixel} />
      </PerronProvider>,
      async (host) => {
        await barIn(host)
        expectOwnedStrings(textMarkup(host), locale)
      },
    )
}

/** Tab once, and expect focus to land nowhere inside `root`, then go back. */
async function expectNoFocus(root: HTMLElement) {
  await userEvent.tab()
  await expect(root.contains(document.activeElement)).toBe(false)
  await userEvent.tab({ shift: true })
}

/** A city street at close zoom: "300 m" over a bar about three quarters long; the contract story renders it. */
export const Default: Story = {
  args: { metersPerPixel: 4.2 },
  play: async ({ canvasElement }) => {
    const root = rootIn(canvasElement)
    const bar = await barIn(canvasElement)
    await expect(heard(labelIn(canvasElement))).toBe('Scale 300 m')
    await expect(bar).toHaveAttribute('aria-hidden', 'true')
    // 300 of the longest 403.2 m: narrower than the content box, more than half of it
    const share = shareOf(root, bar)
    await expect(share).toBeGreaterThan(0.5)
    await expect(share).toBeLessThan(1)
    await expect(root.className).toBe('pn-Surface pn-ScaleBar')
    await expect(root).toHaveAttribute('data-variant', 'glass')
    // the label over the bar, in the DOM and on screen
    await expect([...root.children]).toEqual([labelIn(canvasElement), bar])
    await expect(bar.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      labelIn(canvasElement).getBoundingClientRect().bottom,
    )
    // CR-9: no live region
    await expect(root.querySelector('[aria-live], [role="status"], [role="alert"]')).toBeNull()
    await expectNoFocus(root)
    // "m" is a word a server render, which has no length yet, doesn't show
    await expectMeasuredOwnedStrings(canvasElement, 4.2)
  },
}

/** The whole city: "3 km". */
export const Kilometres: Story = {
  args: { metersPerPixel: 40 },
  play: async ({ canvasElement }) => {
    await barIn(canvasElement)
    const label = labelIn(canvasElement)
    await expect(heard(label)).toBe('Scale 3 km')
    await expect(texts(label)).not.toContain('m')
    await expect(texts(label)).toContain('km')
    await expectMeasuredOwnedStrings(canvasElement, 40)
  },
}

/** A longest distance just under 2 km: "1 km" over the shortest bar, half the longest. */
export const HalfLength: Story = {
  args: { metersPerPixel: 20.82 },
  play: async ({ canvasElement }) => {
    const bar = await barIn(canvasElement)
    await expect(heard(labelIn(canvasElement))).toBe('Scale 1 km')
    const share = shareOf(rootIn(canvasElement), bar)
    await expect(share).toBeGreaterThanOrEqual(0.5)
    await expect(share).toBeLessThan(0.6)
  },
}

/** A map that has not given its resolution yet: "—", heard as "Unknown", and no bar. */
export const Unknown: Story = {
  args: { metersPerPixel: NaN },
  play: async ({ canvasElement }) => {
    const label = labelIn(canvasElement)
    const dash = label.querySelector('[aria-hidden="true"]')
    await expect(dash).toHaveTextContent(/^—$/)
    await expect(heard(label)).toBe('Scale Unknown')
    await expect(canvasElement.querySelector('.pn-ScaleBar-bar')).toBeNull()
    // the label keeps one line's height, as with a distance
    await expect(label.getBoundingClientRect().height).toBeGreaterThan(0)
    // "Unknown" is a word the Default render doesn't show: in every locale, it is the dictionary's
    for (const locale of Object.keys(dictionaries) as Locale[])
      expectOwnedStrings(
        renderToStaticMarkup(
          <PerronProvider locale={locale}>
            <ScaleBar metersPerPixel={NaN} />
          </PerronProvider>,
        ),
        locale,
      )
  },
}

/** `Default`'s distance with "Scale" and "m" overridden. */
export const Labels: Story = {
  args: { metersPerPixel: 4.2, scaleLabel: 'Målestok', metersUnitLabel: 'meter' },
  play: async ({ canvasElement }) => {
    await barIn(canvasElement)
    const label = labelIn(canvasElement)
    await expect(heard(label)).toBe('Målestok 300 meter')
    await expect(label).not.toHaveTextContent(/Scale/)
    await expect(texts(label)).not.toContain('m')
  },
}
