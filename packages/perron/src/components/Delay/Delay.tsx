'use client'
// Delay: how late or early a vehicle or departure runs, as a short figure in the delay's colour,
// such as "+3 min", with the same said in words to a screen reader. Spec: docs/components/delay.md.
import type { CSSProperties, Ref } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { VisuallyHidden } from '../../parts/VisuallyHidden/VisuallyHidden.tsx'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import './Delay.css'

/** The kind of a delay, which picks its colour: the root's `data-delay`. */
type DelayKind = 'on-time' | 'slight' | 'late' | 'early' | 'unknown'

/** U+2212, the true minus sign content design writes for early. */
const MINUS = '−'
/** U+2014, the dash content design writes for unknown. */
const UNKNOWN = '—'

/** The delay in whole minutes, or null when no number says it (CR-1). */
function roundedMinutes(minutes: number | null): number | null {
  return minutes === null || !Number.isFinite(minutes) ? null : Math.round(minutes)
}

/** The kind of a rounded delay, by the bounds the `color.transit.delay.*` tokens describe (CR-1). */
function kindOf(rounded: number | null): DelayKind {
  if (rounded === null) return 'unknown'
  if (rounded === 0) return 'on-time'
  if (rounded < 0) return 'early'
  return rounded < 3 ? 'slight' : 'late'
}

export interface DelayProps extends Omit<useRender.ComponentProps<'span'>, 'children' | 'ref'> {
  /**
   * The delay in minutes: positive when late, negative when early, `0` on time, `null` when no
   * real-time data says (timetable only, no signal). Rounded to the nearest whole minute.
   */
  minutes: number | null
  /**
   * Overrides "min", the unit after the figure.
   * @default The locale's
   */
  minutesUnitLabel?: string
  /**
   * Overrides "min late", heard after the number when late.
   * @default The locale's
   */
  minutesLateLabel?: string
  /**
   * Overrides "min early", heard after the number when early.
   * @default The locale's
   */
  minutesEarlyLabel?: string
  /**
   * Overrides "On time".
   * @default The locale's
   */
  onTimeLabel?: string
  /**
   * Overrides "Delay unknown", heard in place of "—".
   * @default The locale's
   */
  delayUnknownLabel?: string
  /** Reaches the root, merged after `pn-Delay` */
  className?: string
  /** Reaches the root */
  style?: CSSProperties
  /** Reaches the root element. */
  ref?: Ref<HTMLSpanElement>
}

/**
 * How late or early a vehicle or departure runs: "+3 min" in the delay's colour, "On time", or "—"
 * when unknown, with the delay said in words to a screen reader.
 */
export function Delay({
  minutes,
  render,
  minutesUnitLabel,
  minutesLateLabel,
  minutesEarlyLabel,
  onTimeLabel,
  delayUnknownLabel,
  ref,
  ...rest
}: DelayProps) {
  const strings = useOwnedStrings({
    minutesUnit: minutesUnitLabel,
    minutesLate: minutesLateLabel,
    minutesEarly: minutesEarlyLabel,
    onTime: onTimeLabel,
    delayUnknown: delayUnknownLabel,
  })
  const rounded = roundedMinutes(minutes)
  const kind = kindOf(rounded)
  const magnitude = rounded === null ? 0 : Math.abs(rounded)

  let children
  if (kind === 'on-time') children = <span className="pn-Delay-value">{strings.onTime}</span>
  else if (kind === 'unknown')
    children = (
      <>
        <span className="pn-Delay-value" aria-hidden="true">
          {UNKNOWN}
        </span>
        <VisuallyHidden>{strings.delayUnknown}</VisuallyHidden>
      </>
    )
  else
    children = (
      <>
        <span className="pn-Delay-value" aria-hidden="true">
          {`${kind === 'early' ? MINUS : '+'}${magnitude}`}
        </span>{' '}
        <span className="pn-Delay-unit" aria-hidden="true">
          {strings.minutesUnit}
        </span>
        {/* the number in its own element, so the words stay a separate text run (CR-3) */}
        <VisuallyHidden>
          <span>{magnitude}</span> {kind === 'early' ? strings.minutesEarly : strings.minutesLate}
        </VisuallyHidden>
      </>
    )

  // Delay's own props last, so they win over the caller's; className joins as "pn-Delay <caller's>"
  const own = { className: 'pn-Delay', 'data-delay': kind, children }
  return useRender({
    defaultTagName: 'span',
    render,
    ref,
    props: mergeProps<'span'>(rest, own),
  })
}
