// DetailPanel: the panel that opens on the right of the map when a rider picks a vehicle or a stop,
// and the bottom sheet it becomes on a phone: Perron's Sheet headed by Perron's DetailHeader, with
// the Sheet's close button at the end of the header row and the caller's details below. A pattern:
// Perron's components over React, never Base UI (CR-1). Spec: docs/patterns/detail-panel.md.
import { useId } from 'react'
import type { ComponentPropsWithRef, CSSProperties, ReactElement, ReactNode, Ref } from 'react'
import { Sheet } from '../../components/Sheet/Sheet.tsx'
import type { SheetProps } from '../../components/Sheet/Sheet.tsx'
// perron-allow(patterns): the registry's dependsOn names DetailHeader, a pattern, and CR-1 composes it; the contract does not yet say whether a pattern may compose another
import { DetailHeader, type DetailHeaderProps } from '../DetailHeader/DetailHeader.tsx'
import { classes } from '../../internal/nodes.ts'
import './DetailPanel.css'

type SheetSlots = NonNullable<SheetProps['slotProps']>

export interface DetailPanelProps extends Omit<ComponentPropsWithRef<'div'>, 'title' | 'children'> {
  /**
   * What the panel shows, as DetailHeader's `variant`: `line` for a vehicle or a line, headed by
   * its line badge and destination; `stop` for a stop or station, headed by its marker and name.
   * Set on the root as `data-variant`.
   * @default 'line'
   */
  variant?: 'line' | 'stop'
  /**
   * The line whose colours the header's mark takes, as DetailHeader's `line`: in `line`, the
   * badge's colours, needed with `lineName`; in `stop`, the marker's colour, left out for a stop
   * several lines serve.
   */
  line?: 'm1' | 'm2' | 'm3' | 'm4' | 'a' | 'b' | 'c' | 'e' | 'f' | 'h' | 'bus' | 'regional'
  /**
   * The line's short name as riders know it, "5C", "M2" or "A", as DetailHeader's `lineName`: the
   * badge's label in `line`, also read first in the title and so in the panel's name. Not used in
   * `stop`.
   */
  lineName?: ReactNode
  /**
   * The panel's title, as DetailHeader's `title`: the destination in `line` ("Husum Torv"), the
   * stop's name in `stop` ("Nørreport St."). Required. It names the panel's dialog, after the
   * line's name in `line`. Replaces the HTML `title` attribute.
   */
  title: ReactNode
  /**
   * One supporting line under the title, as DetailHeader's `subheader`, such as "Next stop:
   * Nørreport St." or the lines a stop has.
   */
  subheader?: ReactNode
  /**
   * The panel's own controls in its header row, before the close button, as DetailHeader's
   * `action`, such as a "Show on map" link. The close button is the panel's and needs no place
   * here.
   */
  action?: ReactNode
  /**
   * The panel's details, below the header row, set `space.300` apart in a column: for a vehicle
   * its StopTimeline and FactList, for a stop its Sections of departures. It scrolls when it is
   * taller than the panel. The body comes as free `children`, not as data such as a vehicle or a
   * stop that the panel lays out itself: a vehicle's panel and a stop's hold different patterns,
   * StopTimeline, FactList, DisruptionCard and Sections, which the screen composes, and the panel
   * is their frame, as Sheet is.
   */
  children?: ReactNode
  /**
   * The edge the panel slides from, as the Sheet's `anchor`: `right` beside the map on a wide
   * screen, `bottom` on a phone, under `breakpoint.phone`, which the screen picks. The panel takes
   * only `right` and `bottom`, with `right` the default, and not the Sheet's `left`: the
   * foundations put the detail panel on the right and the overview sheet on the left, so a `left`
   * detail panel would sit over the overview sheet.
   * @default 'right'
   */
  anchor?: 'right' | 'bottom'
  /**
   * Whether the panel is open, for a controlled panel, as the Sheet's `open`: the screen opens it
   * when the rider picks a vehicle or a stop.
   */
  open?: boolean
  /**
   * Whether the panel starts open, for an uncontrolled panel, as the Sheet's `defaultOpen`.
   * @default false
   */
  defaultOpen?: boolean
  /** Called when the panel asks to open, from its trigger, as the Sheet's `onOpen`. */
  onOpen?: SheetProps['onOpen']
  /**
   * Called when the panel asks to close, as the Sheet's `onClose`, with Base UI's reason:
   * `escape-key`, `close-press`, `swipe`, `trigger-press` and the rest the Sheet lists.
   * `details.cancel()` keeps it open. A controlled panel sets `open` to false here, and the screen
   * clears its selection.
   */
  onClose?: SheetProps['onClose']
  /**
   * The button that opens the panel, as the Sheet's `trigger`; it gets the trigger's ARIA and focus
   * back on close. Without one, the panel opens through `open`, as it does from the map.
   */
  trigger?: ReactElement
  /**
   * The heights a bottom panel snaps to, as the Sheet's `snapPoints`. Ignored with `anchor`
   * `right`.
   * @default With anchor 'bottom': size.sheet-peek and 1
   */
  snapPoints?: SheetProps['snapPoints']
  /**
   * The snap point a bottom panel is at, for a controlled snap point, as the Sheet's `snapPoint`.
   */
  snapPoint?: SheetProps['snapPoint']
  /**
   * The snap point a bottom panel opens at, for an uncontrolled snap point, as the Sheet's
   * `defaultSnapPoint`.
   * @default The first snap point
   */
  defaultSnapPoint?: SheetProps['defaultSnapPoint']
  /**
   * Called when a bottom panel asks to move to another snap point, by a swipe, as the Sheet's
   * `onSnapPointChange`.
   */
  onSnapPointChange?: SheetProps['onSnapPointChange']
  /**
   * Overrides "Close", the close button's label; given to the Sheet
   * @default The locale's
   */
  closeLabel?: string
  /** Joined after `pn-Sheet` and `pn-DetailPanel` on the root, the panel's popup */
  className?: string
  /** Reaches the root, the panel's popup */
  style?: CSSProperties
  /** Reaches the root element, the panel's popup */
  ref?: Ref<HTMLDivElement>
  /**
   * Props for each inner part, given on to DetailHeader or to the Sheet's part of the same name:
   * the caller's class follows the part's own
   */
  slotProps?: {
    /**
     * Props for the `header` part, the DetailHeader: a `className`, or its own `slotProps`, such
     * as `slotProps.title.id`, which the panel's name then points at
     */
    header?: Omit<
      DetailHeaderProps,
      'variant' | 'line' | 'lineName' | 'title' | 'subheader' | 'action'
    >
    /** Props for the `trigger` part, given to the Sheet's */
    trigger?: SheetSlots['trigger']
    /** Props for the `portal` part, given to the Sheet's: its `container`, such as the map screen's shell */
    portal?: SheetSlots['portal']
    /** Props for the `viewport` part, given to the Sheet's */
    viewport?: SheetSlots['viewport']
    /** Props for the `close` part, given to the Sheet's */
    close?: SheetSlots['close']
    /** Props for the `content` part, given to the Sheet's */
    content?: SheetSlots['content']
  }
}

/** Base UI's `className`, as the Sheet's parts take it: a string, or a function of the part's state. */
type ClassName<State> = string | ((state: State) => string | undefined) | undefined

/**
 * The part's own class first, then the caller's, whether the caller's is a string or a function of
 * the part's state. A pattern cannot import Base UI's `mergeProps`, so the join is written here
 * (CR-1).
 */
function withClass<State>(own: string, theirs: ClassName<State>): ClassName<State> {
  if (typeof theirs === 'function') return (state) => classes(own, theirs(state))
  return classes(own, theirs)
}

/** The Sheet's title part as a `div`, which can hold DetailHeader's `div`s and `h2` (CR-2). */
const TITLE = { render: <div /> }

/**
 * The panel beside the map that shows the vehicle or the stop a rider picked: a Sheet headed by
 * a DetailHeader, with the close button at the end of its header row and the details below.
 */
export function DetailPanel({
  variant = 'line',
  line,
  lineName,
  title,
  subheader,
  action,
  children,
  anchor = 'right',
  open,
  defaultOpen = false,
  onOpen,
  onClose,
  trigger,
  snapPoints,
  snapPoint,
  defaultSnapPoint,
  onSnapPointChange,
  closeLabel,
  slotProps,
  className,
  ...rest
}: DetailPanelProps) {
  const generatedId = useId()
  const {
    header: headerProps,
    trigger: triggerProps,
    portal: portalProps,
    viewport: viewportProps,
    close: closeProps,
    content: contentProps,
  } = slotProps ?? {}
  const { slotProps: headerSlots, className: headerClass, ...headerRest } = headerProps ?? {}
  // CR-3: the caller's title id when given, so the panel's name points where the caller expects
  const titleId = headerSlots?.title?.id ?? generatedId

  return (
    // CR-4: no `modal`, so the Sheet keeps its default, false; CR-6: no media query, the screen
    // picks the anchor; CR-7: the callbacks and the snap point props reach the Sheet unchanged
    <Sheet
      {...rest}
      className={classes('pn-DetailPanel', className)}
      // CR-5: always set, the default included
      data-variant={variant}
      // CR-3: the DetailHeader's h2 names the dialog, not the whole header row; Base UI merges the
      // popup's own props last, so this wins over the title div's id
      aria-labelledby={titleId}
      anchor={anchor}
      open={open}
      defaultOpen={defaultOpen}
      onOpen={onOpen}
      onClose={onClose}
      trigger={trigger}
      snapPoints={snapPoints}
      snapPoint={snapPoint}
      defaultSnapPoint={defaultSnapPoint}
      onSnapPointChange={onSnapPointChange}
      closeLabel={closeLabel}
      // CR-2: the DetailHeader is the Sheet's title, rendered as a div, then the close button
      title={
        <DetailHeader
          {...headerRest}
          className={classes('pn-DetailPanel-header', headerClass)}
          slotProps={{ ...headerSlots, title: { ...headerSlots?.title, id: titleId } }}
          variant={variant}
          line={line}
          lineName={lineName}
          title={title}
          subheader={subheader}
          action={action}
        />
      }
      slotProps={{
        trigger: triggerProps,
        portal: portalProps,
        viewport: {
          ...viewportProps,
          className: withClass('pn-DetailPanel-viewport', viewportProps?.className),
        },
        title: TITLE,
        close: {
          ...closeProps,
          className: withClass('pn-DetailPanel-close', closeProps?.className),
        },
        content: {
          ...contentProps,
          className: withClass('pn-DetailPanel-content', contentProps?.className),
        },
      }}
    >
      {children}
    </Sheet>
  )
}
