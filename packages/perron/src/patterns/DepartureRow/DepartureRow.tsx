// DepartureRow: one departure from a stop, as one row of the stop's list of departures: the line's
// badge and where it goes, how fresh the vehicle's data is, and how soon it leaves, with its
// timetabled time and how late it runs. A pattern: plain elements over LineBadge, VehicleDot and
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
import './DepartureRow.css'

/** Under this many seconds, the countdown reads "Now" (CR-3). */
const NOW_UNDER = 45

/** The owned string that names each data state, the word beside the dot (CR-6). */
const STATE_KEY = {
  live: 'live',
  ageing: 'ageing',
  estimated: 'estimated',
  'timetable-only': 'timetableOnly',
  'no-signal': 'noSignal',
} as const

export interface DepartureRowProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /**
   * How fresh the departing vehicle's data is, as Data states names the five states: drawn by the
   * dot, said in words beside it, and, for `estimated`, `timetable-only` and `no-signal`, a "~"
   * before the countdown; `timetable-only` and `no-signal` always show an unknown delay. Set on the
   * root as `data-variant`.
   * @default 'live'
   */
  variant?: NonNullable<VehicleDotProps['variant']>
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
   * minutes, "4 min", and as "Now" under 45 seconds; a number that isn't finite shows "—".
   */
  countdown: number
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
   * Overrides "Unknown", heard in place of "—" when the countdown isn't a finite number
   * @default The locale's
   */
  unknownLabel?: string
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
   * Overrides "min", the unit after the countdown's figure and after the delay's
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
    /** Props for the `status` part, the dot and the state's word */
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
    /** Props for the `countdown` part */
    countdown?: ComponentPropsWithRef<'span'>
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
 * runs.
 */
export function DepartureRow({
  variant = 'live',
  line,
  lineName,
  destination,
  countdown,
  time,
  delay,
  nowLabel,
  unknownLabel,
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
    countdown: countdownProps,
    schedule: scheduleProps,
    time: timeProps,
    delay: delayProps,
  } = slotProps ?? {}

  // CR-4: a time worked out rather than reported is an estimate
  const estimate =
    variant === 'estimated' || variant === 'timetable-only' || variant === 'no-signal'
  // CR-5: these two states never know the delay
  const delayUnknown = variant === 'timetable-only' || variant === 'no-signal'
  const showsDelay = delayUnknown || delay !== undefined
  const showsTime = given(time)

  // CR-3: unknown, "Now" under 45 seconds, or whole minutes, the figure and the unit apart
  let shown: ReactNode
  if (!Number.isFinite(countdown)) shown = <UnknownValue label={strings.unknown} />
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

  // CR-7: each part's slotProps first, its own props last, so they win; classes join by hand
  return (
    <div
      {...rest}
      className={classes('pn-DepartureRow', className)}
      // CR-2: always set, the default included
      data-variant={variant}
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
      {/* CR-6: the dot is hidden, so the state is heard once, from the word beside it */}
      <div {...statusProps} className={classes('pn-DepartureRow-status', statusProps?.className)}>
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
      </div>
      <span
        {...countdownProps}
        className={classes('pn-DepartureRow-countdown', countdownProps?.className)}
      >
        {shown}
      </span>
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
