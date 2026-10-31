'use client'
// MapControls: the map's zoom in, zoom out and centre buttons, and a 3D toggle, a compass and a
// pause button when the screen handles them, in Perron's Toolbar on its glass, one tab stop named in
// the reader's language. Every behaviour and every look is Toolbar's (CR-1), but the 3D toggle's on
// look (CR-9).
// The spec is docs/components/map-controls.md.
import type { CSSProperties, MouseEvent, Ref } from 'react'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import { Toolbar, ToolbarButton, ToolbarSeparator } from '../Toolbar/Toolbar.tsx'
import type { ToolbarProps } from '../Toolbar/Toolbar.tsx'
import { classes } from '../../internal/nodes.ts'
import './MapControls.css'

/** The icons' shared attributes, from packages/perron/icons/ (CR-7). */
const STROKE = {
  className: 'perron-icon',
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

/** `plus` from packages/perron/icons/. */
const PLUS = (
  <svg {...STROKE} strokeWidth="1.8">
    <path d="M3.5 8h9M8 3.5v9" />
  </svg>
)

/** `minus` from packages/perron/icons/. */
const MINUS = (
  <svg {...STROKE} strokeWidth="1.8">
    <path d="M3.5 8h9" />
  </svg>
)

/** `locate` from packages/perron/icons/. */
const LOCATE = (
  <svg {...STROKE} strokeWidth="1.6">
    <circle cx="8" cy="8" r="5" />
    <path d="M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3" />
  </svg>
)

/** `cube` from packages/perron/icons/: the 3D toggle's, the same while the map is tilted and flat. */
const CUBE = (
  <svg {...STROKE} strokeWidth="1.6">
    <path d="M8 1.75 13.5 4.75v6.5L8 14.25l-5.5-3v-6.5Z" />
    <path d="M2.5 4.75 8 7.75l5.5-3M8 7.75v6.5" />
  </svg>
)

/**
 * `compass` from packages/perron/icons/, its filled north half pointing to north on the map: turned
 * by minus `heading` about its centre, and unturned for a `heading` that isn't finite (CR-15). The
 * needle jumps to each heading, with no transition (CR-12).
 */
const compass = (heading: number) => (
  <svg
    {...STROKE}
    strokeWidth="1.6"
    style={Number.isFinite(heading) ? { transform: `rotate(${-heading}deg)` } : undefined}
  >
    <path d="M8 1.75 10.75 8h-5.5Z" fill="currentColor" />
    <path d="M5.25 8 8 14.25 10.75 8" />
  </svg>
)

/** `pause` from packages/perron/icons/: shown while the map moves, for the press that stops it. */
const PAUSE = (
  <svg {...STROKE} strokeWidth="1.8">
    <path d="M5.75 3.5v9M10.25 3.5v9" />
  </svg>
)

/** `play` from packages/perron/icons/: shown while the map is paused, for the press that resumes it. */
const PLAY = (
  <svg {...STROKE} strokeWidth="1.6">
    <path d="M5 3.4v9.2a.5.5 0 0 0 .76.43l7.4-4.6a.5.5 0 0 0 0-.86l-7.4-4.6A.5.5 0 0 0 5 3.4z" />
  </svg>
)

export interface MapControlsProps extends Omit<
  ToolbarProps,
  'orientation' | 'disabled' | 'children' | 'className' | 'style' | 'ref'
> {
  /**
   * Which way the bar runs, and so which arrow keys move through it: Up and Down for `vertical`,
   * the map's column at the bottom right; Left and Right for `horizontal`.
   * @default 'vertical'
   */
  orientation?: 'horizontal' | 'vertical'
  /**
   * Whether every button is disabled, such as while the map loads. The buttons stay focusable and
   * in the arrow-key order.
   * @default false
   */
  disabled?: boolean
  /**
   * Whether the zoom in button is disabled, at the map's closest zoom. It stays focusable and
   * announces that it is dimmed, and a click fires no `onZoomIn`.
   * @default false
   */
  zoomInDisabled?: boolean
  /**
   * Whether the zoom out button is disabled, at the map's farthest zoom. It stays focusable and
   * announces that it is dimmed, and a click fires no `onZoomOut`.
   * @default false
   */
  zoomOutDisabled?: boolean
  /**
   * Whether the centre button is disabled, such as before the map can be moved, while the pause
   * button stays enabled. It stays focusable and announces that it is dimmed, and a click fires no
   * `onCenterMap`.
   * @default false
   */
  centerMapDisabled?: boolean
  /**
   * Called when the zoom in button is pressed, by click, Enter or Space, with the click event. The
   * screen zooms the map in by one step.
   */
  onZoomIn?: (event: MouseEvent<HTMLButtonElement>) => void
  /**
   * Called when the zoom out button is pressed, by click, Enter or Space, with the click event. The
   * screen zooms the map out by one step.
   */
  onZoomOut?: (event: MouseEvent<HTMLButtonElement>) => void
  /**
   * Called when the centre button is pressed, by click, Enter or Space, with the click event. The
   * screen moves and zooms the map to show the whole network.
   */
  onCenterMap?: (event: MouseEvent<HTMLButtonElement>) => void
  /**
   * Whether the map's motion is paused, held by the screen. The pause button shows the `play` icon
   * and is named "Resume" while it is `true`, and the `pause` icon and "Pause" while it is `false`.
   * @default false
   */
  paused?: boolean
  /**
   * Called when the pause button is pressed, by click, Enter or Space, with the click event and the
   * state the press asks for: `true` while the map moves, `false` while it is paused. Given, it adds
   * the pause button after the centre button; the screen stops or starts the map's motion and passes
   * the new `paused`.
   */
  onPausedChange?: (event: MouseEvent<HTMLButtonElement>, paused: boolean) => void
  /**
   * Whether the map is tilted into 3D, held by the screen, by the 3D toggle or a gesture alike. The
   * 3D toggle is pressed, `aria-pressed="true"` on its on fill, while it is `true`.
   * @default false
   */
  tilted?: boolean
  /**
   * Called when the 3D toggle is pressed, by click, Enter or Space, with the click event and the
   * state the press asks for: `true` while the map is flat, `false` while it is tilted. Given, it
   * adds the 3D toggle after the centre button; the screen tilts the map or lays it flat and passes
   * the new `tilted`.
   */
  onTiltedChange?: (event: MouseEvent<HTMLButtonElement>, tilted: boolean) => void
  /**
   * The map's heading in degrees, its bearing clockwise from north, held by the screen. The
   * compass's needle turns by minus `heading`, so it points to north on the map; a value that isn't
   * finite points it up.
   * @default 0
   */
  heading?: number
  /**
   * Called when the compass is pressed, by click, Enter or Space, with the click event. Given, it
   * adds the compass after the centre button, and after the 3D toggle when there is one; the screen
   * turns the map back to north and passes the new `heading`.
   */
  onResetNorth?: (event: MouseEvent<HTMLButtonElement>) => void
  /**
   * Overrides "Map controls", the bar's name.
   * @default The locale's
   */
  mapControlsLabel?: string
  /**
   * Overrides "Zoom in", the zoom in button's name.
   * @default The locale's
   */
  zoomInLabel?: string
  /**
   * Overrides "Zoom out", the zoom out button's name.
   * @default The locale's
   */
  zoomOutLabel?: string
  /**
   * Overrides "Centre the map", the centre button's name.
   * @default The locale's
   */
  centerMapLabel?: string
  /**
   * Overrides "Pause", the pause button's name while the map moves.
   * @default The locale's
   */
  pauseLabel?: string
  /**
   * Overrides "Resume", the pause button's name while the map is paused.
   * @default The locale's
   */
  resumeLabel?: string
  /**
   * Overrides "3D view", the 3D toggle's name.
   * @default The locale's
   */
  view3dLabel?: string
  /**
   * Overrides "Reset to north", the compass's name.
   * @default The locale's
   */
  resetNorthLabel?: string
  /** Reaches the root. Merged after `pn-Toolbar` and `pn-MapControls`. */
  className?: string
  /** Reaches the root. */
  style?: CSSProperties
  /** Reaches the root, the `role="toolbar"` element. */
  ref?: Ref<HTMLDivElement>
}

/**
 * The map's zoom in, zoom out and centre buttons, and a 3D toggle, a compass and a pause button when
 * the screen handles them, in one glass bar that is one tab stop. The screen places it, at the
 * bottom right of the map, and does the zooming, tilting, turning and pausing in its handlers.
 */
export function MapControls({
  orientation = 'vertical',
  disabled = false,
  zoomInDisabled = false,
  zoomOutDisabled = false,
  centerMapDisabled = false,
  onZoomIn,
  onZoomOut,
  onCenterMap,
  paused = false,
  onPausedChange,
  tilted = false,
  onTiltedChange,
  heading = 0,
  onResetNorth,
  mapControlsLabel,
  zoomInLabel,
  zoomOutLabel,
  centerMapLabel,
  pauseLabel,
  resumeLabel,
  view3dLabel,
  resetNorthLabel,
  className,
  ref,
  ...rest
}: MapControlsProps) {
  const strings = useOwnedStrings({
    mapControls: mapControlsLabel,
    zoomIn: zoomInLabel,
    zoomOut: zoomOutLabel,
    centerMap: centerMapLabel,
    view3d: view3dLabel,
    resetNorth: resetNorthLabel,
    pause: pauseLabel,
    resume: resumeLabel,
  })
  return (
    <Toolbar
      {...rest}
      ref={ref}
      orientation={orientation}
      disabled={disabled}
      aria-label={strings.mapControls}
      className={classes('pn-MapControls', className)}
    >
      <ToolbarButton
        className="pn-MapControls-zoomIn"
        color="neutral"
        startIcon={PLUS}
        aria-label={strings.zoomIn}
        disabled={disabled || zoomInDisabled}
        onClick={onZoomIn}
      />
      <ToolbarButton
        className="pn-MapControls-zoomOut"
        color="neutral"
        startIcon={MINUS}
        aria-label={strings.zoomOut}
        disabled={disabled || zoomOutDisabled}
        onClick={onZoomOut}
      />
      <ToolbarSeparator className="pn-MapControls-separator" />
      <ToolbarButton
        className="pn-MapControls-centerMap"
        color="neutral"
        startIcon={LOCATE}
        aria-label={strings.centerMap}
        disabled={disabled || centerMapDisabled}
        onClick={onCenterMap}
      />
      {/* The 3D toggle and the compass are the screen's to ask for, past a separator of their own. */}
      {onTiltedChange || onResetNorth ? (
        <ToolbarSeparator className="pn-MapControls-angleSeparator" />
      ) : null}
      {onTiltedChange ? (
        <ToolbarButton
          className="pn-MapControls-tilt"
          color="neutral"
          startIcon={CUBE}
          aria-label={strings.view3d}
          aria-pressed={tilted}
          disabled={disabled}
          onClick={(event) => onTiltedChange(event, !tilted)}
        />
      ) : null}
      {onResetNorth ? (
        <ToolbarButton
          className="pn-MapControls-compass"
          color="neutral"
          startIcon={compass(heading)}
          aria-label={strings.resetNorth}
          disabled={disabled}
          onClick={onResetNorth}
        />
      ) : null}
      {/* The pause button is the screen's to ask for: with no handler, the bar is its three buttons. */}
      {onPausedChange ? (
        <>
          <ToolbarSeparator className="pn-MapControls-pauseSeparator" />
          <ToolbarButton
            className="pn-MapControls-pause"
            color="neutral"
            startIcon={paused ? PLAY : PAUSE}
            aria-label={paused ? strings.resume : strings.pause}
            disabled={disabled}
            onClick={(event) => onPausedChange(event, !paused)}
          />
        </>
      ) : null}
    </Toolbar>
  )
}
