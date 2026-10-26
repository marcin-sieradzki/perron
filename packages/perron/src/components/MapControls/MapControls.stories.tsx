// MapControls' stories: the bar in each orientation, at each zoom limit, disabled, with its pause
// button moving and paused, and with its words overridden. The buttons' hover, focus and pressed
// looks are ToolbarButton's, storied on the Toolbar page; these render at rest, and their play
// tests check the behaviour.
import { useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import { dictionaries } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { mounted } from '../../testing/stories.ts'
import pauseSvg from '../../../icons/pause.svg?raw'
import playSvg from '../../../icons/play.svg?raw'
import { MapControls, type MapControlsProps } from './MapControls.tsx'

const onZoomIn = fn()
const onZoomOut = fn()
const onCenterMap = fn()
const onPausedChange = fn()

/** The path an icon file draws, to tell which icon a button shows. */
const pathOf = (svg: string) => /\sd="([^"]+)"/.exec(svg)![1]
const PAUSE_PATH = pathOf(pauseSvg)
const PLAY_PATH = pathOf(playSvg)

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
  onPausedChange.mockClear()
}

/** The pause button of `canvas`, by its English name, with the path of the icon it shows. */
const pauseButton = (canvasElement: HTMLElement, name: 'Pause' | 'Resume') => {
  const button = within(canvasElement).getByRole('button', { name })
  return { button, path: button.querySelector('svg path')?.getAttribute('d') }
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

/** A bar with the pause button, mounted beside the story's own, in English. */
const pausableBar = (props: MapControlsProps) => (
  <PerronProvider locale="en">
    <MapControls {...props} onPausedChange={onPausedChange} />
  </PerronProvider>
)

/**
 * A zoom limit leaves the pause button enabled: mounted beside the story's bar at `limit`, it is
 * neither dimmed nor announced as dimmed, and a click fires `onPausedChange` once.
 */
const pauseEnabledAt = (
  canvasElement: HTMLElement,
  limit: Pick<MapControlsProps, 'zoomInDisabled' | 'zoomOutDisabled'>,
) =>
  mounted(canvasElement, pausableBar(limit), async (host) => {
    onPausedChange.mockClear()
    const pause = await waitFor(() => within(host).getByRole('button', { name: 'Pause' }))
    await expect(pause).not.toHaveAttribute('data-disabled')
    await expect(pause).not.toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(pause)
    await expect(onPausedChange).toHaveBeenCalledTimes(1)
  })

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
    // With the pause button, the row's arrows reach it too, and both separators stand upright.
    await mounted(canvasElement, pausableBar({ orientation: 'horizontal' }), async (host) => {
      const bar = await waitFor(() => within(host).getByRole('toolbar'))
      const [hostZoomIn, , hostCenterMap, pause] = within(bar).getAllByRole('button')
      await expect(pause).toHaveAccessibleName('Pause')
      for (const separator of within(bar).getAllByRole('separator'))
        await expect(separator).toHaveAttribute('aria-orientation', 'vertical')
      await expect(bar.querySelector('.pn-MapControls-pauseSeparator')).toHaveAttribute(
        'aria-orientation',
        'vertical',
      )
      hostZoomIn.focus()
      await userEvent.keyboard('{ArrowLeft}')
      await expect(pause).toHaveFocus()
      await userEvent.keyboard('{ArrowLeft}')
      await expect(hostCenterMap).toHaveFocus()
      await userEvent.keyboard('{ArrowRight}')
      await expect(pause).toHaveFocus()
      await userEvent.keyboard('{ArrowDown}')
      await expect(pause).toHaveFocus()
      await userEvent.keyboard('{ArrowRight}')
      await expect(hostZoomIn).toHaveFocus()
      hostZoomIn.blur()
    })
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
    await pauseEnabledAt(canvasElement, { zoomInDisabled: true })
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
    await pauseEnabledAt(canvasElement, { zoomOutDisabled: true })
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

/**
 * A screen that holds `paused` in its own `useState` and sets it from `onPausedChange`: the story's
 * spy stands for the screen's own handler.
 */
function PausableMap(args: MapControlsProps) {
  const [paused, setPaused] = useState(args.paused ?? false)
  return (
    <MapControls
      {...args}
      paused={paused}
      onPausedChange={(event, next) => {
        args.onPausedChange?.(event, next)
        setPaused(next)
      }}
    />
  )
}

/**
 * The bar with its pause button, while the map moves: zoom in, zoom out, a separator, centre the
 * map, a separator, pause. The screen holds `paused`, so each press swaps the button's icon and name.
 */
export const Pausable: Story = {
  args: { onPausedChange },
  render: (args) => <PausableMap {...args} />,
  play: async ({ canvasElement, step }) => {
    clearHandlers()
    const canvas = within(canvasElement)
    const { zoomIn, zoomOut, centerMap } = buttonsIn(canvasElement)
    const pause = pauseButton(canvasElement, 'Pause')
    await step(
      'one bar holds four buttons, the pause button last, past a second separator',
      async () => {
        await expect(canvas.getAllByRole('toolbar')).toHaveLength(1)
        await expect(canvas.getAllByRole('button')).toEqual([
          zoomIn,
          zoomOut,
          centerMap,
          pause.button,
        ])
        const separators = canvas.getAllByRole('separator')
        await expect(separators).toHaveLength(2)
        await expect(separators[1]).toHaveClass(
          'pn-ToolbarSeparator',
          'pn-MapControls-pauseSeparator',
        )
        await expect(separators[1].nextElementSibling).toBe(pause.button)
        await expect(pause.button).toHaveClass('pn-ToolbarButton', 'pn-MapControls-pause')
        await expect(pause.path).toBe(PAUSE_PATH)
        await expect(pause.button).not.toHaveAttribute('aria-pressed')
        await expect(pause.button).not.toHaveAttribute('data-pressed')
        await expect(
          pause.button.querySelector('svg')?.closest('[aria-hidden="true"]'),
        ).not.toBeNull()
      },
    )
    await step(
      'the bar is one tab stop, and the arrows reach the pause button and wrap',
      async () => {
        await enter()
        await expect(zoomIn).toHaveFocus()
        await userEvent.keyboard('{ArrowUp}')
        await expect(pause.button).toHaveFocus()
        await userEvent.keyboard('{ArrowDown}')
        await expect(zoomIn).toHaveFocus()
        for (const next of [zoomOut, centerMap, pause.button]) {
          await userEvent.keyboard('{ArrowDown}')
          await expect(next).toHaveFocus()
        }
      },
    )
    await step(
      'Enter asks for paused; the screen pauses, and the button becomes Resume, with focus kept',
      async () => {
        await userEvent.keyboard('{Enter}')
        await expect(onPausedChange).toHaveBeenCalledTimes(1)
        await expect(onPausedChange).toHaveBeenLastCalledWith(expect.anything(), true)
        const resume = pauseButton(canvasElement, 'Resume')
        await expect(resume.button).toBe(pause.button)
        await expect(resume.path).toBe(PLAY_PATH)
        await expect(resume.button).toHaveFocus()
        await expect(resume.button).not.toHaveAttribute('aria-pressed')
        await expect(resume.button).not.toHaveAttribute('data-pressed')
      },
    )
    await step('Space asks to resume; the button is Pause again', async () => {
      await userEvent.keyboard(' ')
      await expect(onPausedChange).toHaveBeenCalledTimes(2)
      await expect(onPausedChange).toHaveBeenLastCalledWith(expect.anything(), false)
      const again = pauseButton(canvasElement, 'Pause')
      await expect(again.path).toBe(PAUSE_PATH)
      await expect(again.button).toHaveFocus()
      await expect(onZoomIn).not.toHaveBeenCalled()
      await expect(onCenterMap).not.toHaveBeenCalled()
    })
    await step('Shift+Tab leaves the bar in one step', () => leave(canvasElement))
  },
}

/** The pause button while the map is paused: the `play` icon, named "Resume". */
export const Paused: Story = {
  args: { paused: true, onPausedChange },
  play: async ({ canvasElement, step }) => {
    clearHandlers()
    const canvas = within(canvasElement)
    const resume = pauseButton(canvasElement, 'Resume')
    await step('the button shows play and is named Resume, with no pressed state', async () => {
      await expect(canvas.queryByRole('button', { name: 'Pause' })).toBeNull()
      await expect(resume.path).toBe(PLAY_PATH)
      await expect(resume.button).not.toHaveAttribute('aria-pressed')
      await expect(resume.button).not.toHaveAttribute('data-pressed')
    })
    await step('a click asks to resume; the name waits for the screen to pass paused', async () => {
      await userEvent.click(resume.button)
      await expect(onPausedChange).toHaveBeenCalledTimes(1)
      await expect(onPausedChange).toHaveBeenLastCalledWith(expect.anything(), false)
      await expect(resume.button).toHaveAccessibleName('Resume')
    })
    await step('Shift+Tab leaves the bar in one step', () => leave(canvasElement))
    await step(
      'a disabled bar dims the pause button too, and its click fires nothing',
      async () => {
        const ui = (
          <PerronProvider locale="en">
            <MapControls disabled paused onPausedChange={onPausedChange} />
          </PerronProvider>
        )
        await mounted(canvasElement, ui, async (host) => {
          const button = await waitFor(() => within(host).getByRole('button', { name: 'Resume' }))
          await expect(button).toHaveAttribute('aria-disabled', 'true')
          await userEvent.click(button)
          await expect(onPausedChange).toHaveBeenCalledTimes(1)
        })
      },
    )
  },
}

const custom = {
  mapControlsLabel: 'Network map controls',
  zoomInLabel: 'Zoom the map in',
  zoomOutLabel: 'Zoom the map out',
  centerMapLabel: 'Show the whole network',
  pauseLabel: 'Stop the vehicles',
  resumeLabel: 'Move the vehicles',
}

/** Every word overridden by its `…Label` prop; in Danish with none, the Danish dictionary's. */
export const CustomLabels: Story = {
  args: { ...custom, onPausedChange },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    await step('the overrides name the bar and the buttons', async () => {
      await expect(canvas.getByRole('toolbar')).toHaveAccessibleName(custom.mapControlsLabel)
      await expect(canvas.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
        custom.zoomInLabel,
        custom.zoomOutLabel,
        custom.centerMapLabel,
        custom.pauseLabel,
      ])
      for (const paused of [false, true])
        expectOwnedStrings(
          renderToStaticMarkup(
            <PerronProvider locale="da">
              <MapControls {...custom} paused={paused} onPausedChange={onPausedChange} />
            </PerronProvider>,
          ),
          'da',
          Object.values(custom),
        )
    })
    await step('paused, the resume override names the pause button', async () => {
      const ui = (
        <PerronProvider locale="en">
          <MapControls {...custom} paused onPausedChange={onPausedChange} />
        </PerronProvider>
      )
      await mounted(canvasElement, ui, async (host) => {
        const buttons = await waitFor(() => within(host).getAllByRole('button'))
        await expect(buttons.at(-1)).toHaveAccessibleName(custom.resumeLabel)
      })
    })
    await step('in Danish with no overrides, the Danish dictionary names them', async () => {
      const da = dictionaries.da
      for (const paused of [false, true]) {
        const ui = (
          <PerronProvider locale="da">
            <MapControls paused={paused} onPausedChange={onPausedChange} />
          </PerronProvider>
        )
        await mounted(canvasElement, ui, async (host) => {
          const bar = await waitFor(() => within(host).getByRole('toolbar'))
          await expect(bar).toHaveAccessibleName(da.mapControls)
          await expect(
            within(host)
              .getAllByRole('button')
              .map((b) => b.getAttribute('aria-label')),
          ).toEqual([da.zoomIn, da.zoomOut, da.centerMap, paused ? da.resume : da.pause])
          expectOwnedStrings(host.innerHTML, 'da')
        })
      }
    })
  },
}
