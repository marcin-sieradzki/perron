// DetailHeader: the top of the detail panel, naming what it shows (a line's vehicle by its badge and
// destination, or a stop by its marker and name) with a line under it and room for the panel's own
// controls. A pattern: plain elements over Perron's components, never Base UI (CR-1).
// Spec: docs/patterns/detail-header.md.
import { useId } from 'react'
import type { ComponentPropsWithRef, ReactNode } from 'react'
import { LineBadge } from '../../components/LineBadge/LineBadge.tsx'
import { StationIcon } from '../../components/StationIcon/StationIcon.tsx'
import { VisuallyHidden } from '../../parts/VisuallyHidden/VisuallyHidden.tsx'
import './DetailHeader.css'

export interface DetailHeaderProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'title' | 'children'
> {
  /**
   * What the panel shows: `line` heads a vehicle or a line with its line badge and destination;
   * `stop` heads a stop or station with its marker and name. Set on the root as `data-variant`.
   * @default 'line'
   */
  variant?: 'line' | 'stop'
  /**
   * The line whose colours the mark takes, typed as LineBadge's and StationIcon's `line`. In
   * `line`, the badge's colours, needed with `lineName`; in `stop`, the marker's colour, left out
   * for a stop several lines serve.
   */
  line?: 'm1' | 'm2' | 'm3' | 'm4' | 'a' | 'b' | 'c' | 'e' | 'f' | 'h' | 'bus' | 'regional'
  /**
   * The line's short name as riders know it, "5C", "M2" or "A": the badge's label in `line`, also
   * read first in the title. Not used in `stop`.
   */
  lineName?: ReactNode
  /**
   * The panel's title: the destination in `line` ("Husum Torv"), the stop's name in `stop`
   * ("Nørreport St."). Required. Replaces the HTML `title` attribute.
   */
  title: ReactNode
  /** One supporting line under the title, such as "Next stop: Nørreport St." or the lines a stop has. */
  subheader?: ReactNode
  /** The panel's controls at the end of the row, such as its close button. */
  action?: ReactNode
  /**
   * Props for each inner part, merged with the part's own, which win: the caller's class follows
   * the part's own
   */
  slotProps?: {
    /** Props for the `mark` part */
    mark?: ComponentPropsWithRef<'div'>
    /** Props for the `title` part. Its `id` is the one the panel's `aria-labelledby` points at. */
    title?: ComponentPropsWithRef<'h2'>
    /** Props for the `subheader` part */
    subheader?: ComponentPropsWithRef<'div'>
    /** Props for the `action` part */
    action?: ComponentPropsWithRef<'div'>
  }
}

/**
 * A node that renders something. `null`, `undefined`, a boolean, `''` and an array of only such
 * values render nothing, so their part is left out (CR-3).
 */
const given = (node: ReactNode): boolean =>
  Array.isArray(node) ? node.some(given) : node != null && typeof node !== 'boolean' && node !== ''

/** The part's own class first, then the caller's (CR-6). */
const classes = (own: string, caller: string | undefined) => (caller ? `${own} ${caller}` : own)

/**
 * Heads the detail panel: names the vehicle's line and destination, or the stop, with one line
 * under it and the panel's controls at the end of the row.
 */
export function DetailHeader({
  variant = 'line',
  line,
  lineName,
  title,
  subheader,
  action,
  slotProps,
  className,
  ...rest
}: DetailHeaderProps) {
  const generatedId = useId()
  const {
    mark: markProps,
    title: titleProps,
    subheader: subheaderProps,
    action: actionProps,
  } = slotProps ?? {}
  const titleId = titleProps?.id ?? generatedId

  // CR-3: in line, a badge needs both its line and its name; in stop, the marker always shows,
  // neutral without a line
  const showsBadge = variant === 'line' && line !== undefined && given(lineName)
  const mark = showsBadge ? (
    <LineBadge line={line} size="large">
      {lineName}
    </LineBadge>
  ) : variant === 'stop' ? (
    <StationIcon variant="outlined" size="large" line={line} />
  ) : null

  return (
    <div
      {...rest}
      className={classes('pn-DetailHeader', className)}
      // CR-2: always set, the default included
      data-variant={variant}
    >
      {mark && (
        // CR-4: hidden after the caller's props, so the line is read once, in the heading
        <div
          {...markProps}
          className={classes('pn-DetailHeader-mark', markProps?.className)}
          aria-hidden="true"
        >
          {mark}
        </div>
      )}
      {/* CR-5: always an h2, with an id the panel can point aria-labelledby at */}
      <h2
        {...titleProps}
        id={titleId}
        className={classes('pn-DetailHeader-title', titleProps?.className)}
      >
        {/* CR-4: the line's name and a space, so the heading reads "5C Husum Torv" */}
        {showsBadge && <VisuallyHidden>{lineName} </VisuallyHidden>}
        {title}
      </h2>
      {given(subheader) && (
        <div
          {...subheaderProps}
          className={classes('pn-DetailHeader-subheader', subheaderProps?.className)}
        >
          {subheader}
        </div>
      )}
      {given(action) && (
        <div {...actionProps} className={classes('pn-DetailHeader-action', actionProps?.className)}>
          {action}
        </div>
      )}
    </div>
  )
}
