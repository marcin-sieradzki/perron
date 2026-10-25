// VehicleDotLabel: a vehicle's data state as its dot and its word side by side, such as a solid dot
// and "Live". No Base UI component: a <span> rendered through useRender, so the contract's render
// prop works (docs/components/vehicle-dot-label.md).
import type { CSSProperties, Ref } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import { STATE_KEY } from '../../internal/vehicle-states.ts'
import type { VehicleState } from '../../internal/vehicle-states.ts'
import { VehicleDot } from '../VehicleDot/VehicleDot.tsx'
import './VehicleDotLabel.css'

export interface VehicleDotLabelProps extends Omit<useRender.ComponentProps<'span'>, 'children'> {
  /**
   * How fresh the vehicle's data is, as Data states names it: the dot's shape and the word beside
   * it. Set on the root as `data-variant`, and passed to the dot.
   */
  variant?: VehicleState
  /**
   * The vehicle's line, which gives the dot its colour: a metro line (`m1` to `m4`), an S-tog line
   * (`a` to `h`), any bus (`bus`), or any regional or Øresund train (`regional`). Set on the root
   * as `data-line`, and passed to the dot. Left out, with no default, neither sets `data-line` and
   * the dot draws in the word's colour, for a label that stands for a state across many lines.
   */
  line?: 'm1' | 'm2' | 'm3' | 'm4' | 'a' | 'b' | 'c' | 'e' | 'f' | 'h' | 'bus' | 'regional'
  /**
   * Overrides "Live", the word shown when `variant='live'`
   * @default The locale's
   */
  liveLabel?: string
  /**
   * Overrides "Ageing", the word shown when `variant='ageing'`
   * @default The locale's
   */
  ageingLabel?: string
  /**
   * Overrides "Estimated", the word shown when `variant='estimated'`
   * @default The locale's
   */
  estimatedLabel?: string
  /**
   * Overrides "Timetable only", the word shown when `variant='timetable-only'`
   * @default The locale's
   */
  timetableOnlyLabel?: string
  /**
   * Overrides "No signal", the word shown when `variant='no-signal'`
   * @default The locale's
   */
  noSignalLabel?: string
  /** Merged after `pn-VehicleDotLabel` on the root */
  className?: string
  /** Reaches the root */
  style?: CSSProperties
  /** Reaches the root */
  ref?: Ref<HTMLSpanElement>
}

/**
 * A vehicle's data state as its dot and its word side by side, for rows, tables and strips that
 * say how fresh a vehicle's data is. The word is read; the dot is hidden, since it says the same.
 */
export function VehicleDotLabel({
  variant = 'live',
  line,
  liveLabel,
  ageingLabel,
  estimatedLabel,
  timetableOnlyLabel,
  noSignalLabel,
  render,
  ref,
  ...rest
}: VehicleDotLabelProps) {
  // CR-4: the owned strings, with this instance's *Label props laid over them
  const strings = useOwnedStrings({
    live: liveLabel,
    ageing: ageingLabel,
    estimated: estimatedLabel,
    timetableOnly: timetableOnlyLabel,
    noSignal: noSignalLabel,
  })
  const word = strings[STATE_KEY[variant]]
  // CR-3: data-variant always, its default included; data-line only when a line is given
  const own = {
    className: 'pn-VehicleDotLabel',
    'data-variant': variant,
    'data-line': line,
    // CR-1, CR-2: the dot first, in reading order, hidden; given the same overrides, so its name
    // and the word are one string
    children: (
      <>
        <VehicleDot
          variant={variant}
          line={line}
          size="small"
          aria-hidden
          className="pn-VehicleDotLabel-dot"
          liveLabel={liveLabel}
          ageingLabel={ageingLabel}
          estimatedLabel={estimatedLabel}
          timetableOnlyLabel={timetableOnlyLabel}
          noSignalLabel={noSignalLabel}
        />
        <span className="pn-VehicleDotLabel-label">{word}</span>
      </>
    ),
  }
  return useRender({
    defaultTagName: 'span',
    render,
    ref,
    // CR-7: the rest props first, so the class, data attributes and children win over them, while
    // a caller's aria-hidden still reaches the root; mergeProps puts the rightmost class first, so
    // pn-VehicleDotLabel leads the caller's
    props: mergeProps<'span'>(rest, own),
  })
}
