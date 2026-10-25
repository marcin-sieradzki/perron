'use client'
// MapControls: the map's zoom in, zoom out and centre buttons, in Perron's Toolbar on its glass, one
// tab stop named in the reader's language. Every behaviour and every look is Toolbar's (CR-1, CR-9).
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
  /** Reaches the root. Merged after `pn-Toolbar` and `pn-MapControls`. */
  className?: string
  /** Reaches the root. */
  style?: CSSProperties
  /** Reaches the root, the `role="toolbar"` element. */
  ref?: Ref<HTMLDivElement>
}

/**
 * The map's zoom in, zoom out and centre buttons, in one glass bar that is one tab stop. The screen
 * places it, at the bottom right of the map, and does the zooming in its handlers.
 */
export function MapControls({
  orientation = 'vertical',
  disabled = false,
  zoomInDisabled = false,
  zoomOutDisabled = false,
  onZoomIn,
  onZoomOut,
  onCenterMap,
  mapControlsLabel,
  zoomInLabel,
  zoomOutLabel,
  centerMapLabel,
  className,
  ref,
  ...rest
}: MapControlsProps) {
  const strings = useOwnedStrings({
    mapControls: mapControlsLabel,
    zoomIn: zoomInLabel,
    zoomOut: zoomOutLabel,
    centerMap: centerMapLabel,
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
        disabled={disabled}
        onClick={onCenterMap}
      />
    </Toolbar>
  )
}
