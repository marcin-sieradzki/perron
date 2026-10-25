'use client'
// DataStateKey: the key to how sure the map is, each data state's dot and word, its count and one
// sentence saying what it means in the app's own thresholds. A pattern: Perron's VehicleDotLabel
// and Text over plain elements, never Base UI (CR-15). Spec: docs/patterns/data-state-key.md.
import { useMemo } from 'react'
import type { ComponentPropsWithRef, CSSProperties, ReactNode, Ref } from 'react'
import { Text } from '../../components/Text/Text.tsx'
import type { TextProps } from '../../components/Text/Text.tsx'
import { VehicleDotLabel } from '../../components/VehicleDotLabel/VehicleDotLabel.tsx'
import type { VehicleDotLabelProps } from '../../components/VehicleDotLabel/VehicleDotLabel.tsx'
import { useLocale, useOwnedStrings } from '../../PerronProvider.tsx'
import { classes, known } from '../../internal/nodes.ts'
import { grouped } from '../../internal/numbers.ts'
import { interpolate } from '../../internal/strings.ts'
import { STATE_KEY, VEHICLE_STATES } from '../../internal/vehicle-states.ts'
import type { VehicleState } from '../../internal/vehicle-states.ts'
import { UnknownValue } from '../../internal/UnknownValue.tsx'
import './DataStateKey.css'

/** How many vehicles are in each data state, as DataStateKey's `counts` takes them. */
export interface DataStateKeyCounts {
  /** Optional. How many vehicles are live: a report younger than the live threshold */
  live?: number | null
  /** Optional. How many are ageing: a report past the live threshold, under the ageing one */
  ageing?: number | null
  /** Optional. How many are estimated: placed from the timetable and the latest delay */
  estimated?: number | null
  /** Optional. How many are timetable only: no real-time data at all */
  timetableOnly?: number | null
  /** Optional. How many have no signal: silent past the ageing threshold */
  noSignal?: number | null
}

export interface DataStateKeyProps extends Omit<ComponentPropsWithRef<'ul'>, 'children'> {
  /**
   * How many vehicles are in each data state, such as `{ live: 412, ageing: 38, estimated: 61,
   * timetableOnly: 9, noSignal: 3 }`. Required. A state left out, `null` or not a finite number is
   * unknown, and shows "—" and says "Unknown".
   */
  counts: DataStateKeyCounts
  /**
   * The app's live threshold in milliseconds, the age under which a report is live, such as
   * `150000`, filled into the live and ageing sentences as "2.5 min". Required: each app sets its
   * own from its feed. Not finite or below 0, each sentence that holds it shows "—" and
   * says "Unknown" in its place.
   */
  liveThreshold: number
  /**
   * The app's ageing threshold in milliseconds, the age past which a vehicle has no signal, such
   * as `300000`, filled into the ageing and no-signal sentences as "5 min". Required, as
   * `liveThreshold` is. Not finite or below 0, each sentence that holds it shows "—" and
   * says "Unknown" in its place.
   */
  ageingThreshold: number
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
   * Overrides "Reported by the vehicle in the last {liveThreshold}", the live sentence;
   * `{liveThreshold}` is the live threshold
   * @default The locale's
   */
  liveDescriptionLabel?: string
  /**
   * Overrides "Last reported {liveThreshold} to {ageingThreshold} ago", the ageing sentence;
   * `{liveThreshold}` and `{ageingThreshold}` are the two thresholds
   * @default The locale's
   */
  ageingDescriptionLabel?: string
  /**
   * Overrides "Placed from the timetable and the latest delay", the estimated sentence
   * @default The locale's
   */
  estimatedDescriptionLabel?: string
  /**
   * Overrides "No real-time data, placed from the timetable alone", the timetable-only sentence
   * @default The locale's
   */
  timetableOnlyDescriptionLabel?: string
  /**
   * Overrides "Moved on by the timetable, with no report for over {ageingThreshold}", the no-signal
   * sentence; `{ageingThreshold}` is the ageing threshold
   * @default The locale's
   */
  noSignalDescriptionLabel?: string
  /**
   * Overrides "{seconds} s", a threshold under 2 min; `{seconds}` is its whole seconds
   * @default The locale's
   */
  secondsDurationLabel?: string
  /**
   * Overrides "{minutes} min", a threshold of 2 min or more; `{minutes}` is its minutes, to one
   * decimal place
   * @default The locale's
   */
  minutesDurationLabel?: string
  /**
   * Overrides "Unknown", heard in place of "—" for a count no data gives, and in place of a sentence whose threshold no data gives
   * @default The locale's
   */
  unknownLabel?: string
  /** Joined after `pn-DataStateKey` on the root */
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
    /** Props for every `description` part, each sentence's Text: a `className` */
    description?: Omit<TextProps, 'variant' | 'color' | 'emphasis' | 'children' | 'render'>
  }
}

/** The seconds from which a threshold is written in minutes (CR-7). */
const IN_MINUTES_FROM = 120

/** The owned string of a state's sentence: `liveDescription` to `noSignalDescription` (CR-6). */
const descriptionKey = (state: VehicleState) => `${STATE_KEY[state]}Description` as const

/**
 * A threshold as its sentence shows it (CR-7): its unit chosen from its seconds rounded to a whole
 * number, under 2 min those seconds, "60 s", from 2 min on its minutes to one decimal place,
 * "2.5 min", in the locale's decimal mark; `null` when it is not finite or below 0, so the sentences
 * that hold it say "Unknown" in its place.
 */
function threshold(
  ms: number,
  strings: ReturnType<typeof useOwnedStrings>,
  format: Intl.NumberFormat,
): ReactNode {
  if (!known(ms) || ms < 0) return null
  // `|| 0` writes a rounded -0 as 0
  const seconds = Math.round(ms / 1000) || 0
  return seconds < IN_MINUTES_FROM
    ? interpolate(strings.secondsDuration, { seconds: format.format(seconds) })
    : interpolate(strings.minutesDuration, {
        minutes: format.format(Math.round(ms / 6000) / 10),
      })
}

/**
 * A state's sentence with its thresholds filled in (CR-6), or "—" heard as "Unknown" in place of
 * the whole sentence when a threshold it holds is unknown (CR-7).
 */
function sentence(
  template: string,
  figures: Readonly<Record<string, ReactNode>>,
  unknownLabel: string,
): ReactNode {
  const missing = Object.entries(figures).some(
    ([name, figure]) => figure === null && template.includes(`{${name}}`),
  )
  return missing ? <UnknownValue label={unknownLabel} /> : interpolate(template, figures)
}

/**
 * The key to how sure the map is: the five data states, each with its dot and word, how many
 * vehicles are in it, and one sentence saying what it means in the app's own thresholds. Name it
 * with `aria-labelledby` from the heading beside it.
 */
export function DataStateKey({
  counts,
  liveThreshold,
  ageingThreshold,
  liveLabel,
  ageingLabel,
  estimatedLabel,
  timetableOnlyLabel,
  noSignalLabel,
  liveDescriptionLabel,
  ageingDescriptionLabel,
  estimatedDescriptionLabel,
  timetableOnlyDescriptionLabel,
  noSignalDescriptionLabel,
  secondsDurationLabel,
  minutesDurationLabel,
  unknownLabel,
  slotProps,
  className,
  ref,
  ...rest
}: DataStateKeyProps) {
  // CR-8: the sentences, the durations and the unknown word, with this instance's overrides laid
  // over them; the state words are VehicleDotLabel's own
  const strings = useOwnedStrings({
    liveDescription: liveDescriptionLabel,
    ageingDescription: ageingDescriptionLabel,
    estimatedDescription: estimatedDescriptionLabel,
    timetableOnlyDescription: timetableOnlyDescriptionLabel,
    noSignalDescription: noSignalDescriptionLabel,
    secondsDuration: secondsDurationLabel,
    minutesDuration: minutesDurationLabel,
    unknown: unknownLabel,
  })
  // CR-7: the figures in the locale's decimal mark, at most one fraction digit and no grouping,
  // built once per locale, as Slider builds its formatter
  const locale = useLocale()
  const format = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 1, useGrouping: false }),
    [locale],
  )
  const figures = {
    liveThreshold: threshold(liveThreshold, strings, format),
    ageingThreshold: threshold(ageingThreshold, strings, format),
  }
  const {
    item: itemProps,
    label: labelProps,
    count: countProps,
    description: descriptionProps,
  } = slotProps ?? {}

  return (
    // CR-11: the rest props first, then the root's own class, ref and children, so its own win
    <ul {...rest} className={classes('pn-DataStateKey', className)} ref={ref}>
      {/* CR-1, CR-2: always the five states, in the order of Data states, none picked, hidden or
          reordered; CR-4: each state's field in counts is its key */}
      {VEHICLE_STATES.map((variant) => {
        const count = counts[STATE_KEY[variant]]
        // CR-5: left out, null or not finite is unknown; 0 is a count
        const unknown = !known(count)
        return (
          // CR-2, CR-14: the slot's props, then the item's own class and attributes over them
          <li
            key={variant}
            {...itemProps}
            className={classes('pn-DataStateKey-item', itemProps?.className)}
            data-variant={variant}
            data-unknown={unknown ? '' : undefined}
          >
            {/* CR-3: no line, so the dot draws in the word's ink; CR-8: each label shows only
                its own state's word */}
            <VehicleDotLabel
              {...labelProps}
              className={classes('pn-DataStateKey-label', labelProps?.className)}
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
              className={classes('pn-DataStateKey-count', countProps?.className)}
              data-unknown={unknown ? '' : undefined}
            >
              {/* CR-4: grouped by a no-break space; CR-5: "—" for the eye, the word for the ear */}
              {unknown ? <UnknownValue label={strings.unknown} /> : grouped(count as number)}
            </span>{' '}
            {/* CR-6: the state's sentence, its thresholds filled in, in Text's caption */}
            <Text
              {...descriptionProps}
              className={classes('pn-DataStateKey-description', descriptionProps?.className)}
              variant="caption"
              color="neutral"
              emphasis="secondary"
            >
              {sentence(strings[descriptionKey(variant)], figures, strings.unknown)}
            </Text>
          </li>
        )
      })}
    </ul>
  )
}
