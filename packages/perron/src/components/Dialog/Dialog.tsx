// Dialog: a modal panel over the map and a scrim, on Base UI's Dialog. It holds focus until it
// closes, then gives it back to the button that opened it. One component that takes its words and
// controls as props and renders every Base UI part itself, the popup as its root. The spec is
// docs/components/dialog.md.
import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import { mergeProps } from '@base-ui/react/merge-props'
import { useId } from 'react'
import type { CSSProperties, ReactElement, ReactNode, Ref } from 'react'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import { CloseButton } from '../../parts/CloseButton/CloseButton.tsx'
import './Dialog.css'

type ChangeDetails = BaseDialog.Root.ChangeEventDetails

/**
 * Whether a node renders anything: `null`, `undefined`, a boolean, `''` and an array of only such
 * values render nothing, so their part is left out, as in EmptyState.
 */
const rendersSomething = (node: ReactNode): boolean =>
  Array.isArray(node)
    ? node.some(rendersSomething)
    : node != null && typeof node !== 'boolean' && node !== ''

export interface DialogProps extends Omit<
  BaseDialog.Popup.Props,
  'children' | 'title' | 'className' | 'style' | 'ref'
> {
  /**
   * The dialog's title, in sentence case, such as "Keys". Required: it names the dialog for screen
   * readers.
   */
  title: ReactNode
  /**
   * One sentence under the title that says what the dialog is for, read out with its name when it
   * opens. Phrasing content only: it renders in a `<p>`.
   */
  description?: ReactNode
  /** The dialog's body, under the description: sentences, a list or controls. */
  children?: ReactNode
  /**
   * The dialog's actions, such as Buttons, in a row at its end, the main action last. An action
   * that closes the dialog sets `open` to `false`.
   */
  actions?: ReactNode
  /**
   * The element that opens the dialog, such as a Button, rendered in place of the dialog. Focus
   * returns to it when the dialog closes. Leave it out for a dialog opened only through `open`.
   */
  trigger?: ReactElement
  /**
   * Whether the dialog is open. Set it to control the dialog, with `onClose` to hear when it asks to
   * close; leave it out for a dialog its trigger opens.
   */
  open?: boolean
  /**
   * Whether the dialog is open at first, when `open` is left out.
   * @default false
   */
  defaultOpen?: boolean
  /**
   * Called when the dialog asks to open, from its trigger. `details` is Base UI's, with its
   * `reason` and `cancel()`.
   */
  onOpen?: (event: Event, details: ChangeDetails) => void
  /**
   * Called when the dialog asks to close: `reason` is `'escape-key'`, `'outside-press'`,
   * `'close-press'` or another of Base UI's reasons, and `details.cancel()` keeps it open.
   */
  onClose?: (
    event: Event,
    reason: BaseDialog.Root.ChangeEventReason,
    details: ChangeDetails,
  ) => void
  /**
   * Overrides "Close", the close button's name.
   * @default The locale's
   */
  closeLabel?: string
  /** Reaches the root, the popup. Merged after `pn-Dialog`. */
  className?: string
  /** Reaches the root, the popup. */
  style?: CSSProperties
  /** Reaches the root, the popup. */
  ref?: Ref<HTMLDivElement>
  /** Props for each inner part, merged with the part's own, which win. */
  slotProps?: {
    /** Props for the `trigger` part, such as `nativeButton={false}` when `trigger` is not a `<button>`. */
    trigger?: BaseDialog.Trigger.Props
    /** Props for the `portal` part, such as its `container`. */
    portal?: BaseDialog.Portal.Props
    /** Props for the `backdrop` part. */
    backdrop?: BaseDialog.Backdrop.Props
    /** Props for the `title` part, such as `render={<h1 />}` for another heading level. */
    title?: BaseDialog.Title.Props
    /** Props for the `description` part. */
    description?: BaseDialog.Description.Props
    /** Props for the `close` part, all but `disabled`: the close button is never disabled. */
    close?: Omit<BaseDialog.Close.Props, 'disabled'>
  }
}

/**
 * Base UI's `className`: a string, or a function of the part's state. `mergeProps` joins strings
 * only, so each part's class is set after the merge, by `withClass`.
 */
type ClassName<State> = string | ((state: State) => string | undefined) | undefined

/** The part's own class first, then the caller's, whether the caller's is a string or a function. */
function withClass<State>(own: string, theirs: ClassName<State>): ClassName<State> {
  if (typeof theirs === 'function') return (state) => join(own, theirs(state))
  return join(own, theirs)
}

const join = (own: string, theirs: string | undefined) => (theirs ? `${own} ${theirs}` : own)

/** A modal panel that asks one question or gives help, over the map and a scrim. */
export function Dialog({
  title,
  description,
  children,
  actions,
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
}: DialogProps) {
  const strings = useOwnedStrings({ close: closeLabel })
  const generatedId = useId()

  // CR-4: Base UI's one handler becomes MUI's two
  const handleOpenChange = (next: boolean, details: ChangeDetails) => {
    if (next) onOpen?.(details.event, details)
    else onClose?.(details.event, details.reason, details)
  }

  // CR-5: the trigger's id tells Base UI where focus returns, for a dialog open at first render or
  // controlled
  const triggerId = trigger
    ? ((trigger.props as { id?: string }).id ?? slotProps?.trigger?.id ?? generatedId)
    : undefined
  const triggerLink = triggerId
    ? open === undefined
      ? { defaultTriggerId: triggerId }
      : { triggerId }
    : {}

  return (
    <BaseDialog.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={handleOpenChange}
      {...triggerLink}
    >
      {trigger ? (
        <BaseDialog.Trigger
          {...mergeProps<typeof BaseDialog.Trigger>(slotProps?.trigger, {
            render: trigger,
            id: triggerId,
          })}
          className={withClass('pn-Dialog-trigger', slotProps?.trigger?.className)}
        />
      ) : null}
      <BaseDialog.Portal
        {...mergeProps<typeof BaseDialog.Portal>(slotProps?.portal, undefined)}
        className={withClass('pn-Dialog-portal', slotProps?.portal?.className)}
      >
        <BaseDialog.Backdrop
          {...mergeProps<typeof BaseDialog.Backdrop>(slotProps?.backdrop, undefined)}
          className={withClass('pn-Dialog-backdrop', slotProps?.backdrop?.className)}
        />
        <BaseDialog.Popup
          {...rest}
          ref={ref}
          style={style}
          className={className ? `pn-Dialog ${className}` : 'pn-Dialog'}
        >
          <div className="pn-Dialog-header">
            <BaseDialog.Title
              {...mergeProps<typeof BaseDialog.Title>(slotProps?.title, undefined)}
              className={withClass('pn-Dialog-title', slotProps?.title?.className)}
            >
              {title}
            </BaseDialog.Title>
            <BaseDialog.Close
              {...mergeProps<typeof BaseDialog.Close>(slotProps?.close, {
                render: <CloseButton label={strings.close} />,
              })}
              className={withClass('pn-Dialog-close', slotProps?.close?.className)}
            />
          </div>
          {rendersSomething(description) ? (
            <BaseDialog.Description
              {...mergeProps<typeof BaseDialog.Description>(slotProps?.description, undefined)}
              className={withClass('pn-Dialog-description', slotProps?.description?.className)}
            >
              {description}
            </BaseDialog.Description>
          ) : null}
          {rendersSomething(children) ? <div className="pn-Dialog-content">{children}</div> : null}
          {rendersSomething(actions) ? <div className="pn-Dialog-actions">{actions}</div> : null}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  )
}
