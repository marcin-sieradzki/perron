// Sheet: a panel that slides in from an edge of the screen and floats over the map, on Base UI's
// Drawer. A side sheet on a wide screen, a bottom sheet with snap points on a phone; non-modal by
// default, so the map beside it stays usable. Spec: docs/components/sheet.md.
import { Drawer } from '@base-ui/react/drawer'
import { mergeProps } from '@base-ui/react/merge-props'
import type { ReactElement, ReactNode, Ref } from 'react'
import { numeric } from '@mylder/perron/tokens.ts'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import { CloseButton } from '../../parts/CloseButton/CloseButton.tsx'
import './Sheet.css'

type ChangeDetails = Drawer.Root.ChangeEventDetails
type SnapPointDetails = Drawer.Root.SnapPointChangeEventDetails

/** The edge a sheet slides from, and the swipe that dismisses it (CR-3). */
const SWIPE = { left: 'left', right: 'right', bottom: 'down' } as const

/** A bottom sheet's snap points when the caller gives none: the peek, then full height (CR-9). */
const DEFAULT_SNAP_POINTS: Drawer.Root.SnapPoint[] = [numeric['size.sheet-peek'], 1]

export interface SheetProps extends Omit<Drawer.Popup.Props, 'children' | 'title'> {
  /**
   * The edge the sheet slides from and is swiped back to: `left` for the overview sheet, `right`
   * for the detail panel, `bottom` for either on a phone. Named `anchor`, MUI Drawer's name; `top`
   * is left out until a screen needs it; it sets `data-anchor` on the root and the viewport.
   * @default 'left'
   */
  anchor?: 'left' | 'right' | 'bottom'
  /**
   * The sheet's name, such as a stop or a destination, shown in the header and naming the dialog.
   * Required, so every sheet draws its header with the title and the close button and is always
   * named; a pattern with a header of its own (DetailPanel) passes its name as `title` and the rest
   * of its header in `children`.
   */
  title: ReactNode
  /** The sheet's body, below the header. It scrolls when it is taller than the sheet. */
  children?: ReactNode
  /**
   * The button that opens the sheet, such as a Perron `Button`; it gets the trigger's ARIA and gets
   * focus back on close. Without one, the sheet opens through `open`. Rendered through
   * `Drawer.Trigger`'s `render`; Base UI's detached triggers (`handle`, `triggerId`,
   * `defaultTriggerId`), `actionsRef`, `onOpenChangeComplete` and `snapToSequentialPoints` stay out
   * until a screen needs them.
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
   * `size.sheet-peek` (read in script from `tokens.ts`) and to full height, `1`, starting at the
   * peek; `onSnapPointChange` takes MUI's shape, `(event, snapPoint, details)`, with `event` being
   * `details.event`.
   * @default With `anchor` `'bottom'`: `size.sheet-peek` and `1`
   */
  snapPoints?: Drawer.Root.SnapPoint[]
  /** The snap point a bottom sheet is at, for a controlled snap point. */
  snapPoint?: Drawer.Root.SnapPoint | null
  /**
   * The snap point a bottom sheet opens at, for an uncontrolled snap point.
   * @default The first snap point
   */
  defaultSnapPoint?: Drawer.Root.SnapPoint | null
  /** Called when a bottom sheet asks to move to another snap point, by a swipe. */
  onSnapPointChange?: (
    event: SnapPointDetails['event'],
    snapPoint: Drawer.Root.SnapPoint | null,
    details: SnapPointDetails,
  ) => void
  /** Overrides "Close", the close button's label. */
  closeLabel?: string
  /** The root element, the popup, for a ref to it. */
  ref?: Ref<HTMLDivElement>
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
  const bottom = anchor === 'bottom'
  const points = snapPoints ?? DEFAULT_SNAP_POINTS

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
              // focusable, so a body taller than the sheet scrolls from the keyboard too
              {...mergeProps<typeof Drawer.Content>({ tabIndex: 0 }, slotProps?.content)}
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
