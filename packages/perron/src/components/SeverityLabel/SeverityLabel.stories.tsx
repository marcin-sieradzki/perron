import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, getRoles, isInaccessible, waitFor, within } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import { dictionaries } from '../../locale/index.ts'
import type { Locale, OwnedStringKey } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { SeverityLabel } from './SeverityLabel.tsx'
import type { SeverityLabelProps, SeverityLabelSeverity } from './SeverityLabel.tsx'

const meta = {
  title: 'Components/SeverityLabel',
  component: SeverityLabel,
  args: { severity: 'delay' },
} satisfies Meta<typeof SeverityLabel>

export default meta

type Story = StoryObj<typeof meta>

/** The text under `node` that the accessibility tree exposes: its text, less every hidden subtree. */
const exposedText = (node: Node): string =>
  node instanceof Element && isInaccessible(node)
    ? ''
    : node.nodeType === Node.TEXT_NODE
      ? (node.textContent ?? '')
      : Array.from(node.childNodes, exposedText).join('')

/**
 * The play test every story shares: the root carries `data-severity`, its only text is the kind's
 * name, the icon is hidden from screen readers, and every locale shows its own word.
 */
const reads =
  (severity: SeverityLabelSeverity, key: OwnedStringKey): Story['play'] =>
  async ({ canvasElement, step }) => {
    const word = dictionaries.en[key]
    const label = within(canvasElement).getByText(word)
    const root = label.closest('.pn-SeverityLabel')
    await step(`data-severity is ${severity}`, async () => {
      await expect(root).toHaveAttribute('data-severity', severity)
    })
    await step(`the accessible text is "${word}"`, async () => {
      await expect(root?.textContent).toBe(word)
      await expect(label).toBeVisible()
      await expect(isInaccessible(label)).toBe(false)
      await expect(exposedText(root!)).toBe(word)
      // the CR-8 strut is generated content with empty alternative text, so it adds nothing
      await expect(getComputedStyle(root!, '::before').content).toBe('"​" / ""')
    })
    await step('the icon is aria-hidden', async () => {
      const icon = root!.querySelector('svg')!
      await expect(icon).toHaveAttribute('aria-hidden', 'true')
      await expect(icon).toHaveAttribute('focusable', 'false')
      // out of the accessibility tree, with no role and no name, so no role query finds it
      await expect(isInaccessible(icon)).toBe(true)
      await expect(icon).not.toHaveAccessibleName()
      await expect(Object.values(getRoles(canvasElement)).flat()).not.toContain(icon)
    })
    await step('each locale shows its own word for the kind', () => {
      for (const locale of Object.keys(dictionaries) as Locale[]) {
        const markup = renderToStaticMarkup(
          <PerronProvider locale={locale}>
            <SeverityLabel severity={severity} />
          </PerronProvider>,
        )
        expectOwnedStrings(markup, locale)
        expect(markup).toContain(`>${dictionaries[locale][key]}</span>`)
      }
    })
  }

/** `severity='data'`: the `signal-off` icon and "Data feed problems". */
export const Data: Story = {
  args: { severity: 'data' },
  play: reads('data', 'dataFeedProblems'),
}

/** `severity='delay'`: the `warning` icon and "Delays". */
export const Delay: Story = {
  args: { severity: 'delay' },
  play: async (context) => {
    await reads('delay', 'delays')!(context)
    await context.step('delaysLabel="Late trains" shows and reads "Late trains"', async () => {
      const props: SeverityLabelProps = { severity: 'delay', delaysLabel: 'Late trains' }
      const host = document.createElement('div')
      context.canvasElement.append(host)
      const root = createRoot(host)
      root.render(<SeverityLabel {...props} />)
      try {
        const label = await waitFor(() => within(host).getByText('Late trains'))
        await expect(label.closest('.pn-SeverityLabel')?.textContent).toBe('Late trains')
        await expect(within(host).queryByText('Delays')).toBeNull()
        expectOwnedStrings(
          renderToStaticMarkup(
            <PerronProvider locale="da">
              <SeverityLabel {...props} />
            </PerronProvider>,
          ),
          'da',
          ['Late trains'],
        )
      } finally {
        root.unmount()
        host.remove()
      }
    })
  },
}

/** `severity='diversion'`: the `diversion` icon and "Diversions". */
export const Diversion: Story = {
  args: { severity: 'diversion' },
  play: reads('diversion', 'diversions'),
}

/** `severity='planned'`: the `calendar` icon and "Planned works". */
export const Planned: Story = {
  args: { severity: 'planned' },
  play: reads('planned', 'plannedWorks'),
}
