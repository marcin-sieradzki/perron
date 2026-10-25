// DayProfileChart: how one count moves across a day, such as the vehicles in service each hour from
// midnight to midnight: one line in the chart colour, the area under it, a 24-hour time axis, and a
// value tip for the point under the pointer or the keys. A pattern: plain HTML and SVG, Perron's
// VisuallyHidden part and the nodes.ts helpers, never Base UI. Spec: docs/patterns/day-profile-chart.md.
import { useEffect, useId, useRef, useState } from 'react'
import type {
  ComponentPropsWithRef,
  CSSProperties,
  FocusEvent,
  KeyboardEvent,
  PointerEvent,
  ReactNode,
  Ref,
  SyntheticEvent,
} from 'react'
import { VisuallyHidden } from '../../parts/VisuallyHidden/VisuallyHidden.tsx'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import { classes, known } from '../../internal/nodes.ts'
import './DayProfileChart.css'

/** One point of the day, as DayProfileChart's `points` takes it. */
export interface DayProfileChartPoint {
  /**
   * The point's time of day, 24-hour `HH:MM` from `'00:00'` to `'23:59'`, in Copenhagen's time. A
   * point whose time doesn't read as one is left out of the drawing and the list.
   */
  time: string
  /**
   * Optional. How many there were at that time, a whole number from 0 up, such as `1260`. `null`,
   * left out or not a finite number, the count is unknown: the line breaks there, and the point
   * says "—" and "Unknown".
   */
  count?: number | null
}

export interface DayProfileChartProps extends Omit<ComponentPropsWithRef<'figure'>, 'children'> {
  /**
   * Required. The day's counts in time order, each one's time and count, such as one per hour from
   * `'00:00'` to `'23:00'`. The line runs through them in the order given and ends at the last;
   * empty, the plot shows its baseline alone and takes no focus.
   */
  points: ReadonlyArray<DayProfileChartPoint>
  /**
   * Required. What the chart counts, in a few words, shown above the plot as the figure's caption
   * and naming the plot for screen readers: "Vehicles in service".
   */
  label: ReactNode
  /**
   * Overrides "Unknown", heard in place of "—" for a point whose count no data gives
   * @default The locale's
   */
  unknownLabel?: string
  /** Joined after `pn-DayProfileChart` on the root */
  className?: string
  /** Reaches the root */
  style?: CSSProperties
  /** Reaches the root element, the `figure` */
  ref?: Ref<HTMLElement>
  /** Props for each inner part, merged with the part's own, which win: the caller's class follows the part's own */
  slotProps?: {
    /** Props for the `caption` part */
    caption?: ComponentPropsWithRef<'figcaption'>
    /** Props for the `plot` part, the focus stop; its handlers run before the pattern's own */
    plot?: ComponentPropsWithRef<'div'>
    /** Props for the `graph` part, the drawing */
    graph?: ComponentPropsWithRef<'svg'>
    /** Props for the `scale` part, the top count */
    scale?: ComponentPropsWithRef<'span'>
    /** Props for the `points` part, the list */
    points?: ComponentPropsWithRef<'ol'>
    /** Props for every `point` part */
    point?: ComponentPropsWithRef<'li'>
    /** Props for the `tip` part, the value tip */
    tip?: ComponentPropsWithRef<'div'>
    /** Props for the `axis` part, the time axis */
    axis?: ComponentPropsWithRef<'div'>
  }
}

/** The day's minutes, the `graph`'s `viewBox` across (CR-1). */
const DAY = 1440
/** A time of day, `00:00` to `23:59` (CR-2). */
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/
/** The axis's five ticks, each at its share of the day (CR-8). */
const TICKS = ['00:00', '06:00', '12:00', '18:00', '24:00']
/** U+2014, the dash content design writes for unknown, in the tip. */
const DASH = '—'

/** A point the chart draws: its time read as minutes, and its count when known. */
interface Drawn {
  time: string
  minutes: number
  count: number | undefined
}

/** The points whose time reads as `HH:MM`, in the caller's order (CR-2). */
function drawable(points: ReadonlyArray<DayProfileChartPoint>): Drawn[] {
  const out: Drawn[] = []
  for (const { time, count } of points) {
    const match = typeof time === 'string' ? TIME.exec(time) : null
    if (!match) continue
    const minutes = Number(match[1]) * 60 + Number(match[2])
    out.push({ time, minutes, count: known(count) ? (count as number) : undefined })
  }
  return out
}

/** A count in digits grouped in threes from the right by a no-break space: "1 260" (CR-3). */
function grouped(count: number) {
  const [whole, fraction] = String(count).split('.')
  const digits = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0')
  return fraction === undefined ? digits : `${digits}.${fraction}`
}

/**
 * The scale's top: the largest known count rounded up to the next multiple of half its leading
 * power of ten, and never below 1; undefined with no known count (CR-3).
 */
function topOf(drawn: Drawn[]): number | undefined {
  let largest: number | undefined
  for (const { count } of drawn)
    if (count !== undefined && (largest === undefined || count > largest)) largest = count
  if (largest === undefined) return undefined
  if (largest <= 1) return 1
  const step = 10 ** Math.floor(Math.log10(largest)) / 2
  return Math.ceil(largest / step) * step
}

/** A coordinate to two decimals, enough for a 1440 by 100 `viewBox`. */
const at = (n: number) => Math.round(n * 100) / 100

/**
 * The line's and the area's path data: one subpath and one closed shape per run of known counts,
 * broken at each unknown one; a run of one draws a dot through the line's round cap (CR-4).
 */
function shapes(drawn: Drawn[], top: number | undefined) {
  if (top === undefined) return { line: '', area: '' }
  const runs: { x: number; y: number }[][] = []
  let run: { x: number; y: number }[] | undefined
  for (const { minutes, count } of drawn) {
    if (count === undefined) {
      run = undefined
      continue
    }
    if (!run) runs.push((run = []))
    run.push({ x: at(minutes), y: at(100 - (count / top) * 100) })
  }
  let line = ''
  let area = ''
  for (const points of runs) {
    const [first] = points
    const end = points[points.length - 1]
    line += points.map(({ x, y }, index) => `${index ? 'L' : 'M'}${x} ${y}`).join('')
    // a lone point repeats itself, so its zero-length subpath draws the round cap as a dot
    if (points.length === 1) line += `L${first.x} ${first.y}`
    area += `M${first.x} 100${points.map(({ x, y }) => `L${x} ${y}`).join('')}L${end.x} 100Z`
  }
  return { line, area }
}

/** A share of the day, as a percentage of the plot's width (CR-1). */
const percent = (minutes: number) => `${at((minutes / DAY) * 100)}%`

/**
 * Where a tick sits: 00:00 flush with the axis's left edge, 24:00 with its right, and the three
 * between centred on their times (CR-8).
 */
function tickPlace(index: number): CSSProperties {
  if (index === 0) return { left: 0 }
  if (index === TICKS.length - 1) return { right: 0 }
  return { left: `${(index / (TICKS.length - 1)) * 100}%`, transform: 'translateX(-50%)' }
}

/**
 * One handler from the caller's and the pattern's own: the caller's first, then the pattern's,
 * unless the caller's called `preventDefault` (CR-7).
 */
function chain<E extends SyntheticEvent>(
  caller: ((event: E) => void) | undefined,
  own: (event: E) => void,
) {
  return (event: E) => {
    caller?.(event)
    if (!event.defaultPrevented) own(event)
  }
}

/**
 * How one count moves across a day, such as the vehicles in service each hour: one line with the
 * area under it, a 24-hour time axis, and a value tip that gives the time and the count under the
 * pointer or the keys.
 */
export function DayProfileChart({
  points,
  label,
  unknownLabel,
  slotProps,
  className,
  ...rest
}: DayProfileChartProps) {
  const strings = useOwnedStrings({ unknown: unknownLabel })
  const {
    caption: captionProps,
    plot: plotProps,
    graph: graphProps,
    scale: scaleProps,
    points: pointsProps,
    point: pointProps,
    tip: tipProps,
    axis: axisProps,
  } = slotProps ?? {}
  const id = useId()
  const captionId = `${id}-caption`
  const pointId = (index: number) => `${id}-point-${index}`

  const drawn = drawable(points)
  const top = topOf(drawn)
  const { line, area } = shapes(drawn, top)
  const last = drawn.length - 1

  // CR-6 and CR-10: one highlighted point at most, moved to the last when new points end sooner
  const [highlight, setHighlight] = useState<number | null>(null)
  // The move is stored, so points that grow back later keep the highlight where it moved to.
  if (highlight !== null && highlight > last) setHighlight(last < 0 ? null : last)
  const active = highlight === null || last < 0 ? null : Math.min(highlight, last)
  const highlighted = active === null ? undefined : drawn[active]

  /** The point nearest the pointer in time, the earlier of two equally near (CR-7). */
  const nearest = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const minutes = box.width > 0 ? ((event.clientX - box.left) / box.width) * DAY : 0
    let best = 0
    for (let index = 1; index < drawn.length; index++) {
      const distance = Math.abs(drawn[index].minutes - minutes)
      const bestDistance = Math.abs(drawn[best].minutes - minutes)
      if (
        distance < bestDistance ||
        (distance === bestDistance && drawn[index].minutes < drawn[best].minutes)
      )
        best = index
    }
    return best
  }

  // CR-7: the plot the pointer last reached, so a highlight it showed closes with Escape wherever
  // focus is
  const hoveredPlot = useRef<HTMLDivElement | null>(null)
  const shown = active !== null
  useEffect(() => {
    const plot = hoveredPlot.current
    if (!shown || !plot) return
    const owner = plot.ownerDocument
    // a focused plot's own keydown handles Escape (CR-6); the key goes on to what has focus
    const onEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && owner.activeElement !== plot) setHighlight(null)
    }
    owner.addEventListener('keydown', onEscape)
    return () => owner.removeEventListener('keydown', onEscape)
  }, [shown])

  /** Whether the plot an event reached has focus. */
  const focused = (event: PointerEvent<HTMLDivElement>) =>
    event.currentTarget.ownerDocument.activeElement === event.currentTarget

  // CR-7: moving over the plot, or pressing it, highlights the point nearest the pointer; the
  // browser focuses the plot on press
  const onPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (last < 0) return
    hoveredPlot.current = event.currentTarget
    setHighlight(nearest(event))
  }
  // CR-7: a finger lifting from a tap leaves before the browser focuses the plot, so a touch's
  // leave keeps the tip the tap showed; any other leave clears it unless the plot has focus
  const onPointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch' && !focused(event)) setHighlight(null)
  }
  // CR-7: a swipe that scrolls the page cancels the touch, which then shows no tip
  const onPointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    if (!focused(event)) setHighlight(null)
  }
  // CR-6: focus keeps a point the pointer chose, or highlights the last
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && last >= 0)
      setHighlight((current) => current ?? last)
  }
  const onBlur = () => setHighlight(null)
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (last < 0) return
    let next: number | undefined
    // with none highlighted, after Escape, an arrow brings the highlight back on the last point,
    // as focus does
    if (event.key === 'ArrowRight') next = active === null ? last : Math.min(active + 1, last)
    else if (event.key === 'ArrowLeft') next = active === null ? last : Math.max(active - 1, 0)
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = last
    else if (event.key === 'Escape' && active !== null) {
      // the panel around the chart stays open
      event.stopPropagation()
      setHighlight(null)
      return
    }
    if (next === undefined) return
    event.preventDefault()
    setHighlight(next)
  }

  // CR-8: the tip beside the guide, after it up to the middle and before it past the middle, and
  // never over the scale's count, which is as many characters wide as the tip's `ch` at most
  const tipAt = highlighted ? at((highlighted.minutes / DAY) * 100) : 0
  const scaleWidth = top === undefined ? 0 : grouped(top).length
  const tipPlace: CSSProperties =
    tipAt > 50 ? { right: `${at(100 - tipAt)}%` } : { left: `max(${tipAt}%, ${scaleWidth}ch)` }

  return (
    // the rest props first, so the pattern's own class wins; the caller's ref reaches the figure
    <figure {...rest} className={classes('pn-DayProfileChart', className)}>
      <figcaption
        {...captionProps}
        className={classes('pn-DayProfileChart-caption', captionProps?.className)}
        id={captionId}
      >
        {label}
      </figcaption>
      {/* CR-6 and CR-7: one focus stop, named by the caption, pointing at the highlighted point */}
      <div
        {...plotProps}
        className={classes('pn-DayProfileChart-plot', plotProps?.className)}
        role="group"
        aria-labelledby={captionId}
        tabIndex={last >= 0 ? 0 : undefined}
        aria-activedescendant={active === null ? undefined : pointId(active)}
        onPointerMove={chain(plotProps?.onPointerMove, onPointer)}
        onPointerDown={chain(plotProps?.onPointerDown, onPointer)}
        onPointerLeave={chain(plotProps?.onPointerLeave, onPointerLeave)}
        onPointerCancel={chain(plotProps?.onPointerCancel, onPointerCancel)}
        onFocus={chain(plotProps?.onFocus, onFocus)}
        onBlur={chain(plotProps?.onBlur, onBlur)}
        onKeyDown={chain(plotProps?.onKeyDown, onKeyDown)}
      >
        {/* CR-1 and CR-4: the day's minutes across, the scale's percent down */}
        <svg
          {...graphProps}
          className={classes('pn-DayProfileChart-graph', graphProps?.className)}
          aria-hidden="true"
          viewBox={`0 0 ${DAY} 100`}
          preserveAspectRatio="none"
        >
          {top !== undefined && (
            <line className="pn-DayProfileChart-gridline" x1={0} y1={0} x2={DAY} y2={0} />
          )}
          <line className="pn-DayProfileChart-baseline" x1={0} y1={100} x2={DAY} y2={100} />
          <path className="pn-DayProfileChart-area" d={area || undefined} />
          <path className="pn-DayProfileChart-line" d={line || undefined} />
        </svg>
        {/* CR-3: the top count alone, eye-only */}
        <span
          {...scaleProps}
          className={classes('pn-DayProfileChart-scale', scaleProps?.className)}
          aria-hidden="true"
        >
          {top === undefined ? null : grouped(top)}
        </span>
        {/* CR-2 and CR-5: every drawn point, in the caller's order, for the ear */}
        <ol
          {...pointsProps}
          className={classes('pn-DayProfileChart-points', pointsProps?.className)}
        >
          {drawn.map((point, index) => (
            <li
              // the points are the caller's, in its order, with no id of their own
              key={index}
              {...pointProps}
              className={classes('pn-DayProfileChart-point', pointProps?.className)}
              id={pointId(index)}
              data-highlighted={index === active ? '' : undefined}
              style={{ ...pointProps?.style, left: percent(point.minutes) }}
            >
              <VisuallyHidden>
                <time dateTime={point.time}>{point.time}</time>{' '}
                {point.count === undefined ? strings.unknown : grouped(point.count)}
              </VisuallyHidden>
            </li>
          ))}
        </ol>
        {/* CR-8: only while a point is highlighted, beside its guide inside the plot */}
        {highlighted && (
          <div
            {...tipProps}
            className={classes('pn-DayProfileChart-tip', tipProps?.className)}
            aria-hidden="true"
            style={{ ...tipProps?.style, ...tipPlace }}
          >
            <span>{highlighted.time}</span>
            <span>{highlighted.count === undefined ? DASH : grouped(highlighted.count)}</span>
          </div>
        )}
      </div>
      <div
        {...axisProps}
        className={classes('pn-DayProfileChart-axis', axisProps?.className)}
        aria-hidden="true"
      >
        {TICKS.map((tick, index) => (
          <span key={tick} className="pn-DayProfileChart-tick" style={tickPlace(index)}>
            {tick}
          </span>
        ))}
      </div>
    </figure>
  )
}
