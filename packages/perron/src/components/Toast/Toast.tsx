// Toast: a short message that floats in at the bottom of the screen in Alert's look, confirms what
// just happened and leaves on its own. It renders nothing where it is written: while `open`, it
// keeps a toast in Base UI's list, which the region PerronProvider holds renders (ToastRegion.tsx).
// Spec: docs/components/toast.md.
import { Toast as BaseToast } from '@base-ui/react/toast'
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode, Ref, RefObject } from 'react'
import { useRender } from '@base-ui/react/use-render'
import { given } from '../../internal/nodes.ts'
import { ToastHost, useToastHosted } from './ToastRegion.tsx'
import type { ToastData, ToastView } from './ToastRegion.tsx'
import './Toast.css'

/** Why a toast closed itself. */
export type ToastCloseReason = 'close-press' | 'escape-key' | 'swipe' | 'timeout'

/** What `onClose` gets as its last argument: the reason and the event that closed the toast. */
export interface ToastCloseDetails {
  /** Why the toast closed: its close button, Esc, a swipe, or its time running out. */
  reason: ToastCloseReason
  /** The press's, the key's or the pointer's native event, or an `Event` of type `'timeout'`. */
  event: Event
}

export interface ToastProps extends Omit<
  BaseToast.Root.Props,
  'toast' | 'title' | 'color' | 'children' | 'ref'
> {
  /**
   * The intent: what the message means. `neutral` for a plain notice, `success` for something that
   * went well, `warning` for something to take care with, `danger` for something that failed,
   * `info` for something worth knowing; always in words that say it too. Set on the root as
   * `data-color`
   * @default 'neutral'
   */
  color?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
  /**
   * The message in a few words, which names the toast: "Link copied". Replaces the HTML `title`
   * attribute
   */
  title?: ReactNode
  /**
   * What happened, in a plain sentence, below the title: "Copy it from the address bar instead."
   * Without a `title`, it names the toast
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
   * What the person can do about it, such as a small outline Button "Undo", below the sentences.
   * With an action, the toast stays until it is closed, unless `autoHideDuration` is given
   */
  action?: ReactNode
  /**
   * Whether the toast is shown. It shows each time `open` turns `true` and leaves when it turns
   * `false`; once it closes itself, set `open` to `false` in `onClose`, so the next `true` shows it
   * again
   */
  open?: boolean
  /**
   * Whether the toast shows when it mounts, when `open` is left out. It closes itself and does not
   * show again
   * @default false
   */
  defaultOpen?: boolean
  /**
   * Called when the toast closes itself: `reason` is `'close-press'` for its close button,
   * `'escape-key'` for Esc, `'swipe'` for a swipe or `'timeout'` once `autoHideDuration` has
   * passed. Not called when `open` turns `false`
   */
  onClose?: (event: Event, reason: ToastCloseReason, details: ToastCloseDetails) => void
  /**
   * How long the toast shows, in milliseconds, before it hides itself; `null` keeps it until it is
   * closed. The time pauses while the pointer or the keyboard is in the region, or the window is in
   * the background
   * @default 5000, or null with an action
   */
  autoHideDuration?: number | null
  /**
   * Overrides "Close", the close button's name
   * @default The locale's
   */
  closeLabel?: string
  /** Reaches the root, the toast */
  ref?: Ref<HTMLDivElement>
  /** Props for each inner part, merged with the part's own, which win */
  slotProps?: {
    /** Props for the `icon` part */
    icon?: useRender.ComponentProps<'div'>
    /** Props for the `content` part */
    content?: BaseToast.Content.Props
    /** Props for the `title` part. Its `render` makes the title a heading: `render: <h3 />` */
    title?: BaseToast.Title.Props
    /** Props for the `description` part */
    description?: BaseToast.Description.Props
    /** Props for the `action` part */
    action?: useRender.ComponentProps<'div'>
    /**
     * Props for the `close` part, the `CloseButton`, all but `disabled`: the close button is never
     * disabled
     */
    close?: Omit<BaseToast.Close.Props, 'children' | 'disabled'>
  }
}

/** The list's own calls, which a Toast reaches through the child below it. */
type Manager = Pick<
  ReturnType<typeof BaseToast.useToastManager<ToastData>>,
  'add' | 'close' | 'update'
>

/**
 * CR-5: reads the list's calls inside the provider and hands them to the Toast above, before its
 * effects run. It re-renders with the list; the Toast does not, so no change to the list loops back
 * into another.
 */
function ManagerBridge({ manager }: { manager: RefObject<Manager | null> }) {
  const { add, close, update } = BaseToast.useToastManager<ToastData>()
  useLayoutEffect(() => {
    manager.current = { add, close, update }
  }, [manager, add, close, update])
  return null
}

/**
 * A short message that floats in at the bottom of the screen to confirm what just happened, such
 * as "Link copied", and leaves again on its own after a few seconds.
 */
export function Toast({
  color = 'neutral',
  open,
  defaultOpen = false,
  onClose,
  autoHideDuration,
  ...view
}: ToastProps) {
  const id = useId()
  const hosted = useToastHosted()
  const manager = useRef<Manager | null>(null)
  const [initiallyOpen] = useState(defaultOpen)
  const shown = open ?? initiallyOpen
  // CR-5: 5000 ms, none with an action, and Base UI's 0 for null
  const timeout =
    (autoHideDuration === undefined ? (given(view.action) ? null : 5000) : autoHideDuration) ?? 0

  /** Where the toast is: not in the list, in it, or closed by itself while `open` stayed true. */
  const phase = useRef<'closed' | 'open' | 'closedItself'>('closed')
  /** A close Toast asked for itself, which calls no onClose (CR-6). */
  const ownClose = useRef(false)
  const recorded = useRef<ToastCloseDetails | undefined>(undefined)
  const onCloseRef = useRef(onClose)
  const lastTimeout = useRef(timeout)

  useLayoutEffect(() => {
    onCloseRef.current = onClose
  })

  // CR-6: the reason, kept until the handlers of this one event have run
  const record = useCallback<ToastData['record']>((reason, event) => {
    recorded.current = { reason, event }
    queueMicrotask(() => {
      recorded.current = undefined
    })
  }, [])

  const handleClose = useCallback(() => {
    if (ownClose.current) {
      ownClose.current = false
      return
    }
    phase.current = 'closedItself'
    const details = recorded.current ?? { reason: 'timeout', event: new Event('timeout') }
    recorded.current = undefined
    onCloseRef.current?.(details.event, details.reason, details)
  }, [])

  // CR-5: add on the edge to open, close on the edge to shut, and keep the toast's data current
  useEffect(() => {
    const list = manager.current
    if (!list) return
    const toastView: ToastView = { ...view, color }
    const data: ToastData = { view: toastView, record }
    if (!shown) {
      if (phase.current === 'open') {
        ownClose.current = true
        list.close(id)
      }
      phase.current = 'closed'
      return
    }
    if (phase.current === 'closed') {
      phase.current = 'open'
      lastTimeout.current = timeout
      list.add({
        id,
        title: view.title,
        description: view.children,
        timeout,
        onClose: handleClose,
        data,
      })
    } else if (phase.current === 'open') {
      const retimed = timeout !== lastTimeout.current
      lastTimeout.current = timeout
      list.update(id, {
        title: view.title,
        description: view.children,
        data,
        ...(retimed ? { timeout } : {}),
      })
    }
  })

  // CR-5: a Toast that unmounts while open takes its toast with it, calling no onClose
  useEffect(
    () => () => {
      if (phase.current !== 'open') return
      ownClose.current = true
      phase.current = 'closed'
      manager.current?.close(id)
    },
    [id],
  )

  const bridge = <ManagerBridge manager={manager} />
  // CR-2: with no PerronProvider around it, a Toast brings a provider and a region of its own
  return hosted ? bridge : <ToastHost>{bridge}</ToastHost>
}
