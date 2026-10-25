'use client'
// StopTimeline: the stops of one vehicle's trip, in order, on a rail in its line's colour, with each
// stop's name, time and delay, the passed stops set back and the next stop marked.
// Spec: docs/patterns/stop-timeline.md.
import type { ComponentPropsWithoutRef, CSSProperties, Ref } from 'react'
import { Delay } from '../../components/Delay/Delay.tsx'
import { StationIcon } from '../../components/StationIcon/StationIcon.tsx'
import type { StationIconProps } from '../../components/StationIcon/StationIcon.tsx'
import { VisuallyHidden } from '../../parts/VisuallyHidden/VisuallyHidden.tsx'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import './StopTimeline.css'

/** One stop of a trip, as StopTimeline's `stops` takes it. */
export interface StopTimelineStop {
  /** The stop's name, as the operator writes it. */
  name: string
  /**
   * The timetabled time at the stop, 24-hour `HH:MM`, such as `'08:14'`. Left out, the stop shows
   * no time.
   */
  time?: string
  /**
   * How late the vehicle runs at the stop, in minutes, as Delay's `minutes` takes it: positive
   * late, negative early, `0` on time, `null` unknown. Left out, no Delay.
   */
  delay?: number | null
}

/**
 * A stop's place in the trip, carried as `data-stop` on its `<li>` and on the parts it styles: the
 * rail, the name and the time.
 */
type StopPlace = 'passed' | 'next' | 'upcoming'

/**
 * Each stop's place from `nextStopIndex` alone (CR-2): before it passed, at it next, after it
 * upcoming. Left out, negative or not a whole number, the vehicle's place is unknown and every stop
 * is upcoming; at or past the last stop, every stop is passed.
 */
function placeOf(index: number, nextStopIndex: number | undefined): StopPlace {
  if (nextStopIndex === undefined || !Number.isInteger(nextStopIndex) || nextStopIndex < 0)
    return 'upcoming'
  if (index < nextStopIndex) return 'passed'
  return index === nextStopIndex ? 'next' : 'upcoming'
}

export interface StopTimelineProps extends Omit<
  ComponentPropsWithoutRef<'ol'>,
  'children' | 'className' | 'style'
> {
  /**
   * The trip's stops, first to last: each one's name, and optionally its timetabled time and its
   * delay in minutes.
   */
  stops: StopTimelineStop[]
  /**
   * The line or mode whose colour the rail and the markers take, as StationIcon's `line`. Left
   * out, the rail and markers are neutral.
   */
  line?: StationIconProps['line']
  /**
   * The index in `stops` of the vehicle's next stop. The stops before it are passed and the ones
   * after it upcoming; an index past the last stop means the trip is over and every stop passed.
   * Left out, the vehicle's place is unknown and no stop is passed or next.
   */
  nextStopIndex?: number
  /**
   * Overrides "Next stop".
   * @default The locale's
   */
  nextStopLabel?: string
  /**
   * Overrides "Passed", heard after a passed stop's name.
   * @default The locale's
   */
  passedLabel?: string
  /**
   * Overrides "min", the unit after each delay's figure; given to every Delay.
   * @default The locale's
   */
  minutesUnitLabel?: string
  /**
   * Overrides "min late", heard after the number when late; given to every Delay.
   * @default The locale's
   */
  minutesLateLabel?: string
  /**
   * Overrides "min early", heard after the number when early; given to every Delay.
   * @default The locale's
   */
  minutesEarlyLabel?: string
  /**
   * Overrides "On time"; given to every Delay.
   * @default The locale's
   */
  onTimeLabel?: string
  /**
   * Overrides "Delay unknown", heard in place of "—"; given to every Delay.
   * @default The locale's
   */
  delayUnknownLabel?: string
  /** Merged after `pn-StopTimeline` on the root */
  className?: string
  /** Reaches the root */
  style?: CSSProperties
  /** Reaches the root */
  ref?: Ref<HTMLOListElement>
}

/**
 * The stops of one vehicle's trip, in order, on a rail in its line's colour: each stop's name, time
 * and delay, with the passed stops set back and the next stop marked.
 */
export function StopTimeline({
  stops,
  line,
  nextStopIndex,
  nextStopLabel,
  passedLabel,
  minutesUnitLabel,
  minutesLateLabel,
  minutesEarlyLabel,
  onTimeLabel,
  delayUnknownLabel,
  className,
  ref,
  ...rest
}: StopTimelineProps) {
  const strings = useOwnedStrings({ nextStop: nextStopLabel, passed: passedLabel })
  // every Delay gets the five labels as StopTimeline was given them (CR-10)
  const delayLabels = {
    minutesUnitLabel,
    minutesLateLabel,
    minutesEarlyLabel,
    onTimeLabel,
    delayUnknownLabel,
  }
  const last = stops.length - 1

  return (
    // the rest props first, so the pattern's own class and data-line win (CR-1)
    <ol
      {...rest}
      ref={ref}
      className={className ? `pn-StopTimeline ${className}` : 'pn-StopTimeline'}
      data-line={line}
    >
      {stops.map((stop, index) => {
        const place = placeOf(index, nextStopIndex)
        return (
          // a trip's stops never reorder, so the index is a stable key
          <li
            key={index}
            className="pn-StopTimeline-stop"
            data-stop={place}
            aria-current={place === 'next' ? 'step' : undefined}
          >
            {/* the piece of rail to the next stop's marker; the last stop has none (CR-6). It
                carries the line and its stop's place, which its colour reads (CR-1, CR-2) */}
            {index < last && (
              <span
                className="pn-StopTimeline-rail"
                data-line={line}
                data-stop={place}
                aria-hidden="true"
              />
            )}
            <StationIcon
              className="pn-StopTimeline-marker"
              line={line}
              size="small"
              variant={place === 'next' ? 'filled' : 'outlined'}
            />
            <span className="pn-StopTimeline-name" data-stop={place}>
              {stop.name}
            </span>
            {/* heard straight after the name, before the time (CR-4) */}
            {place === 'passed' && (
              <>
                {' '}
                <VisuallyHidden>{strings.passed}</VisuallyHidden>
              </>
            )}
            {place === 'next' && <span className="pn-StopTimeline-next">{strings.nextStop}</span>}
            {stop.time !== undefined && (
              <time className="pn-StopTimeline-time" data-stop={place} dateTime={stop.time}>
                {stop.time}
              </time>
            )}
            {stop.delay !== undefined && (
              <Delay className="pn-StopTimeline-delay" minutes={stop.delay} {...delayLabels} />
            )}
          </li>
        )
      })}
    </ol>
  )
}
