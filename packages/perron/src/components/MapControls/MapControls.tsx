'use client'
// MapControls: the map's zoom in, zoom out and centre buttons, and a pause button when the screen
// handles one, in Perron's Toolbar on its glass, one tab stop named in the reader's language. Every
// behaviour and every look is Toolbar's (CR-1, CR-9).
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
  /** Reaches the root. Merged after `pn-Toolbar` and `pn-MapControls`. */
  className?: string
  /** Reaches the root. */
  style?: CSSProperties
  /** Reaches the root, the `role="toolbar"` element. */
  ref?: Ref<HTMLDivElement>
}

/**
 * The map's zoom in, zoom out and centre buttons, and a pause button when the screen handles one,
 * in one glass bar that is one tab stop. The screen places it, at the bottom right of the map, and
 * does the zooming and the pausing in its handlers.
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
  mapControlsLabel,
  zoomInLabel,
  zoomOutLabel,
  centerMapLabel,
  pauseLabel,
  resumeLabel,
  className,
  ref,
  ...rest
}: MapControlsProps) {
  const strings = useOwnedStrings({
    mapControls: mapControlsLabel,
    zoomIn: zoomInLabel,
    zoomOut: zoomOutLabel,
    centerMap: centerMapLabel,
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
