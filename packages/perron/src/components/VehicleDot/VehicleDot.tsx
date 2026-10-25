'use client'
// VehicleDot: one vehicle drawn as a dot in its line's colour, its shape saying how fresh the
// vehicle's data is. No Base UI component: a <span role="img"> rendered through useRender, so the
// contract's render prop works (docs/components/vehicle-dot.md).
import type { CSSProperties, Ref } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import { STATE_KEY } from '../../internal/vehicle-states.ts'
import type { VehicleState } from '../../internal/vehicle-states.ts'
import './VehicleDot.css'

/**
 * The glyph: an `<svg>` holding the one `<circle>`, drawn by the CSS for each state. The root
 * names the dot, so the glyph is hidden (CR-6). It never changes, so it is made once.
 */
const GLYPH = (
  <svg className="pn-VehicleDot-glyph" aria-hidden="true" focusable="false">
    <circle className="pn-VehicleDot-dot" />
  </svg>
)

export interface VehicleDotProps extends Omit<useRender.ComponentProps<'span'>, 'children'> {
  /**
   * How fresh the vehicle's data is: a solid dot, a fainter dot, a ring, a dashed ring, or a grey
   * dot cut by a slash, as Data states names them. Set on the root as `data-variant`.
   */
  variant?: VehicleState
  /**
   * The vehicle's line, which gives the dot its colour: a metro line (`m1` to `m4`), an S-tog line
   * (`a` to `h`), any bus (`bus`), or any regional or Øresund train (`regional`). Set on the root
   * as `data-line`. Left out, with no default, the root sets no `data-line` and the dot draws in
   * the colour of the text around it, for a dot that stands for a state across many lines.
   */
  line?: 'm1' | 'm2' | 'm3' | 'm4' | 'a' | 'b' | 'c' | 'e' | 'f' | 'h' | 'bus' | 'regional'
  /**
   * The glyph box, at the icon size for where it sits: `small` beside caption and label text;
   * `medium` inside controls and rows; `large` beside a panel title. Set on the root as `data-size`.
   */
  size?: 'small' | 'medium' | 'large'
  /**
   * Overrides "Live", heard as the dot's name when `variant='live'`
   * @default The locale's
   */
  liveLabel?: string
  /**
   * Overrides "Ageing", heard as the dot's name when `variant='ageing'`
   * @default The locale's
   */
  ageingLabel?: string
  /**
   * Overrides "Estimated", heard as the dot's name when `variant='estimated'`
   * @default The locale's
   */
  estimatedLabel?: string
  /**
   * Overrides "Timetable only", heard as the dot's name when `variant='timetable-only'`
   * @default The locale's
   */
  timetableOnlyLabel?: string
  /**
   * Overrides "No signal", heard as the dot's name when `variant='no-signal'`
   * @default The locale's
   */
  noSignalLabel?: string
  /** Merged after `pn-VehicleDot` on the root */
  className?: string
  /** Reaches the root */
  style?: CSSProperties
  /** Reaches the root */
  ref?: Ref<HTMLSpanElement>
}

/**
 * One vehicle as a dot in its line's colour, its shape saying how fresh the vehicle's data is,
 * named by that state for a screen reader. Write the state in words beside it too.
 */
export function VehicleDot({
  variant = 'live',
  line,
  size = 'medium',
  liveLabel,
  ageingLabel,
  estimatedLabel,
  timetableOnlyLabel,
  noSignalLabel,
  render,
  ref,
  ...rest
}: VehicleDotProps) {
  const strings = useOwnedStrings({
    live: liveLabel,
    ageing: ageingLabel,
    estimated: estimatedLabel,
    timetableOnly: timetableOnlyLabel,
    noSignal: noSignalLabel,
  })
  const own = {
    className: 'pn-VehicleDot',
    role: 'img',
    'aria-label': strings[STATE_KEY[variant]],
    'data-variant': variant,
    'data-line': line,
    'data-size': size,
    children: GLYPH,
  }
  return useRender({
    defaultTagName: 'span',
    render,
    ref,
    // the rest props first, so the class, role, name and data attributes win over them, while a
    // caller's aria-hidden still reaches the root (CR-6, CR-10); mergeProps puts the rightmost
    // class first, so pn-VehicleDot leads the caller's
    props: mergeProps<'span'>(rest, own),
  })
}
