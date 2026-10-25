// MapControls' stories: the bar in each orientation, at each zoom limit, disabled, and with its
// words overridden. The buttons' hover, focus and pressed looks are ToolbarButton's, storied on the
// Toolbar page; these render at rest, and their play tests check the behaviour.
import { renderToStaticMarkup } from 'react-dom/server'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import { dictionaries } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { mounted } from '../../testing/stories.ts'
import { MapControls } from './MapControls.tsx'

const onZoomIn = fn()
const onZoomOut = fn()
const onCenterMap = fn()

const meta = {
  title: 'Components/MapControls',
  component: MapControls,
  args: { onZoomIn, onZoomOut, onCenterMap },
  decorators: [
    (Story) => (
      <PerronProvider locale="en">
        <Story />
      </PerronProvider>
    ),
  ],
} satisfies Meta<typeof MapControls>

export default meta
type Story = StoryObj<typeof meta>

const clearHandlers = () => {
  onZoomIn.mockClear()
  onZoomOut.mockClear()
  onCenterMap.mockClear()
}

/** The three buttons of `canvas`, by their English names. */
const buttonsIn = (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  return {
    zoomIn: canvas.getByRole('button', { name: 'Zoom in' }),
    zoomOut: canvas.getByRole('button', { name: 'Zoom out' }),
    centerMap: canvas.getByRole('button', { name: 'Centre the map' }),
  }
}

/** Tab into the bar from the top of the page, whatever a story before left focused. */
const enter = async () => {
  ;(document.activeElement as HTMLElement | null)?.blur()
  await userEvent.tab()
}

/** Shift+Tab out of the bar: focus ends outside the canvas, at rest. */
const leave = async (canvasElement: HTMLElement) => {
  await userEvent.tab({ shift: true })
  await expect(canvasElement).not.toContainElement(document.activeElement as HTMLElement)
}

/** The vertical bar, the default: zoom in, zoom out, a separator, centre the map. */
export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    clearHandlers()
    const canvas = within(canvasElement)
    const { zoomIn, zoomOut, centerMap } = buttonsIn(canvasElement)
    await step('the bar and its buttons are named, and the icons hidden', async () => {
      const bar = canvas.getByRole('toolbar', { name: 'Map controls' })
      await expect(bar).toHaveAttribute('aria-orientation', 'vertical')
      await expect(bar).toHaveClass('pn-Toolbar', 'pn-MapControls')
      await expect(canvas.getAllByRole('button')).toEqual([zoomIn, zoomOut, centerMap])
      for (const button of [zoomIn, zoomOut, centerMap]) {
        await expect(button).toHaveClass('pn-ToolbarButton')
        await expect(button).not.toHaveAttribute('title')
        await expect(button.querySelector('svg')?.closest('[aria-hidden="true"]')).not.toBeNull()
      }
      await expect(canvas.getByRole('separator')).toHaveAttribute('aria-orientation', 'horizontal')
    })
    await step('Tab enters at zoom in; ArrowDown walks the bar and wraps', async () => {
      await enter()
      await expect(zoomIn).toHaveFocus()
      for (const next of [zoomOut, centerMap, zoomIn]) {
        await userEvent.keyboard('{ArrowDown}')
        await expect(next).toHaveFocus()
      }
      await userEvent.keyboard('{ArrowUp}')
      await expect(centerMap).toHaveFocus()
      await userEvent.keyboard('{ArrowDown}')
      await expect(zoomIn).toHaveFocus()
    })
    await step('Enter fires onZoomIn once, Space onCenterMap once', async () => {
      await userEvent.keyboard('{Enter}')
      await expect(onZoomIn).toHaveBeenCalledTimes(1)
      await userEvent.keyboard('{ArrowUp}')
      await expect(centerMap).toHaveFocus()
      await userEvent.keyboard(' ')
      await expect(onCenterMap).toHaveBeenCalledTimes(1)
      await expect(onZoomOut).not.toHaveBeenCalled()
    })
    await step('Shift+Tab leaves the bar in one step', () => leave(canvasElement))
  },
}

/** The bar laid along an edge: the same three buttons in a row. */
export const Horizontal: Story = {
  args: { orientation: 'horizontal' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const { zoomIn, zoomOut, centerMap } = buttonsIn(canvasElement)
    await expect(canvas.getByRole('toolbar')).toHaveAttribute('aria-orientation', 'horizontal')
    await expect(canvas.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical')
    await enter()
    await expect(zoomIn).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(zoomOut).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(zoomOut).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(centerMap).toHaveFocus()
    await userEvent.keyboard('{ArrowLeft}')
    await expect(zoomOut).toHaveFocus()
    await leave(canvasElement)
  },
}

/** At the map's closest zoom: zoom in is dimmed, and still reached by the keys. */
export const ZoomInDisabled: Story = {
  args: { zoomInDisabled: true },
  play: async ({ canvasElement }) => {
    clearHandlers()
    const { zoomIn, zoomOut, centerMap } = buttonsIn(canvasElement)
    await expect(zoomIn).toHaveAttribute('aria-disabled', 'true')
    await expect(zoomIn).toHaveAttribute('data-disabled')
    await expect(zoomOut).not.toHaveAttribute('data-disabled')
    await expect(centerMap).not.toHaveAttribute('data-disabled')
    await enter()
    await expect(zoomIn).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(onZoomIn).not.toHaveBeenCalled()
    await userEvent.keyboard('{ArrowDown}')
    await expect(zoomOut).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}')
    await expect(zoomIn).toHaveFocus()
    await userEvent.click(zoomIn)
    await expect(onZoomIn).not.toHaveBeenCalled()
    await userEvent.click(zoomOut)
    await expect(onZoomOut).toHaveBeenCalledTimes(1)
    await userEvent.click(centerMap)
    await expect(onCenterMap).toHaveBeenCalledTimes(1)
    await leave(canvasElement)
  },
}

/** At the map's farthest zoom: zoom out is dimmed. */
export const ZoomOutDisabled: Story = {
  args: { zoomOutDisabled: true },
  play: async ({ canvasElement }) => {
    clearHandlers()
    const { zoomIn, zoomOut } = buttonsIn(canvasElement)
    await expect(zoomOut).toHaveAttribute('aria-disabled', 'true')
    await expect(zoomIn).not.toHaveAttribute('data-disabled')
    await userEvent.click(zoomOut)
    await expect(onZoomOut).not.toHaveBeenCalled()
    await userEvent.click(zoomIn)
    await expect(onZoomIn).toHaveBeenCalledTimes(1)
    await leave(canvasElement)
  },
}

/** The whole bar disabled, such as while the map loads: every button dimmed, still reachable. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    clearHandlers()
    const { zoomIn, zoomOut, centerMap } = buttonsIn(canvasElement)
    for (const button of [zoomIn, zoomOut, centerMap])
      await expect(button).toHaveAttribute('data-disabled')
    await enter()
    await expect(zoomIn).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(zoomOut).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(centerMap).toHaveFocus()
    for (const button of [zoomIn, zoomOut, centerMap]) await userEvent.click(button)
    await expect(onZoomIn).not.toHaveBeenCalled()
    await expect(onZoomOut).not.toHaveBeenCalled()
    await expect(onCenterMap).not.toHaveBeenCalled()
    await leave(canvasElement)
  },
}

const custom = {
  mapControlsLabel: 'Network map controls',
  zoomInLabel: 'Zoom the map in',
  zoomOutLabel: 'Zoom the map out',
  centerMapLabel: 'Show the whole network',
}

/** Every word overridden by its `…Label` prop; in Danish with none, the Danish dictionary's. */
export const CustomLabels: Story = {
  args: custom,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    await step('the overrides name the bar and the buttons', async () => {
      await expect(canvas.getByRole('toolbar')).toHaveAccessibleName(custom.mapControlsLabel)
      await expect(canvas.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
        custom.zoomInLabel,
        custom.zoomOutLabel,
        custom.centerMapLabel,
      ])
      expectOwnedStrings(
        renderToStaticMarkup(
          <PerronProvider locale="da">
            <MapControls {...custom} />
          </PerronProvider>,
        ),
        'da',
        Object.values(custom),
      )
    })
    await step('in Danish with no overrides, the Danish dictionary names them', async () => {
      const da = dictionaries.da
      const ui = (
        <PerronProvider locale="da">
          <MapControls />
        </PerronProvider>
      )
      await mounted(canvasElement, ui, async (host) => {
        const bar = await waitFor(() => within(host).getByRole('toolbar'))
        await expect(bar).toHaveAccessibleName(da.mapControls)
        await expect(
          within(host)
            .getAllByRole('button')
            .map((b) => b.getAttribute('aria-label')),
        ).toEqual([da.zoomIn, da.zoomOut, da.centerMap])
        expectOwnedStrings(host.innerHTML, 'da')
      })
    })
  },
}
