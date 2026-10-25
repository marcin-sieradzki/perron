// MapTooltip: the map's hover card, a small inverse card of the caller's words, placed against a
// point the map projects or an element, and opened and closed by the caller. On Base UI's Tooltip,
// with no Provider and no Trigger (CR-1). Spec: docs/components/map-tooltip.md.
import { mergeProps } from '@base-ui/react/merge-props'
import { Tooltip } from '@base-ui/react/tooltip'
import type { ReactNode, Ref } from 'react'
import { classes } from '../../internal/nodes.ts'
import './MapTooltip.css'

type ChangeDetails = Tooltip.Root.ChangeEventDetails

/** The positioner's defaults in pixels, read from the tokens' custom properties (CR-5). */
interface Offsets {
  sideOffset?: number
  collisionPadding?: number
}

/** Read once a token stylesheet has given both, and kept, so every render passes the same numbers. */
let offsets: Offsets | undefined

/**
 * `space.200` and `size.panel-gap` as pixel lengths, from `--perron-space-200` and
 * `--perron-size-panel-gap` in the document root's computed style (CR-5). With no document, as on
 * a server, or no token stylesheet yet, each is left out, and Base UI's own default holds until
 * they can be read.
 */
function defaultOffsets(): Offsets {
  if (offsets === undefined && typeof document !== 'undefined') {
    const root = getComputedStyle(document.documentElement)
    const px = (property: string) => {
      const value = root.getPropertyValue(property).trim()
      return value.endsWith('px') ? Number.parseFloat(value) : Number.NaN
    }
    const read = {
      sideOffset: px('--perron-space-200'),
      collisionPadding: px('--perron-size-panel-gap'),
    }
    if (!Number.isNaN(read.sideOffset) && !Number.isNaN(read.collisionPadding)) offsets = read
  }
  return offsets ?? {}
}

export interface MapTooltipProps extends Omit<Tooltip.Popup.Props, 'children' | 'ref'> {
  /**
   * The card's content: a few words on what is under the pointer, in sentence case, such as "Bus
   * 5C to Husum". It takes the card's inverse text colour.
   */
  children?: ReactNode
  /**
   * Required. What the card sits against: a virtual element whose `getBoundingClientRect()` gives
   * the point the map projects for a vehicle or stop, or an element. Pass a new one when the point
   * moves, so the card follows.
   */
  anchorEl: Exclude<Tooltip.Positioner.Props['anchor'], undefined>
  /**
   * Whether the card is shown. Set it while the pointer rests on what the card describes, and
   * clear it in `onClose`.
   */
  open?: boolean
  /**
   * Whether the card is shown at first, when `open` is not set.
   * @default false
   */
  defaultOpen?: boolean
  /**
   * Called when the card asks to close: `reason` is `'escape-key'` on Esc or `'outside-press'` on a
   * press outside it, and `details.cancel()` keeps it open.
   */
  onClose?: (
    event: ChangeDetails['event'],
    reason: Tooltip.Root.ChangeEventReason,
    details: ChangeDetails,
  ) => void
  /** Reaches the root, the card. */
  ref?: Ref<HTMLDivElement>
  /** Props for the inner parts, each merged with what the card sets on that part. */
  slotProps?: {
    /** Props for the `portal` part, such as `container` to render the card inside the map's own element. */
    portal?: Tooltip.Portal.Props
    /**
     * Props for the `positioner` part, such as `side`, `align` or `sideOffset`. Its `sideOffset`
     * and `collisionPadding` replace MapTooltip's defaults.
     */
    positioner?: Tooltip.Positioner.Props
  }
}

/**
 * Base UI's `className`: a string, or a function of the part's state. `mergeProps` joins strings
 * only, so each part's class is set after the merge, by `withClass`.
 */
type ClassName<State> = string | ((state: State) => string | undefined) | undefined

/** The part's own class first, then the caller's, whether the caller's is a string or a function. */
function withClass<State>(own: string, theirs: ClassName<State>): ClassName<State> {
  if (typeof theirs === 'function') return (state) => classes(own, theirs(state))
  return classes(own, theirs)
}

/** The map's hover card: a few of the caller's words against a point on the map or an element. */
export function MapTooltip({
  children,
  anchorEl,
  open,
  defaultOpen = false,
  onClose,
  slotProps,
  className,
  ref,
  ...rest
}: MapTooltipProps) {
  const positioner = slotProps?.positioner
  const defaults = defaultOffsets()

  // CR-4: Base UI's onOpenChange is adapted once, here, and only a closing reaches the caller
  const handleOpenChange = (next: boolean, details: ChangeDetails) => {
    if (!next) onClose?.(details.event, details.reason, details)
  }

  return (
    <Tooltip.Root open={open} defaultOpen={defaultOpen} onOpenChange={handleOpenChange}>
      <Tooltip.Portal
        {...mergeProps<typeof Tooltip.Portal>(slotProps?.portal, undefined)}
        className={withClass('pn-MapTooltip-portal', slotProps?.portal?.className)}
      >
        <Tooltip.Positioner
          // CR-5: the caller's props, then the defaults where it gives none, then the card's own
          {...mergeProps<typeof Tooltip.Positioner>(positioner, {
            sideOffset: positioner?.sideOffset ?? defaults.sideOffset,
            collisionPadding: positioner?.collisionPadding ?? defaults.collisionPadding,
            anchor: anchorEl,
          })}
          className={withClass('pn-MapTooltip-positioner', positioner?.className)}
        >
          <Tooltip.Popup {...rest} ref={ref} className={withClass('pn-MapTooltip', className)}>
            {children}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
