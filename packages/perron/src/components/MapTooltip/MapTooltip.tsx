// MapTooltip: the map's hover card, a small inverse card of the caller's words, placed against a
// point the map projects or an element, and opened and closed by the caller. On Base UI's Tooltip,
// with no Provider and no Trigger (CR-1). Spec: docs/components/map-tooltip.md.
import { mergeProps } from '@base-ui/react/merge-props'
import { Tooltip } from '@base-ui/react/tooltip'
import type { ReactNode, Ref } from 'react'
import { withClass } from '../../internal/nodes.ts'
import { positionerOffsets } from '../../internal/tokens.ts'
import './MapTooltip.css'

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
    event: Tooltip.Root.ChangeEventDetails['event'],
    reason: Tooltip.Root.ChangeEventReason,
    details: Tooltip.Root.ChangeEventDetails,
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
  const defaults = positionerOffsets()

  // CR-4: Base UI's onOpenChange is adapted once, here, and only a closing reaches the caller
  const handleOpenChange = (next: boolean, details: Tooltip.Root.ChangeEventDetails) => {
    if (!next) onClose?.(details.event, details.reason, details)
  }

  return (
    <Tooltip.Root open={open} defaultOpen={defaultOpen} onOpenChange={handleOpenChange}>
      <Tooltip.Portal
        {...slotProps?.portal}
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
