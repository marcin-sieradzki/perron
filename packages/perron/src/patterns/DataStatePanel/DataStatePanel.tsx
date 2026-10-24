// DataStatePanel: holds a data view and shows the caller's content once its data is in, or in its
// place an EmptyState saying the data is loading, came back empty, or could not be loaded. A
// pattern: it builds on Perron's EmptyState and plain divs, never on Base UI.
// Spec: docs/patterns/data-state-panel.md.
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import type { ComponentPropsWithRef, ReactNode, Ref } from 'react'
import { EmptyState } from '../../components/EmptyState/EmptyState.tsx'
import type { EmptyStateProps } from '../../components/EmptyState/EmptyState.tsx'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import './DataStatePanel.css'

export interface DataStatePanelProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /**
   * Where the data view's data stands: `ready` shows `children`; `loading` says "Loading" while
   * there is no data yet; `empty` says the data came back with nothing in it; `error` says it
   * could not be loaded. Not a Prik data state
   */
  status?: 'ready' | 'loading' | 'empty' | 'error'
  /** The data view itself, such as a table or a chart, shown only while `status` is `'ready'` */
  children?: ReactNode
  /**
   * The sentence under the message in the empty and error statuses: why, and what to try. "Try
   * again in a minute." Not shown while loading or ready
   */
  description?: ReactNode
  /**
   * What the person can do about it in the empty and error statuses, such as a button that loads
   * the data again, below the sentence. Not shown while loading or ready
   */
  action?: ReactNode
  /**
   * Overrides "Loading", the message while `status` is `'loading'`
   * @default The locale's
   */
  loadingLabel?: string
  /**
   * Overrides "No data to show", the message while `status` is `'empty'`. Give it what is missing
   * when the caller knows: "No vehicles on line 5C right now"
   * @default The locale's
   */
  noDataLabel?: string
  /**
   * Overrides "Could not load the data", the message while `status` is `'error'`
   * @default The locale's
   */
  loadFailedLabel?: string
  /** Props for each inner part, merged with the part's own, which win */
  slotProps?: {
    /** Props for the `message` part */
    message?: ComponentPropsWithRef<'div'>
    /** Props for the `emptyState` part, the EmptyState: its `icon`, its `slotProps`, a `className` */
    emptyState?: Omit<EmptyStateProps, 'title' | 'children' | 'action'>
  }
}

/** The owned string each status but ready shows as the EmptyState's title (CR-3). */
const TITLE = { loading: 'loading', empty: 'noData', error: 'loadFailed' } as const

/** A part's class, then the caller's: joined, not replaced, the part's first (CR-5). */
const joinClass = (own: string, theirs: string | undefined) => (theirs ? `${own} ${theirs}` : own)

/** Sets a ref the caller gave, a callback or an object, to `node`. */
function setRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === 'function') ref(node)
  else if (ref) ref.current = node
}

/**
 * Holds a data view, such as a vehicle table or a day's chart, and shows it once its data is in,
 * or in its place a calm message while the data loads, when there is none, or when it could not
 * be loaded.
 */
export function DataStatePanel({
  status = 'ready',
  children,
  description,
  action,
  loadingLabel,
  noDataLabel,
  loadFailedLabel,
  slotProps,
  className,
  ...rest
}: DataStatePanelProps) {
  const strings = useOwnedStrings({
    loading: loadingLabel,
    noData: noDataLabel,
    loadFailed: loadFailedLabel,
  })
  const { ref: messageSlotRef, className: messageClass, ...messageSlot } = slotProps?.message ?? {}
  const { className: emptyStateClass, ...emptyStateSlot } = slotProps?.emptyState ?? {}

  const message = useRef<HTMLDivElement | null>(null)
  /** The element inside the message part that has focus, or had it until it left the document. */
  const focused = useRef<Element | null>(null)

  const messageRef = useCallback(
    (node: HTMLDivElement | null) => {
      message.current = node
      setRef(messageSlotRef, node)
    },
    [messageSlotRef],
  )

  // Remembers what has focus inside the message part. A blur that leaves the element in the
  // document is focus moving on, and forgets it; an element removed with focus on it is kept, for
  // the status change that removed it (CR-6). The check waits a microtask, past the commit.
  useEffect(() => {
    const node = message.current
    if (!node) return
    const onFocusIn = (event: FocusEvent) => {
      focused.current = event.target as Element
    }
    const onFocusOut = (event: FocusEvent) => {
      const target = event.target as Element
      queueMicrotask(() => {
        if (focused.current === target && target.isConnected) focused.current = null
      })
    }
    node.addEventListener('focusin', onFocusIn)
    node.addEventListener('focusout', onFocusOut)
    return () => {
      node.removeEventListener('focusin', onFocusIn)
      node.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  // CR-6: when a change of status removed the element that had focus inside the message part,
  // focus moves to the message part, never to the page's top. Never otherwise: not on mount.
  useLayoutEffect(() => {
    const node = message.current
    const last = focused.current
    if (!node || !last || last.isConnected) return
    focused.current = null
    const active = node.ownerDocument.activeElement
    if (!active || active === node.ownerDocument.body) node.focus()
  }, [status])

  const explained = status === 'empty' || status === 'error'

  return (
    <div {...rest} className={joinClass('pn-DataStatePanel', className)} data-status={status}>
      {/* CR-2: always rendered, first, a live region that announces each change of status */}
      <div
        {...messageSlot}
        ref={messageRef}
        className={joinClass('pn-DataStatePanel-message', messageClass)}
        role="status"
        tabIndex={-1}
      >
        {status !== 'ready' && (
          <EmptyState
            {...emptyStateSlot}
            className={joinClass('pn-DataStatePanel-emptyState', emptyStateClass)}
            title={strings[TITLE[status]]}
            action={explained ? action : undefined}
          >
            {explained ? description : undefined}
          </EmptyState>
        )}
      </div>
      {/* CR-1: the data view renders only once its data is in, outside the live region */}
      {status === 'ready' && children}
    </div>
  )
}
