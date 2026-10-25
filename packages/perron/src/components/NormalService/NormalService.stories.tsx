import { renderToStaticMarkup } from 'react-dom/server'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, getRoles, isInaccessible, within } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import { dictionaries } from '../../locale/index.ts'
import type { Locale } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { NormalService } from './NormalService.tsx'

const meta = {
  title: 'Components/NormalService',
  component: NormalService,
  args: {},
} satisfies Meta<typeof NormalService>

export default meta

type Story = StoryObj<typeof meta>

/** The text under `node` that the accessibility tree exposes: its text, less every hidden subtree. */
const exposedText = (node: Node): string =>
  node instanceof Element && isInaccessible(node)
    ? ''
    : node.nodeType === Node.TEXT_NODE
      ? (node.textContent ?? '')
      : Array.from(node.childNodes, exposedText).join('')

/** The `check-circle` icon and "Running normally" in `color.text.success`, with no args. */
export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const word = dictionaries.en.runningNormally
    const label = within(canvasElement).getByText(word)
    const root = label.closest('span.pn-NormalService')
    await step('the root has pn-NormalService', async () => {
      await expect(root).not.toBeNull()
      await expect(root?.parentElement).toBe(canvasElement)
      await expect(label).toHaveClass('pn-NormalService-label')
    })
    await step(`the accessible text is "${word}"`, async () => {
      await expect(root?.textContent).toBe(word)
      await expect(label).toBeVisible()
      await expect(isInaccessible(label)).toBe(false)
      await expect(exposedText(root!)).toBe(word)
      // the CR-5 strut is generated content with empty alternative text, so it adds nothing
      await expect(getComputedStyle(root!, '::before').content).toBe('"​" / ""')
    })
    await step('the icon is aria-hidden', async () => {
      const icon = root!.querySelector('svg')!
      await expect(icon).toHaveClass('pn-NormalService-icon')
      await expect(icon).toHaveAttribute('aria-hidden', 'true')
      await expect(icon).toHaveAttribute('focusable', 'false')
      // out of the accessibility tree, with no role and no name, so no role query finds it
      await expect(isInaccessible(icon)).toBe(true)
      await expect(icon).not.toHaveAccessibleName()
      await expect(Object.values(getRoles(canvasElement)).flat()).not.toContain(icon)
    })
    await step('each locale shows its own words', () => {
      for (const locale of Object.keys(dictionaries) as Locale[]) {
        const markup = renderToStaticMarkup(
          <PerronProvider locale={locale}>
            <NormalService />
          </PerronProvider>,
        )
        expectOwnedStrings(markup, locale)
        expect(markup).toContain(`>${dictionaries[locale].runningNormally}</span>`)
      }
    })
  },
}
