'use client'
// DepartureRow: one departure from a stop, as one row of the stop's list of departures: the line's
// badge and where it goes, how fresh the vehicle's data is, and how soon it leaves, with its
// timetabled time and how late it runs, or how often its line runs; a cancelled departure stays,
// marked so, and a platform or track can join the second line. A pattern: plain elements over LineBadge, VehicleDot and
// Delay, never Base UI (CR-1). Spec: docs/patterns/departure-row.md.
import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Delay } from '../../components/Delay/Delay.tsx'
import type { DelayProps } from '../../components/Delay/Delay.tsx'
import { LineBadge } from '../../components/LineBadge/LineBadge.tsx'
import type { LineBadgeProps } from '../../components/LineBadge/LineBadge.tsx'
import { VehicleDot } from '../../components/VehicleDot/VehicleDot.tsx'
import type { VehicleDotProps } from '../../components/VehicleDot/VehicleDot.tsx'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import { UnknownValue } from '../../internal/UnknownValue.tsx'
import { classes, given } from '../../internal/nodes.ts'
import { interpolate } from '../../internal/strings.ts'
import { delayKnown, STATE_KEY } from '../../internal/vehicle-states.ts'
import type { VehicleState } from '../../internal/vehicle-states.ts'
import './DepartureRow.css'

/** Under this many seconds, the countdown reads "Now" (CR-3). */
const NOW_UNDER = 45

export interface DepartureRowProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /**
   * How fresh the departing vehicle's data is, as Data states names the five states: drawn by the
   * dot, said in words beside it, and, for `estimated`, `timetable-only` and `no-signal`, a "~"
   * before the countdown; `timetable-only` and `no-signal` always show an unknown delay. Set on the
   * root as `data-variant`.
   * @default 'live'
   */
  variant?: VehicleState
  /**
   * The departure's line, typed as LineBadge's and VehicleDot's `line`: the badge's colours and
   * the dot's.
   */
  line: LineBadgeProps['line']
  /** The line's short name as riders know it, "5C", "M2" or "A": the badge's label. */
  lineName: ReactNode
  /** Where the departure goes, as the operator writes it: "Husum Torv", "Lufthavnen". */
  destination: ReactNode
  /**
   * The seconds until the departure leaves, as expected now, delay included. Shown as whole
   * minutes, "4 min", and as "Now" under 45 seconds; left out, or a number that isn't finite,
   * shows "—". Not shown when `interval` is given.
   */
  countdown?: number
  /**
   * The minutes between departures, for a line that runs to an interval rather than to clock
   * times: one number, "Every 3 min", or a range, `[3, 4]`, "Every 3 to 4 min". Shown in place of
   * the countdown, the time and the delay, which the row then leaves out; a number that isn't
   * finite shows "—".
   */
  interval?: number | readonly [number, number]
  /**
   * The departure won't run. The row stays, "Cancelled" in place of the dot and the state's word,
   * its countdown or interval and its time struck through, and no delay. Set on the root as
   * `data-cancelled`.
   * @default false
   */
  cancelled?: boolean
  /**
   * Where the departure leaves from at the stop, written whole by the caller as the operator
   * gives it, "Track 4" or "Platform 2": shown after the state's word. Left out, no platform.
   */
  platform?: ReactNode
  /**
   * The timetabled time of the departure, 24-hour `HH:MM`, such as `'08:14'`, shown under the
   * countdown. Left out, the row shows no time.
   */
  time?: string
  /**
   * How late the departure runs, in minutes, as Delay's `minutes` takes it: positive late,
   * negative early, `0` on time, `null` unknown. Left out, no Delay, except for a `timetable-only`
   * or `no-signal` vehicle, which always shows "—".
   */
  delay?: number | null
  /**
   * Overrides "Now", shown and heard in place of the countdown under 45 seconds
   * @default The locale's
   */
  nowLabel?: string
  /**
   * Overrides "Unknown", heard in place of "—" when the countdown or the interval isn't a finite
   * number
   * @default The locale's
   */
  unknownLabel?: string
  /**
   * Overrides "Cancelled", shown and heard in place of the state's word when `cancelled`
   * @default The locale's
   */
  cancelledLabel?: string
  /**
   * Overrides "Every {count} min", an interval of one number, "Every 3 min"; `{count}` is the whole
   * minutes
   * @default The locale's
   */
  everyLabel?: string
  /**
   * Overrides "Every {from} to {to} min", an interval's range, "Every 3 to 4 min"; `{from}` and
   * `{to}` are the fewest and the most whole minutes
   * @default The locale's
   */
  everyRangeLabel?: string
  /**
   * Overrides "Live", the state's word when `variant='live'`
   * @default The locale's
   */
  liveLabel?: string
  /**
   * Overrides "Ageing", the state's word when `variant='ageing'`
   * @default The locale's
   */
  ageingLabel?: string
  /**
   * Overrides "Estimated", the state's word when `variant='estimated'`
   * @default The locale's
   */
  estimatedLabel?: string
  /**
   * Overrides "Timetable only", the state's word when `variant='timetable-only'`
   * @default The locale's
   */
  timetableOnlyLabel?: string
  /**
   * Overrides "No signal", the state's word when `variant='no-signal'`
   * @default The locale's
   */
  noSignalLabel?: string
  /**
   * Overrides "min", the unit after the countdown's figure and the delay's
   * @default The locale's
   */
  minutesUnitLabel?: string
  /**
   * Overrides "min late", heard after the delay's number when late; given to the Delay
   * @default The locale's
   */
  minutesLateLabel?: string
  /**
   * Overrides "min early", heard after the delay's number when early; given to the Delay
   * @default The locale's
   */
  minutesEarlyLabel?: string
  /**
   * Overrides "On time"; given to the Delay
   * @default The locale's
   */
  onTimeLabel?: string
  /**
   * Overrides "Delay unknown", heard in place of the delay's "—"; given to the Delay
   * @default The locale's
   */
  delayUnknownLabel?: string
  /**
   * Props for each inner part, merged with the part's own, which win: the caller's class follows
   * the part's own
   */
  slotProps?: {
    /** Props for the `badge` part, the LineBadge */
    badge?: Omit<LineBadgeProps, 'line' | 'children' | 'size'>
    /** Props for the `destination` part */
    destination?: ComponentPropsWithRef<'div'>
    /** Props for the `status` part, the dot and the state's word, or "Cancelled", and the platform */
    status?: ComponentPropsWithRef<'div'>
    /** Props for the `dot` part, the VehicleDot */
    dot?: Omit<
      VehicleDotProps,
      | 'variant'
      | 'line'
      | 'size'
      | 'liveLabel'
      | 'ageingLabel'
      | 'estimatedLabel'
      | 'timetableOnlyLabel'
      | 'noSignalLabel'
    >
    /** Props for the `platform` part */
    platform?: ComponentPropsWithRef<'span'>
    /** Props for the `countdown` part */
    countdown?: ComponentPropsWithRef<'span'>
    /** Props for the `interval` part */
    interval?: ComponentPropsWithRef<'span'>
    /** Props for the `schedule` part, the time and the delay */
    schedule?: ComponentPropsWithRef<'div'>
    /** Props for the `time` part */
    time?: ComponentPropsWithRef<'time'>
    /** Props for the `delay` part, the Delay */
    delay?: Omit<
      DelayProps,
      | 'minutes'
      | 'minutesUnitLabel'
      | 'minutesLateLabel'
      | 'minutesEarlyLabel'
      | 'onTimeLabel'
      | 'delayUnknownLabel'
    >
  }
}

/**
 * One departure from a stop, as one row of the stop's list: the line's badge and where it goes, how
 * fresh the vehicle's data is, and how soon it leaves, with its timetabled time and how late it
 * runs, or how often its line runs.
 */
export function DepartureRow({
  variant = 'live',
  line,
  lineName,
  destination,
  countdown,
  time,
  delay,
  interval,
  cancelled = false,
  platform,
  nowLabel,
  unknownLabel,
  cancelledLabel,
  everyLabel,
  everyRangeLabel,
  liveLabel,
  ageingLabel,
  estimatedLabel,
  timetableOnlyLabel,
  noSignalLabel,
  minutesUnitLabel,
  minutesLateLabel,
  minutesEarlyLabel,
  onTimeLabel,
  delayUnknownLabel,
  slotProps,
  className,
  ...rest
}: DepartureRowProps) {
  const strings = useOwnedStrings({
    now: nowLabel,
    unknown: unknownLabel,
    cancelled: cancelledLabel,
    every: everyLabel,
    everyRange: everyRangeLabel,
    live: liveLabel,
    ageing: ageingLabel,
    estimated: estimatedLabel,
    timetableOnly: timetableOnlyLabel,
    noSignal: noSignalLabel,
    minutesUnit: minutesUnitLabel,
  })
  const {
    badge: badgeProps,
    destination: destinationProps,
    status: statusProps,
    dot: dotProps,
    platform: platformProps,
    countdown: countdownProps,
    interval: intervalProps,
    schedule: scheduleProps,
    time: timeProps,
    delay: delayProps,
  } = slotProps ?? {}

  // CR-4: a time worked out rather than reported is an estimate
  const estimate =
    variant === 'estimated' || variant === 'timetable-only' || variant === 'no-signal'
  // CR-14: an interval stands in for the countdown, the time and the delay
  const runsToInterval = interval !== undefined
  // CR-5: these two states never know the delay; CR-13: a cancelled departure runs no delay
  const delayUnknown = !delayKnown(variant)
  const showsDelay = !runsToInterval && !cancelled && (delayUnknown || delay !== undefined)
  const showsTime = !runsToInterval && given(time)

  // CR-3: unknown, "Now" under 45 seconds, or whole minutes, the figure and the unit apart
  let shown: ReactNode
  if (countdown === undefined || !Number.isFinite(countdown))
    shown = <UnknownValue label={strings.unknown} />
  else if (countdown < NOW_UNDER) shown = strings.now
  else
    shown = (
      <>
        {/* CR-4: the word beside the dot tells the ear what the "~" tells the eye */}
        {estimate && <span aria-hidden="true">~</span>}
        {/* the figure in its own element, so the unit stays a text run of its own */}
        <span>{Math.round(countdown / 60)}</span> {strings.minutesUnit}
      </>
    )

  // CR-14: the locale's template, the minutes filled in where its grammar puts them: one number,
  // or the fewest and the most when they differ
  let every: ReactNode
  if (runsToInterval) {
    const [first, last] = typeof interval === 'number' ? [interval, interval] : interval
    const fewest = Math.round(Math.min(first, last))
    const most = Math.round(Math.max(first, last))
    if (!Number.isFinite(fewest) || !Number.isFinite(most))
      every = <UnknownValue label={strings.unknown} />
    else if (most === fewest) every = interpolate(strings.every, { count: fewest })
    else every = interpolate(strings.everyRange, { from: fewest, to: most })
  }

  // CR-7: each part's slotProps first, its own props last, so they win; classes join by hand
  return (
    <div
      {...rest}
      className={classes('pn-DepartureRow', className)}
      // CR-2: always set, the default included
      data-variant={variant}
      // CR-13: a bare attribute, only when cancelled
      data-cancelled={cancelled ? '' : undefined}
    >
      <LineBadge
        {...badgeProps}
        className={classes('pn-DepartureRow-badge', badgeProps?.className)}
        line={line}
        size="medium"
      >
        {lineName}
      </LineBadge>
      <div
        {...destinationProps}
        className={classes('pn-DepartureRow-destination', destinationProps?.className)}
      >
        {destination}
      </div>
      {/* CR-6: the dot is hidden, so the state is heard once, from the word beside it; CR-13: a
          cancelled departure has no vehicle to show, so "Cancelled" takes the dot's and the word's
          place */}
      <div {...statusProps} className={classes('pn-DepartureRow-status', statusProps?.className)}>
        {cancelled ? (
          strings.cancelled
        ) : (
          <>
            <VehicleDot
              {...dotProps}
              className={classes('pn-DepartureRow-dot', dotProps?.className)}
              variant={variant}
              line={line}
              size="small"
              aria-hidden="true"
              liveLabel={liveLabel}
              ageingLabel={ageingLabel}
              estimatedLabel={estimatedLabel}
              timetableOnlyLabel={timetableOnlyLabel}
              noSignalLabel={noSignalLabel}
            />
            {strings[STATE_KEY[variant]]}
          </>
        )}
        {/* CR-15: the caller's whole label, after the state's word and a text space, so the two
            are read as two words; the flex row draws no space of its own */}
        {given(platform) && (
          <>
            {' '}
            <span
              {...platformProps}
              className={classes('pn-DepartureRow-platform', platformProps?.className)}
            >
              {platform}
            </span>
          </>
        )}
      </div>
      {runsToInterval ? (
        <span
          {...intervalProps}
          className={classes('pn-DepartureRow-interval', intervalProps?.className)}
        >
          {every}
        </span>
      ) : (
        <span
          {...countdownProps}
          className={classes('pn-DepartureRow-countdown', countdownProps?.className)}
        >
          {shown}
        </span>
      )}
      {/* CR-10: the second line at the end only when it holds a time or a Delay */}
      {(showsTime || showsDelay) && (
        <div
          {...scheduleProps}
          className={classes('pn-DepartureRow-schedule', scheduleProps?.className)}
        >
          {showsTime && (
            <time
              {...timeProps}
              className={classes('pn-DepartureRow-time', timeProps?.className)}
              dateTime={time}
            >
              {time}
            </time>
          )}
          {showsDelay && (
            <Delay
              {...delayProps}
              className={classes('pn-DepartureRow-delay', delayProps?.className)}
              minutes={delayUnknown ? null : (delay ?? null)}
              minutesUnitLabel={minutesUnitLabel}
              minutesLateLabel={minutesLateLabel}
              minutesEarlyLabel={minutesEarlyLabel}
              onTimeLabel={onTimeLabel}
              delayUnknownLabel={delayUnknownLabel}
            />
          )}
        </div>
      )}
    </div>
  )
}
