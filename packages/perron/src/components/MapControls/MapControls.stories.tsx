// MapControls' stories: the bar in each orientation, at each zoom limit, disabled, with its pause
// button moving and paused, its 3D toggle flat and tilted, its compass turned, all six buttons
// together, and with its words overridden. The buttons' hover, focus and pressed
// looks are ToolbarButton's, storied on the Toolbar page; these render at rest, and their play
// tests check the behaviour.
import { useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import { dictionaries } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import {
  fill,
  forcedColourSheet,
  mounted,
  pressedAfterHover,
  resolve,
  stateFill,
} from '../../testing/stories.ts'
import compassSvg from '../../../icons/compass.svg?raw'
import cubeSvg from '../../../icons/cube.svg?raw'
import pauseSvg from '../../../icons/pause.svg?raw'
import playSvg from '../../../icons/play.svg?raw'
import { MapControls, type MapControlsProps } from './MapControls.tsx'

const onZoomIn = fn()
const onZoomOut = fn()
const onCenterMap = fn()
const onPausedChange = fn()
const onTiltedChange = fn()
const onResetNorth = fn()

/** The path an icon file draws, to tell which icon a button shows. */
const pathOf = (svg: string) => /\sd="([^"]+)"/.exec(svg)![1]
const PAUSE_PATH = pathOf(pauseSvg)
const PLAY_PATH = pathOf(playSvg)
const CUBE_PATH = pathOf(cubeSvg)
const COMPASS_PATH = pathOf(compassSvg)

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
  onTiltedChange.mockClear()
  onResetNorth.mockClear()
}

/** The path of the first icon drawn in `button`, to tell which icon it shows. */
const iconPath = (button: Element) => button.querySelector('svg path')?.getAttribute('d')

/** Whether `button`'s icon sits inside an `aria-hidden` span, out of what the ear hears. */
const iconHidden = (button: Element) =>
  button.querySelector('svg')?.closest('[aria-hidden="true"]') != null

/**
 * The angle, in degrees, that an element's computed `transform` turns it by, 0 for none, read from
 * its matrix, so `rotate(-90deg)` reads -90 whatever form the browser computes it in.
 */
const turnOf = (element: Element) => {
  const transform = getComputedStyle(element).transform
  if (transform === 'none') return 0
  const { a, b } = new DOMMatrix(transform)
  return Math.round((Math.atan2(b, a) * 180) / Math.PI) + 0
}

/**
 * Renders `first` apart from the story, into a host appended to `parent`, and gives `test` the host
 * and a `render` that passes the bar new props in place, as a screen does when its map changes, so
 * the same elements stay. Unmounts and removes the host after.
 */
async function screen(
  parent: HTMLElement,
  first: ReactNode,
  test: (host: HTMLElement, render: (ui: ReactNode) => void) => Promise<void>,
) {
  const host = document.createElement('div')
  parent.append(host)
  const root = createRoot(host)
  const render = (ui: ReactNode) => flushSync(() => root.render(ui))
  render(first)
  try {
    await test(host, render)
  } finally {
    root.unmount()
    host.remove()
  }
}

/** A bar with every button, its 3D toggle, compass and pause button among them, in English. */
const allControls = (props: MapControlsProps = {}) => (
  <PerronProvider locale="en">
    <MapControls
      onZoomIn={onZoomIn}
      onZoomOut={onZoomOut}
      onCenterMap={onCenterMap}
      onTiltedChange={onTiltedChange}
      onResetNorth={onResetNorth}
      onPausedChange={onPausedChange}
      {...props}
    />
  </PerronProvider>
)

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
 * A button's limit leaves the pause button enabled: mounted beside the story's bar at `limit`, it is
 * neither dimmed nor announced as dimmed, and a click fires `onPausedChange` once.
 */
const pauseEnabledAt = (
  canvasElement: HTMLElement,
  limit: Pick<MapControlsProps, 'zoomInDisabled' | 'zoomOutDisabled' | 'centerMapDisabled'>,
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
    await step(
      'without the new props, the bar is as before: no 3D toggle, compass or pause',
      async () => {
        const bar = canvas.getByRole('toolbar')
        await expect(canvas.getAllByRole('button')).toHaveLength(3)
        await expect(canvas.getAllByRole('separator')).toHaveLength(1)
        for (const part of ['angleSeparator', 'tilt', 'compass', 'pauseSeparator', 'pause'])
          await expect(bar.querySelector(`.pn-MapControls-${part}`)).toBeNull()
        await expect(bar.querySelector('[aria-pressed]')).toBeNull()
      },
    )
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
    // With the 3D toggle and the compass, the row walks centre, 3D, compass, pause, past an upright
    // angleSeparator.
    await mounted(canvasElement, allControls({ orientation: 'horizontal' }), async (host) => {
      const bar = await waitFor(() => within(host).getByRole('toolbar'))
      const [, , hostCenterMap, tilt, compass, pause] = within(bar).getAllByRole('button')
      await expect(bar.querySelector('.pn-MapControls-angleSeparator')).toHaveAttribute(
        'aria-orientation',
        'vertical',
      )
      hostCenterMap.focus()
      for (const next of [tilt, compass, pause]) {
        await userEvent.keyboard('{ArrowRight}')
        await expect(next).toHaveFocus()
      }
      await userEvent.keyboard('{ArrowLeft}')
      await expect(compass).toHaveFocus()
      compass.blur()
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

/** Before the map can be moved: the centre button is dimmed, the pause button still pressable. */
export const CenterMapDisabled: Story = {
  args: { centerMapDisabled: true },
  play: async ({ canvasElement }) => {
    clearHandlers()
    const { zoomIn, zoomOut, centerMap } = buttonsIn(canvasElement)
    await expect(centerMap).toHaveAttribute('aria-disabled', 'true')
    await expect(centerMap).toHaveAttribute('data-disabled')
    await expect(zoomIn).not.toHaveAttribute('data-disabled')
    await expect(zoomOut).not.toHaveAttribute('data-disabled')
    await enter()
    await userEvent.keyboard('{ArrowUp}')
    await expect(centerMap).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await userEvent.click(centerMap)
    await expect(onCenterMap).not.toHaveBeenCalled()
    await userEvent.click(zoomIn)
    await expect(onZoomIn).toHaveBeenCalledTimes(1)
    await userEvent.click(zoomOut)
    await expect(onZoomOut).toHaveBeenCalledTimes(1)
    await leave(canvasElement)
    await pauseEnabledAt(canvasElement, { centerMapDisabled: true })
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
    // With every button, the 3D toggle, the compass and the pause button are dimmed with the rest.
    await mounted(canvasElement, allControls({ disabled: true, tilted: true }), async (host) => {
      const bar = await waitFor(() => within(host).getByRole('toolbar'))
      const [, , , tilt, compass, pause] = within(bar).getAllByRole('button')
      for (const button of [tilt, compass, pause])
        await expect(button).toHaveAttribute('aria-disabled', 'true')
      await expect(tilt).toHaveAttribute('aria-pressed', 'true')
      await expect(getComputedStyle(tilt).backgroundColor).toBe(fill('color-surface-inset'))
      for (const button of [tilt, compass, pause]) await userEvent.click(button)
      await expect(onTiltedChange).not.toHaveBeenCalled()
      await expect(onResetNorth).not.toHaveBeenCalled()
      await expect(onPausedChange).not.toHaveBeenCalled()
    })
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

/**
 * A screen that holds `tilted` in its own `useState` and sets it from `onTiltedChange`: the story's
 * spy stands for the screen's own handler.
 */
function TiltableMap(args: MapControlsProps) {
  const [tilted, setTilted] = useState(args.tilted ?? false)
  return (
    <MapControls
      {...args}
      tilted={tilted}
      onTiltedChange={(event, next) => {
        args.onTiltedChange?.(event, next)
        setTilted(next)
      }}
    />
  )
}

/**
 * The bar with its 3D toggle, while the map is flat: zoom in, zoom out, a separator, centre the map,
 * a separator, 3D. The screen holds `tilted`, so each press turns the toggle on or off.
 */
export const Tiltable: Story = {
  args: { onTiltedChange },
  render: (args) => <TiltableMap {...args} />,
  play: async ({ canvasElement, step }) => {
    clearHandlers()
    const canvas = within(canvasElement)
    const { zoomIn, zoomOut, centerMap } = buttonsIn(canvasElement)
    const tilt = canvas.getByRole('button', { name: '3D view' })
    await step('one bar holds four buttons, the 3D toggle last, past angleSeparator', async () => {
      await expect(canvas.getAllByRole('toolbar')).toHaveLength(1)
      await expect(canvas.getAllByRole('button')).toEqual([zoomIn, zoomOut, centerMap, tilt])
      const separators = canvas.getAllByRole('separator')
      await expect(separators).toHaveLength(2)
      await expect(separators[1]).toHaveClass(
        'pn-ToolbarSeparator',
        'pn-MapControls-angleSeparator',
      )
      await expect(separators[1].nextElementSibling).toBe(tilt)
      await expect(tilt).toHaveClass('pn-ToolbarButton', 'pn-MapControls-tilt')
      await expect(iconPath(tilt)).toBe(CUBE_PATH)
      await expect(iconHidden(tilt)).toBe(true)
      await expect(tilt).toHaveAttribute('aria-pressed', 'false')
      await expect(getComputedStyle(tilt).backgroundColor).toBe(
        getComputedStyle(zoomIn).backgroundColor,
      )
      await expect(getComputedStyle(tilt).color).toBe(getComputedStyle(zoomIn).color)
    })
    await step('the bar is one tab stop, and ArrowUp wraps to the toggle', async () => {
      await enter()
      await expect(zoomIn).toHaveFocus()
      await userEvent.keyboard('{ArrowUp}')
      await expect(tilt).toHaveFocus()
    })
    await step(
      'Enter asks for tilted; the screen tilts, and the toggle is on, with focus kept',
      async () => {
        await userEvent.keyboard('{Enter}')
        await expect(onTiltedChange).toHaveBeenCalledTimes(1)
        await expect(onTiltedChange).toHaveBeenLastCalledWith(expect.anything(), true)
        await expect(tilt).toHaveAttribute('aria-pressed', 'true')
        await expect(tilt).toHaveAccessibleName('3D view')
        await expect(iconPath(tilt)).toBe(CUBE_PATH)
        await expect(getComputedStyle(tilt).backgroundColor).toBe(fill('color-surface-inverse'))
        await expect(tilt).toHaveFocus()
      },
    )
    await step('Space asks to lay it flat; the toggle is off again', async () => {
      await userEvent.keyboard(' ')
      await expect(onTiltedChange).toHaveBeenCalledTimes(2)
      await expect(onTiltedChange).toHaveBeenLastCalledWith(expect.anything(), false)
      await expect(tilt).toHaveAttribute('aria-pressed', 'false')
      await expect(tilt).toHaveFocus()
      await expect(onZoomIn).not.toHaveBeenCalled()
    })
    await step('Shift+Tab leaves the bar in one step', () => leave(canvasElement))
    await step('a gesture the screen passes on as tilted presses the toggle with no press', () =>
      screen(
        canvasElement,
        <PerronProvider locale="en">
          <MapControls onTiltedChange={onTiltedChange} />
        </PerronProvider>,
        async (host, render) => {
          const toggle = within(host).getByRole('button', { name: '3D view' })
          await expect(toggle).toHaveAttribute('aria-pressed', 'false')
          render(
            <PerronProvider locale="en">
              <MapControls tilted onTiltedChange={onTiltedChange} />
            </PerronProvider>,
          )
          await expect(within(host).getByRole('button', { name: '3D view' })).toBe(toggle)
          await expect(toggle).toHaveAttribute('aria-pressed', 'true')
          await expect(onTiltedChange).toHaveBeenCalledTimes(2)
        },
      ),
    )
  },
}

/** The 3D toggle while the map is tilted: on, on the inverse fill. */
export const Tilted: Story = {
  args: { tilted: true, onTiltedChange },
  play: async ({ canvasElement, step }) => {
    clearHandlers()
    const canvas = within(canvasElement)
    const { zoomIn } = buttonsIn(canvasElement)
    const tilt = canvas.getByRole('button', { name: '3D view' })
    await step(
      'the toggle is pressed, on the inverse fill, the size of an off button',
      async () => {
        await expect(tilt).toHaveAttribute('aria-pressed', 'true')
        await expect(tilt).not.toHaveAttribute('data-pressed')
        await expect(tilt).not.toHaveAttribute('data-selected')
        const style = getComputedStyle(tilt)
        await expect(style.backgroundColor).toBe(fill('color-surface-inverse'))
        await expect(style.color).toBe(resolve('color', 'var(--perron-color-text-inverse)'))
        await expect(style.borderColor).toBe(resolve('borderColor', 'transparent'))
        const [on, off] = [tilt, zoomIn].map((b) => b.getBoundingClientRect())
        await expect([on.width, on.height]).toEqual([off.width, off.height])
      },
    )
    await step("hover and press take the inverse fill's own steps, the press after", async () => {
      await expect(stateFill(tilt)).toBe('var(--perron-color-surface-inverse-hover)')
      await expect(stateFill(tilt, ':active')).toBe('var(--perron-color-surface-inverse-pressed)')
      await expect(pressedAfterHover(tilt)).toBe(true)
    })
    await step('a click asks to lay it flat; the toggle waits for the screen', async () => {
      await userEvent.click(tilt)
      await expect(onTiltedChange).toHaveBeenCalledTimes(1)
      await expect(onTiltedChange).toHaveBeenLastCalledWith(expect.anything(), false)
      await expect(tilt).toHaveAttribute('aria-pressed', 'true')
    })
    await step('in forced colours, the on toggle keeps a Highlight fill', async () => {
      const sheet = forcedColourSheet('pn-MapControls-tilt')
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]
      try {
        const style = getComputedStyle(tilt)
        await expect(style.backgroundColor).toBe(resolve('backgroundColor', 'Highlight'))
        await expect(style.color).toBe(resolve('color', 'HighlightText'))
      } finally {
        document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== sheet)
      }
    })
    await step('Shift+Tab leaves the bar in one step', () => leave(canvasElement))
  },
}

/** The compass, with the map turned 90° clockwise: its needle points left, to north on the map. */
export const Compass: Story = {
  args: { onResetNorth, heading: 90 },
  play: async ({ canvasElement, step }) => {
    clearHandlers()
    const canvas = within(canvasElement)
    const { zoomIn, zoomOut, centerMap } = buttonsIn(canvasElement)
    const compass = canvas.getByRole('button', { name: 'Reset to north' })
    const needle = compass.querySelector('svg')!
    await step('the compass follows angleSeparator, named, with its needle turned', async () => {
      await expect(canvas.getAllByRole('button')).toEqual([zoomIn, zoomOut, centerMap, compass])
      const separator = canvasElement.querySelector('.pn-MapControls-angleSeparator')
      await expect(separator).toHaveAttribute('role', 'separator')
      await expect(separator?.nextElementSibling).toBe(compass)
      await expect(canvasElement.querySelector('.pn-MapControls-tilt')).toBeNull()
      await expect(compass).toHaveClass('pn-ToolbarButton', 'pn-MapControls-compass')
      await expect(compass).not.toHaveAttribute('aria-pressed')
      await expect(iconPath(compass)).toBe(COMPASS_PATH)
      await expect(iconHidden(compass)).toBe(true)
      await expect(turnOf(needle)).toBe(-90)
      await expect(getComputedStyle(needle).transitionDuration).toBe('0s')
    })
    await step('Enter and a click each call onResetNorth once', async () => {
      await enter()
      await userEvent.keyboard('{ArrowUp}')
      await expect(compass).toHaveFocus()
      await userEvent.keyboard('{Enter}')
      await expect(onResetNorth).toHaveBeenCalledTimes(1)
      await userEvent.click(compass)
      await expect(onResetNorth).toHaveBeenCalledTimes(2)
      await expect(onCenterMap).not.toHaveBeenCalled()
    })
    await step('Shift+Tab leaves the bar in one step', () => leave(canvasElement))
    await step('at north the compass stays, unturned; NaN draws it unturned too', () =>
      screen(
        canvasElement,
        <PerronProvider locale="en">
          <MapControls heading={90} onResetNorth={onResetNorth} />
        </PerronProvider>,
        async (host, render) => {
          const button = within(host).getByRole('button', { name: 'Reset to north' })
          await expect(turnOf(button.querySelector('svg')!)).toBe(-90)
          for (const heading of [0, 405, -45, Number.NaN]) {
            render(
              <PerronProvider locale="en">
                <MapControls heading={heading} onResetNorth={onResetNorth} />
              </PerronProvider>,
            )
            await expect(within(host).getByRole('button', { name: 'Reset to north' })).toBe(button)
            const turn = Number.isFinite(heading) ? -heading : 0
            await expect(turnOf(button.querySelector('svg')!)).toBe(
              Math.round(((((turn + 180) % 360) + 360) % 360) - 180),
            )
          }
          await expect(onResetNorth).toHaveBeenCalledTimes(2)
        },
      ),
    )
  },
}

/** Every button: zoom in, zoom out, centre, 3D, the compass and pause, past three separators. */
export const AllControls: Story = {
  args: { onTiltedChange, onResetNorth, onPausedChange, heading: 30 },
  play: async ({ canvasElement, step }) => {
    clearHandlers()
    const canvas = within(canvasElement)
    const { zoomIn, zoomOut, centerMap } = buttonsIn(canvasElement)
    const tilt = canvas.getByRole('button', { name: '3D view' })
    const compass = canvas.getByRole('button', { name: 'Reset to north' })
    const pause = canvas.getByRole('button', { name: 'Pause' })
    const order = [zoomIn, zoomOut, centerMap, tilt, compass, pause]
    await step('six buttons and three separators, in order', async () => {
      await expect(canvas.getAllByRole('button')).toEqual(order)
      const separators = canvas.getAllByRole('separator')
      await expect(separators.map((s) => s.classList[1])).toEqual([
        'pn-MapControls-separator',
        'pn-MapControls-angleSeparator',
        'pn-MapControls-pauseSeparator',
      ])
      await expect(turnOf(compass.querySelector('svg')!)).toBe(-30)
    })
    await step(
      'one tab stop; ArrowDown walks every button, skipping the separators, and wraps',
      async () => {
        await enter()
        await expect(zoomIn).toHaveFocus()
        for (const next of [...order.slice(1), zoomIn]) {
          await userEvent.keyboard('{ArrowDown}')
          await expect(next).toHaveFocus()
        }
      },
    )
    await step('each press fires only its own handler', async () => {
      const handlers = [
        onZoomIn,
        onZoomOut,
        onCenterMap,
        onTiltedChange,
        onResetNorth,
        onPausedChange,
      ]
      for (const [index, button] of order.entries()) {
        await userEvent.click(button)
        for (const [other, handler] of handlers.entries())
          await expect(handler).toHaveBeenCalledTimes(other <= index ? 1 : 0)
      }
      await expect(onTiltedChange).toHaveBeenLastCalledWith(expect.anything(), true)
      await expect(onPausedChange).toHaveBeenLastCalledWith(expect.anything(), true)
    })
    await step('Shift+Tab leaves the bar in one step', () => leave(canvasElement))
  },
}

const custom = {
  mapControlsLabel: 'Network map controls',
  zoomInLabel: 'Zoom the map in',
  zoomOutLabel: 'Zoom the map out',
  centerMapLabel: 'Show the whole network',
  pauseLabel: 'Stop the vehicles',
  resumeLabel: 'Move the vehicles',
  view3dLabel: 'Tilted map',
  resetNorthLabel: 'Turn the map to north',
}

/** The 3D toggle's, the compass's and the pause button's handlers, so a bar shows all six buttons. */
const extras = { onTiltedChange, onResetNorth, onPausedChange }

/** Every word overridden by its `…Label` prop; in Danish with none, the Danish dictionary's. */
export const CustomLabels: Story = {
  args: { ...custom, ...extras },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    await step('the overrides name the bar and the buttons', async () => {
      await expect(canvas.getByRole('toolbar')).toHaveAccessibleName(custom.mapControlsLabel)
      await expect(canvas.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
        custom.zoomInLabel,
        custom.zoomOutLabel,
        custom.centerMapLabel,
        custom.view3dLabel,
        custom.resetNorthLabel,
        custom.pauseLabel,
      ])
      for (const paused of [false, true])
        expectOwnedStrings(
          renderToStaticMarkup(
            <PerronProvider locale="da">
              <MapControls {...custom} {...extras} paused={paused} tilted={paused} />
            </PerronProvider>,
          ),
          'da',
          Object.values(custom),
        )
    })
    await step('paused and tilted, the overrides still name the buttons', async () => {
      const ui = (
        <PerronProvider locale="en">
          <MapControls {...custom} {...extras} paused tilted />
        </PerronProvider>
      )
      await mounted(canvasElement, ui, async (host) => {
        const buttons = await waitFor(() => within(host).getAllByRole('button'))
        await expect(buttons.at(-1)).toHaveAccessibleName(custom.resumeLabel)
        await expect(buttons[3]).toHaveAccessibleName(custom.view3dLabel)
        await expect(buttons[3]).toHaveAttribute('aria-pressed', 'true')
      })
    })
    await step('in Danish with no overrides, the Danish dictionary names them', async () => {
      const da = dictionaries.da
      for (const paused of [false, true]) {
        const ui = (
          <PerronProvider locale="da">
            <MapControls {...extras} paused={paused} tilted={paused} />
          </PerronProvider>
        )
        await mounted(canvasElement, ui, async (host) => {
          const bar = await waitFor(() => within(host).getByRole('toolbar'))
          await expect(bar).toHaveAccessibleName(da.mapControls)
          await expect(
            within(host)
              .getAllByRole('button')
              .map((b) => b.getAttribute('aria-label')),
          ).toEqual([
            da.zoomIn,
            da.zoomOut,
            da.centerMap,
            da.view3d,
            da.resetNorth,
            paused ? da.resume : da.pause,
          ])
          expectOwnedStrings(host.innerHTML, 'da')
        })
      }
    })
  },
}
