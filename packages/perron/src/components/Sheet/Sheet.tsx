// Sheet: a panel that slides in from an edge of the screen and floats over the map, on Base UI's
// Drawer. A side sheet on a wide screen, a bottom sheet with snap points on a phone; non-modal by
// default, so the map beside it stays usable. Spec: docs/components/sheet.md.
import { Drawer } from '@base-ui/react/drawer'
import { mergeProps } from '@base-ui/react/merge-props'
import { useCallback, useState } from 'react'
import type { ReactElement, ReactNode, Ref } from 'react'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import { withClass } from '../../internal/nodes.ts'
import { CloseButton } from '../../parts/CloseButton/CloseButton.tsx'
import './Sheet.css'

type ChangeDetails = Drawer.Root.ChangeEventDetails
type SnapPointDetails = Drawer.Root.SnapPointChangeEventDetails

/** The edge a sheet slides from, and the swipe that dismisses it (CR-3). */
const SWIPE = { left: 'left', right: 'right', bottom: 'down' } as const

/** Full height alone: the snap points while there is no peek to read. */
const FULL_HEIGHT: Drawer.Root.SnapPoint[] = [1]

/** The peek, a `px` string from `size.sheet-peek`, then full height; read once and kept (CR-9). */
let withPeek: Drawer.Root.SnapPoint[] | undefined

/**
 * A bottom sheet's snap points when the caller gives none: the peek, then full height (CR-9). The
 * peek is read from its custom property when the first bottom sheet renders, and the array is kept,
 * so every render passes Base UI the same one. With no document, as on a server, or no token
 * stylesheet yet, there is no peek to read, and the sheet snaps to full height alone until there is.
 */
function defaultSnapPoints(): Drawer.Root.SnapPoint[] {
  if (withPeek === undefined && typeof document !== 'undefined') {
    const peek = getComputedStyle(document.documentElement)
      .getPropertyValue('--perron-size-sheet-peek')
      .trim()
    if (peek) withPeek = [peek, 1]
  }
  return withPeek ?? FULL_HEIGHT
}

export interface SheetProps extends Omit<Drawer.Popup.Props, 'children' | 'title'> {
  /**
   * The edge the sheet slides from and is swiped back to: `left` for the overview sheet, `right`
   * for the detail panel, `bottom` for either on a phone. It sets `data-anchor` on the root and the
   * viewport.
   * @default 'left'
   */
  anchor?: 'left' | 'right' | 'bottom'
  /**
   * The sheet's name, such as a stop or a destination, shown in the header and naming the dialog.
   * Required, so every sheet draws its header with the title and the close button and is always
   * named; a pattern with a header of its own (DetailPanel) passes its name as `title` and the rest
   * of its header in `children`.
   * @default Required
   */
  title: ReactNode
  /** The sheet's body, below the header. It scrolls when it is taller than the sheet. */
  children?: ReactNode
  /**
   * The button that opens the sheet, such as a Perron `Button`; it gets the trigger's ARIA and gets
   * focus back on close. Without one, the sheet opens through `open`.
   */
  trigger?: ReactElement
  /** Whether the sheet is open, for a controlled sheet. */
  open?: boolean
  /**
   * Whether the sheet starts open, for an uncontrolled sheet.
   * @default false
   */
  defaultOpen?: boolean
  /** Called when the sheet asks to open: from the trigger. */
  onOpen?: (event: ChangeDetails['event'], details: ChangeDetails) => void
  /**
   * Called when the sheet asks to close, with Base UI's reason: `escape-key`, `close-press`,
   * `outside-press`, `swipe`, `trigger-press`, `focus-out`, `close-watcher`, `imperative-action` or
   * `none`. `details.cancel()` keeps it open.
   */
  onClose?: (
    event: ChangeDetails['event'],
    reason: Drawer.Root.ChangeEventReason,
    details: ChangeDetails,
  ) => void
  /**
   * Whether the sheet shuts out the rest of the page: focus trapped, the page's scroll locked, a
   * scrim behind, closed by a press outside. Non-modal by default, so the map stays usable beside
   * it; while non-modal it sets `disablePointerDismissal`, so a press on the map or focus leaving
   * the sheet doesn't close it, and renders no backdrop.
   * @default false
   */
  modal?: boolean
  /**
   * The heights a bottom sheet snaps to: a fraction of the viewport from 0 to 1, pixels above 1, or
   * a `px` or `rem` string. Ignored on a side sheet. A bottom sheet with no `snapPoints` snaps to
   * `size.sheet-peek` and to full height, `1`, starting at the peek.
   * @default With anchor 'bottom': size.sheet-peek and 1
   */
  snapPoints?: Drawer.Root.SnapPoint[]
  /** The snap point a bottom sheet is at, for a controlled snap point. */
  snapPoint?: Drawer.Root.SnapPoint | null
  /**
   * The snap point a bottom sheet opens at, for an uncontrolled snap point.
   * @default The first snap point
   */
  defaultSnapPoint?: Drawer.Root.SnapPoint | null
  /**
   * Called when a bottom sheet asks to move to another snap point, by a swipe. It takes MUI's
   * shape, `(event, snapPoint, details)`, with `event` being `details.event`.
   */
  onSnapPointChange?: (
    event: SnapPointDetails['event'],
    snapPoint: Drawer.Root.SnapPoint | null,
    details: SnapPointDetails,
  ) => void
  /**
   * Overrides "Close", the close button's label.
   * @default The locale's
   */
  closeLabel?: string
  /** Props for the inner parts, each merged with what the sheet sets on that part. */
  slotProps?: {
    /** Props for the `trigger` part */
    trigger?: Drawer.Trigger.Props
    /** Props for the `portal` part */
    portal?: Drawer.Portal.Props
    /** Props for the `backdrop` part */
    backdrop?: Drawer.Backdrop.Props
    /** Props for the `viewport` part */
    viewport?: Drawer.Viewport.Props
    /** Props for the `title` part */
    title?: Drawer.Title.Props
    /** Props for the `close` part */
    close?: Drawer.Close.Props
    /** Props for the `content` part */
    content?: Drawer.Content.Props
  }
}

/** Points the caller's ref at the node, and returns what undoes it when the node goes. */
function setRef<T>(ref: Ref<T> | undefined, node: T): () => void {
  if (typeof ref === 'function') {
    const cleanup = ref(node)
    return typeof cleanup === 'function' ? cleanup : () => ref(null)
  }
  if (ref) {
    ref.current = node
    return () => {
      ref.current = null
    }
  }
  return () => {}
}

/**
 * Whether the body overflows, its `scrollHeight` greater than its `clientHeight`, so it takes a Tab
 * stop only while it scrolls. A `ResizeObserver` watches the body, whose box a snap point resizes,
 * and each block in it, whose height its words change; the blocks are watched again when the
 * caller's children change. Returns the flag and the ref for `Drawer.Content`, which also sets the
 * caller's own `slotProps.content.ref`, since `mergeProps` merges no refs.
 */
function useOverflowing(theirs: Ref<HTMLDivElement> | undefined) {
  const [overflowing, setOverflowing] = useState(false)
  const ref = useCallback(
    (node: HTMLDivElement) => {
      const unset = setRef(theirs, node)
      const measure = () => setOverflowing(node.scrollHeight > node.clientHeight)
      // measured on attach too, so a body that overflows from the start has its Tab stop at once
      measure()
      if (typeof ResizeObserver === 'undefined') return unset
      const resize = new ResizeObserver(measure)
      const watch = () => {
        resize.disconnect()
        resize.observe(node)
        for (const block of node.children) resize.observe(block)
      }
      const blocks = new MutationObserver(watch)
      watch()
      blocks.observe(node, { childList: true })
      return () => {
        blocks.disconnect()
        resize.disconnect()
        unset()
      }
    },
    [theirs],
  )
  return [overflowing, ref] as const
}

/** A panel that slides in from an edge and floats over the map. */
export function Sheet({
  anchor = 'left',
  title,
  children,
  trigger,
  open,
  defaultOpen = false,
  onOpen,
  onClose,
  modal = false,
  snapPoints,
  snapPoint,
  defaultSnapPoint,
  onSnapPointChange,
  closeLabel,
  slotProps,
  ref,
  className,
  ...rest
}: SheetProps) {
  const strings = useOwnedStrings({ close: closeLabel })
  const [overflowing, contentRef] = useOverflowing(slotProps?.content?.ref)
  const bottom = anchor === 'bottom'
  const points = bottom ? (snapPoints ?? defaultSnapPoints()) : []

  const handleOpenChange = (next: boolean, details: ChangeDetails) => {
    if (next) onOpen?.(details.event, details)
    else onClose?.(details.event, details.reason, details)
  }

  // CR-9: the snap point props reach the root only for a bottom sheet
  const snap = bottom
    ? {
        snapPoints: points,
        snapPoint,
        defaultSnapPoint: defaultSnapPoint === undefined ? points[0] : defaultSnapPoint,
        onSnapPointChange: onSnapPointChange
          ? (point: Drawer.Root.SnapPoint | null, details: SnapPointDetails) =>
              onSnapPointChange(details.event, point, details)
          : undefined,
      }
    : {}

  return (
    <Drawer.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={handleOpenChange}
      modal={modal}
      disablePointerDismissal={!modal}
      swipeDirection={SWIPE[anchor]}
      {...snap}
    >
      {trigger ? (
        <Drawer.Trigger
          {...mergeProps<typeof Drawer.Trigger>(slotProps?.trigger, { render: trigger })}
        />
      ) : null}
      <Drawer.Portal {...mergeProps<typeof Drawer.Portal>(slotProps?.portal, undefined)}>
        {modal ? (
          <Drawer.Backdrop
            {...mergeProps<typeof Drawer.Backdrop>(slotProps?.backdrop, undefined)}
            className={withClass('pn-Sheet-backdrop', slotProps?.backdrop?.className)}
          />
        ) : null}
        <Drawer.Viewport
          {...mergeProps<typeof Drawer.Viewport>(slotProps?.viewport, undefined)}
          className={withClass('pn-Sheet-viewport', slotProps?.viewport?.className)}
          data-anchor={anchor}
        >
          <Drawer.Popup
            {...rest}
            ref={ref}
            className={withClass('pn-Sheet', className)}
            data-anchor={anchor}
          >
            <div className="pn-Sheet-header">
              <Drawer.Title
                {...mergeProps<typeof Drawer.Title>(slotProps?.title, undefined)}
                className={withClass('pn-Sheet-title', slotProps?.title?.className)}
              >
                {title}
              </Drawer.Title>
              <Drawer.Close
                {...mergeProps<typeof Drawer.Close>(slotProps?.close, {
                  render: <CloseButton label={strings.close} />,
                })}
                className={withClass('pn-Sheet-close', slotProps?.close?.className)}
              />
            </div>
            <Drawer.Content
              // a Tab stop only while it scrolls, so a body taller than the sheet scrolls from the
              // keyboard too; the sheet's own props come last (CR-2)
              {...mergeProps<typeof Drawer.Content>(
                slotProps?.content,
                overflowing ? { tabIndex: 0 } : undefined,
              )}
              ref={contentRef}
              className={withClass('pn-Sheet-content', slotProps?.content?.className)}
            >
              {children}
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
