// Alert: a message set into the page, in one of the intents' tinted colours, with an optional title,
// an action and a close button. No Base UI component has behaviour for it, so every part but the
// close button renders through useRender, and the close button is the CloseButton shared part.
// Spec: docs/components/alert.md.
import type { ComponentPropsWithRef, MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import { given } from '../../internal/nodes.ts'
import { usePart } from '../../internal/use-part.ts'
import { CloseButton } from '../../parts/CloseButton/CloseButton.tsx'
import { IntentIcon } from '../../parts/IntentIcon/IntentIcon.tsx'
import './Alert.css'

/** What `onClose` gets as its last argument: the reason and the press's native event. */
export interface AlertCloseDetails {
  /** Why the alert asks to close: its close button was pressed. */
  reason: 'close-press'
  /** The press's native event. */
  event: MouseEvent
}

export interface AlertProps extends Omit<
  useRender.ComponentProps<'div'>,
  'title' | 'children' | 'color' | 'onClose'
> {
  /**
   * The intent: what the message means. `neutral` for a plain notice, `success` for something that
   * went well, `warning` for something to take care with, `danger` for something that failed or
   * stops the task, `info` for something worth knowing; always in words that say it too. Set on
   * the root as `data-color`
   * @default 'neutral'
   */
  color?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
  /**
   * The message in a few words, above the sentences: "Signal fault at Danshøj". Replaces the HTML
   * `title` attribute
   */
  title?: ReactNode
  /**
   * What is happening and how sure we are, in plain sentences: "Trains between Flintholm and Ny
   * Ellebjerg run slower than planned. We don't know yet when the fault will be fixed."
   */
  children?: ReactNode
  /**
   * Replaces the intent's icon, for the eye only: it is hidden from screen readers. `null` or
   * `false` shows no icon; left out, the intent's own shows, and `neutral` has none. It renders at
   * 13 px, `icon.size.325`, so give an icon drawn on the 14 px grid, or set `--perron-icon-size` to
   * its step's `icon.size.*` through `slotProps.icon`
   */
  icon?: ReactNode
  /**
   * What the person can do about it, such as a small outline Button "Try again" or a LinkButton
   * "Show on map", below the sentences
   */
  action?: ReactNode
  /**
   * Called when the close button is pressed, with the reason `'close-press'`. Given, it shows the
   * close button; Alert never hides itself, so remove it here and move focus to the element before
   * it
   */
  onClose?: (event: MouseEvent, reason: 'close-press', details: AlertCloseDetails) => void
  /**
   * Overrides "Close", the close button's name
   * @default The locale's
   */
  closeLabel?: string
  /** Props for each inner part, merged with the part's own, which win */
  slotProps?: {
    /** Props for the `icon` part */
    icon?: useRender.ComponentProps<'div'>
    /** Props for the `content` part */
    content?: useRender.ComponentProps<'div'>
    /** Props for the `title` part. Its `render` makes the title a heading: `render: <h3 />` */
    title?: useRender.ComponentProps<'p'>
    /** Props for the `description` part */
    description?: useRender.ComponentProps<'div'>
    /** Props for the `action` part */
    action?: useRender.ComponentProps<'div'>
    /**
     * Props for the `close` part, the `CloseButton`, all but `disabled`: the close button is never
     * disabled. Its `onClick` runs after `onClose`
     */
    close?: Omit<ComponentPropsWithRef<'button'>, 'children' | 'disabled'>
  }
}

/**
 * A message set into the page, such as a panel or a sheet, that says in plain sentences what is
 * happening and how much it matters, with an optional title, an action and a close button.
 */
export function Alert({
  color = 'neutral',
  title,
  children,
  icon,
  action,
  onClose,
  closeLabel,
  render,
  slotProps,
  ref,
  ...rest
}: AlertProps) {
  const strings = useOwnedStrings({ close: closeLabel })

  // CR-3: the caller's icon when given, the intent's when left out, and no part when there is none
  const iconNode = icon === undefined ? <IntentIcon color={color} /> : icon
  const iconPart = usePart(
    'div',
    slotProps?.icon,
    // CR-5: aria-hidden after the caller's, so the icon never speaks
    { className: 'pn-Alert-icon', 'aria-hidden': true, children: iconNode },
    icon === undefined ? color !== 'neutral' : given(icon),
  )
  const titlePart = usePart(
    'p',
    slotProps?.title,
    { className: 'pn-Alert-title', children: title },
    given(title),
  )
  const descriptionPart = usePart(
    'div',
    slotProps?.description,
    { className: 'pn-Alert-description', children },
    given(children),
  )
  const actionPart = usePart(
    'div',
    slotProps?.action,
    { className: 'pn-Alert-action', children: action },
    given(action),
  )
  const contentPart = usePart('div', slotProps?.content, {
    className: 'pn-Alert-content',
    children: (
      <>
        {titlePart}
        {descriptionPart}
        {actionPart}
      </>
    ),
  })

  // CR-6, CR-7: the press only calls onClose. Alert's own props are merged last, so mergeProps runs
  // its onClick first and the caller's after it, and its class comes first in the string.
  const handleClose = (event: ReactMouseEvent<HTMLButtonElement>) => {
    const native = event.nativeEvent
    onClose?.(native, 'close-press', { reason: 'close-press', event: native })
  }
  const close = onClose ? (
    <CloseButton
      {...mergeProps<'button'>(slotProps?.close, {
        onClick: handleClose,
        className: 'pn-Alert-close',
      })}
      label={strings.close}
    />
  ) : null

  // CR-1, CR-8: the own props after the caller's, so data-color cannot be overwritten; the role is
  // status unless the caller gives one.
  const own = {
    className: 'pn-Alert',
    role: rest.role ?? 'status',
    'data-color': color,
    children: (
      <>
        {iconPart}
        {contentPart}
        {close}
      </>
    ),
  }
  return useRender({
    defaultTagName: 'div',
    render,
    ref,
    props: mergeProps<'div'>(rest, own),
  })
}
