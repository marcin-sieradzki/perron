// Popover: a small glass panel anchored to the button that opens it, on Base UI's Popover. It is
// never modal, so the map and the rest of the screen stay usable while it is open, and it gives
// focus back to its button when it closes. One component in Dialog's shape: it takes its words and
// trigger as props and renders every Base UI part itself, the popup as its root. The spec is
// docs/components/popover.md.
import { mergeProps } from '@base-ui/react/merge-props'
import { Popover as BasePopover } from '@base-ui/react/popover'
import { useId } from 'react'
import type { CSSProperties, ReactElement, ReactNode, Ref } from 'react'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import { given, withClass } from '../../internal/nodes.ts'
import { positionerOffsets } from '../../internal/tokens.ts'
import { CloseButton } from '../../parts/CloseButton/CloseButton.tsx'
import './Popover.css'

type ChangeDetails = BasePopover.Root.ChangeEventDetails

export interface PopoverProps extends Omit<
  BasePopover.Popup.Props,
  'children' | 'title' | 'className' | 'style' | 'ref'
> {
  /**
   * The popover's title, in sentence case, such as "About the data". Required: it names the
   * popover for screen readers.
   */
  title: ReactNode
  /**
   * One sentence under the title that says what the popover is for, read out with its name when it
   * opens. Phrasing content only: it renders in a `<p>`.
   */
  description?: ReactNode
  /** The popover's body, under the description: a few sentences or controls. */
  children?: ReactNode
  /**
   * The element that opens the popover, such as a Button, rendered in place of the popover; the
   * popover sits against it, and focus returns to it when the popover closes. Leave it out for a
   * popover opened only through `open`, placed by `slotProps.positioner.anchor`.
   */
  trigger?: ReactElement
  /**
   * Whether the popover is open. Set it to control the popover, with `onClose` to hear when it asks
   * to close; leave it out for a popover its trigger opens.
   */
  open?: boolean
  /**
   * Whether the popover is open at first, when `open` is left out.
   * @default false
   */
  defaultOpen?: boolean
  /**
   * Called when the popover asks to open, from its trigger. `details` is Base UI's, with its
   * `reason` and `cancel()`.
   */
  onOpen?: (event: Event, details: ChangeDetails) => void
  /**
   * Called when the popover asks to close: `reason` is `'escape-key'`, `'outside-press'`,
   * `'close-press'`, `'focus-out'` or another of Base UI's reasons, and `details.cancel()` keeps it
   * open.
   */
  onClose?: (
    event: Event,
    reason: BasePopover.Root.ChangeEventReason,
    details: ChangeDetails,
  ) => void
  /**
   * Overrides "Close", the close button's name.
   * @default The locale's
   */
  closeLabel?: string
  /** Reaches the root, the popup. Merged after `pn-Popover`. */
  className?: string
  /** Reaches the root, the popup. */
  style?: CSSProperties
  /** Reaches the root, the popup. */
  ref?: Ref<HTMLDivElement>
  /** Props for each inner part, merged with the part's own, which win. */
  slotProps?: {
    /** Props for the `trigger` part, such as `nativeButton={false}` when `trigger` is not a `<button>`. */
    trigger?: BasePopover.Trigger.Props
    /** Props for the `portal` part, such as its `container`. */
    portal?: BasePopover.Portal.Props
    /**
     * Props for the `positioner` part, such as `side`, `align` or `anchor`. Its `sideOffset` and
     * `collisionPadding` replace Popover's defaults.
     */
    positioner?: BasePopover.Positioner.Props
    /** Props for the `title` part, such as `render={<h3 />}` for another heading level. */
    title?: BasePopover.Title.Props
    /** Props for the `description` part. */
    description?: BasePopover.Description.Props
    /** Props for the `close` part, all but `disabled`: the close button is never disabled. */
    close?: Omit<BasePopover.Close.Props, 'disabled'>
  }
}

/** A small glass panel against the button that opens it, which leaves the screen usable. */
export function Popover({
  title,
  description,
  children,
  trigger,
  open,
  defaultOpen = false,
  onOpen,
  onClose,
  closeLabel,
  className,
  style,
  ref,
  slotProps,
  ...rest
}: PopoverProps) {
  const strings = useOwnedStrings({ close: closeLabel })
  const generatedId = useId()
  const positioner = slotProps?.positioner
  const defaults = positionerOffsets()

  // CR-4: Base UI's one handler becomes MUI's two
  const handleOpenChange = (next: boolean, details: ChangeDetails) => {
    if (next) onOpen?.(details.event, details)
    else onClose?.(details.event, details.reason, details)
  }

  // CR-5: the trigger's id tells Base UI what the popover sits against and where focus returns, for
  // a popover open at first render or controlled
  const triggerId = trigger
    ? ((trigger.props as { id?: string }).id ?? slotProps?.trigger?.id ?? generatedId)
    : undefined
  const triggerLink = triggerId
    ? open === undefined
      ? { defaultTriggerId: triggerId }
      : { triggerId }
    : {}

  return (
    <BasePopover.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={handleOpenChange}
      {...triggerLink}
    >
      {trigger ? (
        <BasePopover.Trigger
          {...mergeProps<typeof BasePopover.Trigger>(slotProps?.trigger, {
            render: trigger,
            id: triggerId,
          })}
          className={withClass('pn-Popover-trigger', slotProps?.trigger?.className)}
        />
      ) : null}
      <BasePopover.Portal
        {...mergeProps<typeof BasePopover.Portal>(slotProps?.portal, undefined)}
        className={withClass('pn-Popover-portal', slotProps?.portal?.className)}
      >
        <BasePopover.Positioner
          // CR-7: the caller's props, then the token defaults where it gives none
          {...mergeProps<typeof BasePopover.Positioner>(positioner, {
            sideOffset: positioner?.sideOffset ?? defaults.sideOffset,
            collisionPadding: positioner?.collisionPadding ?? defaults.collisionPadding,
          })}
          className={withClass('pn-Popover-positioner', positioner?.className)}
        >
          <BasePopover.Popup
            {...rest}
            ref={ref}
            style={style}
            className={className ? `pn-Popover ${className}` : 'pn-Popover'}
          >
            <div className="pn-Popover-header">
              <BasePopover.Title
                {...mergeProps<typeof BasePopover.Title>(slotProps?.title, undefined)}
                className={withClass('pn-Popover-title', slotProps?.title?.className)}
              >
                {title}
              </BasePopover.Title>
              <BasePopover.Close
                {...mergeProps<typeof BasePopover.Close>(slotProps?.close, {
                  render: <CloseButton label={strings.close} />,
                })}
                className={withClass('pn-Popover-close', slotProps?.close?.className)}
              />
            </div>
            {given(description) ? (
              <BasePopover.Description
                {...mergeProps<typeof BasePopover.Description>(slotProps?.description, undefined)}
                className={withClass('pn-Popover-description', slotProps?.description?.className)}
              >
                {description}
              </BasePopover.Description>
            ) : null}
            {given(children) ? <div className="pn-Popover-content">{children}</div> : null}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  )
}
