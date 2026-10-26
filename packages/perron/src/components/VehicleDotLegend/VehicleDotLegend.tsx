'use client'
// VehicleDotLegend: the key to the vehicle dots, the five data states as a list of dots beside their
// words, and the aircraft glyph beside "Planes" when asked. No Base UI component: a <ul> rendered
// through useRender, so the contract's render prop works (docs/components/vehicle-dot-legend.md).
import type { CSSProperties, Ref } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import { STATE_KEY, VEHICLE_STATES } from '../../internal/vehicle-states.ts'
import { VehicleDot } from '../VehicleDot/VehicleDot.tsx'
import './VehicleDotLegend.css'

/**
 * The `aircraft` icon from packages/perron/icons/, inlined unchanged but for width, height and
 * xmlns, hidden, since the word beside it names it. The CSS fills its outline, as a live aircraft
 * is drawn on the map (CR-10). It never changes, so it is made once.
 */
const AIRCRAFT = (
  // icons/aircraft.svg
  <svg
    className="perron-icon pn-VehicleDotLegend-aircraft"
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7 1C7.75 1 8.25 1.75 8.25 2.75V5L13 8V9.25L8.25 8.25V10.25L10.4 11.75V13L7 12.3L3.6 13V11.75L5.75 10.25V8.25L1 9.25V8L5.75 5V2.75C5.75 1.75 6.25 1 7 1Z" />
  </svg>
)

export interface VehicleDotLegendProps extends Omit<useRender.ComponentProps<'ul'>, 'children'> {
  /**
   * Overrides "Live", the word shown beside the live dot
   * @default The locale's
   */
  liveLabel?: string
  /**
   * Overrides "Ageing", the word shown beside the ageing dot
   * @default The locale's
   */
  ageingLabel?: string
  /**
   * Overrides "Estimated", the word shown beside the estimated dot
   * @default The locale's
   */
  estimatedLabel?: string
  /**
   * Overrides "Timetable only", the word shown beside the timetable-only dot
   * @default The locale's
   */
  timetableOnlyLabel?: string
  /**
   * Overrides "No signal", the word shown beside the no-signal dot
   * @default The locale's
   */
  noSignalLabel?: string
  /**
   * Adds the aircraft, the `aircraft` glyph beside "Planes", after the five states, for a map that
   * shows aircraft
   */
  aircraftVisible?: boolean
  /**
   * Overrides "Planes", the word shown beside the aircraft glyph when `aircraftVisible` is set
   * @default The locale's
   */
  aircraftLabel?: string
  /** Merged after `pn-VehicleDotLegend` on the root */
  className?: string
  /** Reaches the root */
  style?: CSSProperties
  /** Reaches the root */
  ref?: Ref<HTMLUListElement>
}

/**
 * The key to the vehicle dots: the five data states, each as its dot's shape beside its word, in
 * the order Data states lists them, then the aircraft when `aircraftVisible` is set. Name the list
 * with `aria-label` where it stands alone.
 */
export function VehicleDotLegend({
  liveLabel,
  ageingLabel,
  estimatedLabel,
  timetableOnlyLabel,
  noSignalLabel,
  aircraftVisible = false,
  aircraftLabel,
  render,
  ref,
  ...rest
}: VehicleDotLegendProps) {
  // CR-2: the owned strings, with this instance's *Label props laid over them
  const strings = useOwnedStrings({
    live: liveLabel,
    ageing: ageingLabel,
    estimated: estimatedLabel,
    timetableOnly: timetableOnlyLabel,
    noSignal: noSignalLabel,
    aircraft: aircraftLabel,
  })
  const own = {
    className: 'pn-VehicleDotLegend',
    // CR-1, CR-2: the five states in the order Data states lists them, none picked, hidden or
    // reordered, each a hidden dot then its word; the dot has no line, so it draws in the
    // legend's ink (CR-3); then, when asked, the aircraft glyph and its word (CR-10)
    children: [
      ...VEHICLE_STATES.map((variant) => (
        <li key={variant} className="pn-VehicleDotLegend-item">
          <VehicleDot
            variant={variant}
            size="small"
            aria-hidden
            className="pn-VehicleDotLegend-dot"
          />
          <span className="pn-VehicleDotLegend-label">{strings[STATE_KEY[variant]]}</span>
        </li>
      )),
      aircraftVisible && (
        <li key="aircraft" className="pn-VehicleDotLegend-item">
          {AIRCRAFT}
          <span className="pn-VehicleDotLegend-label">{strings.aircraft}</span>
        </li>
      ),
    ],
  }
  return useRender({
    defaultTagName: 'ul',
    render,
    ref,
    // CR-6: the rest props first, so the class and the items win over them; mergeProps puts the
    // rightmost class first, so pn-VehicleDotLegend leads the caller's
    props: mergeProps<'ul'>(rest, own),
  })
}
