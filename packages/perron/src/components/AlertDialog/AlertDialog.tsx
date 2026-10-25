'use client'
// AlertDialog: a modal question over the map and a scrim, on Base UI's AlertDialog, that one of its
// actions or Esc answers. It moves focus to the first action, Cancel, wraps Tab inside the popup
// while focus is in it, and on close gives focus back to the button that opened it. One component
// that takes its words and controls as props and renders every Base UI part itself, the popup as
// its root. The spec is docs/components/alert-dialog.md.
import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog'
import { mergeProps } from '@base-ui/react/merge-props'
import { useId } from 'react'
import type { CSSProperties, ReactElement, ReactNode, Ref } from 'react'
import { classes, withClass } from '../../internal/nodes.ts'
import './AlertDialog.css'

export interface AlertDialogProps extends Omit<
  BaseAlertDialog.Popup.Props,
  'children' | 'title' | 'className' | 'style' | 'ref'
> {
  /**
   * The question, in sentence case, such as "Clear all filters?". Required: it names the alert
   * dialog for screen readers.
   */
  title: ReactNode
  /**
   * One sentence under the title that says what answering does, such as "The map shows every line
   * again.", read out with the name when it opens. Required. Phrasing content only: it renders in a
   * `<p>`.
   */
  description: ReactNode
  /**
   * The buttons that answer the question, such as Buttons, in a row at the alert dialog's end:
   * Cancel first, which takes focus when it opens, and the confirming action last. An action closes
   * the alert dialog by setting `open` to `false`, which calls no `onClose`. Required: with no close
   * button, Cancel is the way out for touch screen readers.
   */
  actions: ReactNode
  /**
   * The element that opens the alert dialog, such as a Button, rendered in place of the alert
   * dialog. Focus returns to it when the alert dialog closes. Leave it out for an alert dialog opened
   * only through `open`.
   */
  trigger?: ReactElement
  /**
   * Whether the alert dialog is open. Set it to control the alert dialog, with `onClose` to hear when
   * it asks to close. An alert dialog whose actions must close it is controlled with `open`: a button
   * in `actions` closes it only by setting `open` to `false`.
   */
  open?: boolean
  /**
   * Whether the alert dialog is open at first, when `open` is left out. Uncontrolled, its actions cannot
   * close it, since they close it through `open`: it closes by Esc, or by Enter or Space on the trigger,
   * which Shift+Tab reaches after a press on the backdrop among the page's other tabbable elements
   * before the portal, so an alert dialog whose actions must close it is controlled with `open` instead.
   * @default false
   */
  defaultOpen?: boolean
  /**
   * Called when the alert dialog asks to open, from its trigger. `details` is Base UI's, with its
   * `reason` and `cancel()`.
   */
  onOpen?: (event: Event, details: BaseAlertDialog.Root.ChangeEventDetails) => void
  /**
   * Called when the alert dialog asks to close, by Esc, with `reason` `'escape-key'`, or by Enter or
   * Space on the trigger, which Shift+Tab reaches after a press on the backdrop among the page's other
   * tabbable elements before the portal, with `'trigger-press'`; `details.cancel()` keeps it open. A
   * button in `actions` closes it through `open` and calls no `onClose`.
   */
  onClose?: (
    event: Event,
    reason: BaseAlertDialog.Root.ChangeEventReason,
    details: BaseAlertDialog.Root.ChangeEventDetails,
  ) => void
  /** Reaches the root, the popup. Merged after `pn-AlertDialog`. */
  className?: string
  /** Reaches the root, the popup. */
  style?: CSSProperties
  /** Reaches the root, the popup. */
  ref?: Ref<HTMLDivElement>
  /** Props for each inner part, merged with the part's own, which win. */
  slotProps?: {
    /** Props for the `trigger` part, such as `nativeButton={false}` when `trigger` is not a `<button>`. */
    trigger?: BaseAlertDialog.Trigger.Props
    /** Props for the `portal` part, such as its `container`. */
    portal?: BaseAlertDialog.Portal.Props
    /** Props for the `backdrop` part. */
    backdrop?: BaseAlertDialog.Backdrop.Props
    /** Props for the `title` part, such as `render={<h1 />}` for another heading level. */
    title?: BaseAlertDialog.Title.Props
    /** Props for the `description` part. */
    description?: BaseAlertDialog.Description.Props
  }
}

/** A modal question that one of its actions or Esc answers, over the map and a scrim. */
export function AlertDialog({
  title,
  description,
  actions,
  trigger,
  open,
  defaultOpen = false,
  onOpen,
  onClose,
  className,
  style,
  ref,
  slotProps,
  ...rest
}: AlertDialogProps) {
  const generatedId = useId()

  // CR-4: Base UI's one handler becomes MUI's two
  const handleOpenChange = (next: boolean, details: BaseAlertDialog.Root.ChangeEventDetails) => {
    if (next) onOpen?.(details.event, details)
    else onClose?.(details.event, details.reason, details)
  }

  // CR-5: the trigger's id tells Base UI where focus returns, for an alert dialog open at first
  // render or controlled
  const triggerId = trigger
    ? ((trigger.props as { id?: string }).id ?? slotProps?.trigger?.id ?? generatedId)
    : undefined
  const triggerLink = triggerId
    ? open === undefined
      ? { defaultTriggerId: triggerId }
      : { triggerId }
    : {}

  // CR-2: the title, the description and the caller's actions, in reading order; no close button
  return (
    <BaseAlertDialog.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={handleOpenChange}
      {...triggerLink}
    >
      {trigger ? (
        <BaseAlertDialog.Trigger
          {...mergeProps<typeof BaseAlertDialog.Trigger>(slotProps?.trigger, {
            render: trigger,
            id: triggerId,
          })}
          className={withClass('pn-AlertDialog-trigger', slotProps?.trigger?.className)}
        />
      ) : null}
      <BaseAlertDialog.Portal
        {...slotProps?.portal}
        className={withClass('pn-AlertDialog-portal', slotProps?.portal?.className)}
      >
        <BaseAlertDialog.Backdrop
          {...slotProps?.backdrop}
          className={withClass('pn-AlertDialog-backdrop', slotProps?.backdrop?.className)}
        />
        <BaseAlertDialog.Popup
          {...rest}
          ref={ref}
          style={style}
          className={classes('pn-AlertDialog', className)}
        >
          <BaseAlertDialog.Title
            {...slotProps?.title}
            className={withClass('pn-AlertDialog-title', slotProps?.title?.className)}
          >
            {title}
          </BaseAlertDialog.Title>
          <BaseAlertDialog.Description
            {...slotProps?.description}
            className={withClass('pn-AlertDialog-description', slotProps?.description?.className)}
          >
            {description}
          </BaseAlertDialog.Description>
          {/* CR-6: the caller's buttons as given, with nothing of AlertDialog's around them */}
          <div className="pn-AlertDialog-actions">{actions}</div>
        </BaseAlertDialog.Popup>
      </BaseAlertDialog.Portal>
    </BaseAlertDialog.Root>
  )
}
