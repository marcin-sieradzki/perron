'use client'
// VehicleDotLegend: the key to the vehicle dots, the five data states as a list of dots beside their
// words. No Base UI component: a <ul> rendered through useRender, so the contract's render prop
// works (docs/components/vehicle-dot-legend.md).
import type { CSSProperties, Ref } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import { STATE_KEY, VEHICLE_STATES } from '../../internal/vehicle-states.ts'
import { VehicleDot } from '../VehicleDot/VehicleDot.tsx'
import './VehicleDotLegend.css'

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
  /** Merged after `pn-VehicleDotLegend` on the root */
  className?: string
  /** Reaches the root */
  style?: CSSProperties
  /** Reaches the root */
  ref?: Ref<HTMLUListElement>
}

/**
 * The key to the vehicle dots: the five data states, each as its dot's shape beside its word, in
 * the order Data states lists them. Name the list with `aria-label` where it stands alone.
 */
export function VehicleDotLegend({
  liveLabel,
  ageingLabel,
  estimatedLabel,
  timetableOnlyLabel,
  noSignalLabel,
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
  })
  const own = {
    className: 'pn-VehicleDotLegend',
    // CR-1, CR-2: the five states in the order Data states lists them, none picked, hidden or
    // reordered, each a hidden dot then its word; the dot has no line, so it draws in the
    // legend's ink (CR-3)
    children: VEHICLE_STATES.map((variant) => (
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
