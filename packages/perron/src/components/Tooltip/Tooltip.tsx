// Tooltip: a short visual label beside a control, shown while a mouse pointer rests on it or the
// keyboard focuses it, on Base UI's Tooltip. One component that takes its trigger as a prop and its
// words as children, the popup as its root; PerronProvider holds the one Tooltip.Provider (CR-1).
// The spec is docs/components/tooltip.md.
import { mergeProps } from '@base-ui/react/merge-props'
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip'
import { useId } from 'react'
import type { ReactElement, ReactNode, Ref } from 'react'
import { withClass } from '../../internal/nodes.ts'
import { positionerOffsets } from '../../internal/tokens.ts'
import './Tooltip.css'

type ChangeDetails = BaseTooltip.Root.ChangeEventDetails

export interface TooltipProps extends Omit<BaseTooltip.Popup.Props, 'children' | 'ref'> {
  /**
   * The tooltip's words: a short label in sentence case that matches the trigger's accessible
   * name, such as "Zoom in". It takes the popup's inverse text colour.
   */
  children?: ReactNode
  /**
   * Required. The control the tooltip labels, such as an IconButton, rendered in place of the
   * tooltip. It must take a ref and spread the props it is given, as Perron's buttons do, and carry
   * its own accessible name.
   */
  trigger: ReactElement
  /**
   * Whether the tooltip is shown. Set it to control the tooltip, with `onOpen` and `onClose` to hear
   * when it asks to change; leave it out for a tooltip its trigger opens.
   */
  open?: boolean
  /**
   * Whether the tooltip is shown at first, when `open` is left out.
   * @default false
   */
  defaultOpen?: boolean
  /**
   * Called when the tooltip asks to open: `reason` in `details` is `'trigger-hover'` when the
   * pointer rests on the trigger or `'trigger-focus'` when the keyboard focuses it, and
   * `details.cancel()` keeps it closed.
   */
  onOpen?: (event: Event, details: ChangeDetails) => void
  /**
   * Called when the tooltip asks to close: `reason` is `'trigger-hover'`, `'trigger-focus'`,
   * `'trigger-press'`, `'escape-key'`, `'outside-press'` or another of Base UI's reasons, and
   * `details.cancel()` keeps it open.
   */
  onClose?: (
    event: Event,
    reason: BaseTooltip.Root.ChangeEventReason,
    details: ChangeDetails,
  ) => void
  /** Reaches the root, the popup. */
  ref?: Ref<HTMLDivElement>
  /** Props for each inner part, merged with the part's own, which win. */
  slotProps?: {
    /** Props for the `trigger` part, such as `delay` or `closeOnClick`. */
    trigger?: BaseTooltip.Trigger.Props
    /** Props for the `portal` part, such as its `container`. */
    portal?: BaseTooltip.Portal.Props
    /**
     * Props for the `positioner` part, such as `side`, `align` or `sideOffset`. Its `sideOffset`
     * and `collisionPadding` replace Tooltip's defaults.
     */
    positioner?: BaseTooltip.Positioner.Props
  }
}

/** A short visual label beside a control, such as "Zoom in" over an icon-only button. */
export function Tooltip({
  children,
  trigger,
  open,
  defaultOpen = false,
  onOpen,
  onClose,
  slotProps,
  className,
  ref,
  ...rest
}: TooltipProps) {
  const generatedId = useId()
  const positioner = slotProps?.positioner
  const defaults = positionerOffsets()

  // CR-4: Base UI's one handler becomes MUI's two
  const handleOpenChange = (next: boolean, details: ChangeDetails) => {
    if (next) onOpen?.(details.event, details)
    else onClose?.(details.event, details.reason, details)
  }

  // CR-5: the trigger's id tells Base UI what the popup sits against, for a tooltip open at first
  // render or controlled
  const triggerId = (trigger.props as { id?: string }).id ?? slotProps?.trigger?.id ?? generatedId
  const triggerLink = open === undefined ? { defaultTriggerId: triggerId } : { triggerId }

  return (
    <BaseTooltip.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={handleOpenChange}
      {...triggerLink}
    >
      <BaseTooltip.Trigger
        {...mergeProps<typeof BaseTooltip.Trigger>(slotProps?.trigger, {
          render: trigger,
          id: triggerId,
        })}
        className={withClass('pn-Tooltip-trigger', slotProps?.trigger?.className)}
      />
      <BaseTooltip.Portal
        {...mergeProps<typeof BaseTooltip.Portal>(slotProps?.portal, undefined)}
        className={withClass('pn-Tooltip-portal', slotProps?.portal?.className)}
      >
        <BaseTooltip.Positioner
          // CR-6: the caller's props, then the defaults where it gives none
          {...mergeProps<typeof BaseTooltip.Positioner>(positioner, {
            sideOffset: positioner?.sideOffset ?? defaults.sideOffset,
            collisionPadding: positioner?.collisionPadding ?? defaults.collisionPadding,
          })}
          className={withClass('pn-Tooltip-positioner', positioner?.className)}
        >
          <BaseTooltip.Popup {...rest} ref={ref} className={withClass('pn-Tooltip', className)}>
            {children}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  )
}
