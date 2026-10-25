// ReportStrip: how a set of vehicles is reporting right now, each data state's count beside its
// dot and word, in one row that wraps between items. A pattern: Perron's VehicleDotLabel over plain
// elements, never Base UI (CR-13). Spec: docs/patterns/report-strip.md.
import type { ComponentPropsWithRef, CSSProperties, Ref } from 'react'
import { VehicleDotLabel } from '../../components/VehicleDotLabel/VehicleDotLabel.tsx'
import type { VehicleDotLabelProps } from '../../components/VehicleDotLabel/VehicleDotLabel.tsx'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import { classes, known } from '../../internal/nodes.ts'
import { grouped } from '../../internal/numbers.ts'
import { STATE_KEY, VEHICLE_STATES } from '../../internal/vehicle-states.ts'
import { UnknownValue } from '../../internal/UnknownValue.tsx'
import './ReportStrip.css'

/** How many vehicles are in each data state, as ReportStrip's `counts` takes them. */
export interface ReportStripCounts {
  /** Optional. How many vehicles are live: a report under a minute old */
  live?: number | null
  /** Optional. How many are ageing: a report 1 to 5 minutes old */
  ageing?: number | null
  /** Optional. How many are estimated: placed from the timetable and the latest delay */
  estimated?: number | null
  /** Optional. How many are timetable only: no real-time data at all */
  timetableOnly?: number | null
  /** Optional. How many have no signal: silent for over 5 minutes */
  noSignal?: number | null
}

export interface ReportStripProps extends Omit<ComponentPropsWithRef<'ul'>, 'children'> {
  /**
   * How many vehicles are in each data state, such as `{ live: 1046, ageing: 112, estimated: 30,
   * timetableOnly: 12, noSignal: 4 }`. Required. A state left out, `null` or not a finite number
   * is unknown, and shows "—" and says "Unknown".
   */
  counts: ReportStripCounts
  /**
   * Overrides "Live", the word beside the live dot; given to that item's VehicleDotLabel
   * @default The locale's
   */
  liveLabel?: string
  /**
   * Overrides "Ageing", the word beside the ageing dot; given to that item's VehicleDotLabel
   * @default The locale's
   */
  ageingLabel?: string
  /**
   * Overrides "Estimated", the word beside the estimated dot; given to that item's VehicleDotLabel
   * @default The locale's
   */
  estimatedLabel?: string
  /**
   * Overrides "Timetable only", the word beside the timetable-only dot; given to that item's
   * VehicleDotLabel
   * @default The locale's
   */
  timetableOnlyLabel?: string
  /**
   * Overrides "No signal", the word beside the no-signal dot; given to that item's VehicleDotLabel
   * @default The locale's
   */
  noSignalLabel?: string
  /**
   * Overrides "Unknown", heard in place of "—" for a count no data gives
   * @default The locale's
   */
  unknownLabel?: string
  /** Joined after `pn-ReportStrip` on the root */
  className?: string
  /** Reaches the root */
  style?: CSSProperties
  /** Reaches the root element */
  ref?: Ref<HTMLUListElement>
  /** Props for each inner part, merged with the part's own, which win: the caller's class follows the part's own. Each key reaches all five copies of its part */
  slotProps?: {
    /** Props for every `item` part, each list item */
    item?: ComponentPropsWithRef<'li'>
    /** Props for every `label` part, each VehicleDotLabel: a `className` */
    label?: Omit<
      VehicleDotLabelProps,
      | 'variant'
      | 'line'
      | 'liveLabel'
      | 'ageingLabel'
      | 'estimatedLabel'
      | 'timetableOnlyLabel'
      | 'noSignalLabel'
      | 'render'
    >
    /** Props for every `count` part, each count */
    count?: ComponentPropsWithRef<'span'>
  }
}

/**
 * How a set of vehicles is reporting right now: how many are in each of the five data states, each
 * count beside its state's dot and word, in one row. Name it with `aria-labelledby` where it
 * stands alone.
 */
export function ReportStrip({
  counts,
  liveLabel,
  ageingLabel,
  estimatedLabel,
  timetableOnlyLabel,
  noSignalLabel,
  unknownLabel,
  slotProps,
  className,
  ref,
  ...rest
}: ReportStripProps) {
  // CR-6: the unknown count's word, with this instance's override laid over it
  const strings = useOwnedStrings({ unknown: unknownLabel })
  const { item: itemProps, label: labelProps, count: countProps } = slotProps ?? {}

  return (
    // CR-9: the rest props first, then the root's own class, ref and children, so its own win
    <ul {...rest} className={classes('pn-ReportStrip', className)} ref={ref}>
      {/* CR-1, CR-2: always the five states, in the order of Data states, none picked, hidden or
          reordered; each state's field in counts is its key */}
      {VEHICLE_STATES.map((variant) => {
        const count = counts[STATE_KEY[variant]]
        // CR-5: left out, null or not finite is unknown; 0 is a count
        const unknown = !known(count)
        return (
          // CR-2, CR-12: the slot's props, then the item's own class and attributes over them
          <li
            key={variant}
            {...itemProps}
            className={classes('pn-ReportStrip-item', itemProps?.className)}
            data-variant={variant}
            data-unknown={unknown ? '' : undefined}
          >
            {/* CR-3: no line, so the dot draws in the word's ink; CR-6: each label shows only
                its own state's word */}
            <VehicleDotLabel
              {...labelProps}
              className={classes('pn-ReportStrip-label', labelProps?.className)}
              variant={variant}
              line={undefined}
              liveLabel={liveLabel}
              ageingLabel={ageingLabel}
              estimatedLabel={estimatedLabel}
              timetableOnlyLabel={timetableOnlyLabel}
              noSignalLabel={noSignalLabel}
            />{' '}
            <span
              {...countProps}
              className={classes('pn-ReportStrip-count', countProps?.className)}
              data-unknown={unknown ? '' : undefined}
            >
              {/* CR-4: grouped by a no-break space; CR-5: "—" for the eye, the word for the ear */}
              {unknown ? <UnknownValue label={strings.unknown} /> : grouped(count as number)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
