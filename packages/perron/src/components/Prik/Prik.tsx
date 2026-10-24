// Prik: one vehicle drawn as a dot in its line colour, its shape saying how fresh the vehicle's
// data is. A static glyph with no Base UI part; the spec is docs/components/prik.md.
import type { ComponentProps } from 'react'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import type { OwnedStringKey } from '../../locale/index.ts'
import './Prik.css'

// No children: a glyph has no content. No `color`: the SVG attribute would mean nothing here, the
// line gives the colour, and `color` stays the contract's intent.
export interface PrikProps extends Omit<ComponentProps<'svg'>, 'children' | 'color'> {
  /**
   * How fresh the vehicle's data is: a solid dot, a fainter dot, a ring, a dashed ring or a grey
   * dot.
   */
  variant?: 'live' | 'ageing' | 'estimated' | 'timetable-only' | 'no-signal'
  /**
   * The vehicle's line, which gives the dot its colour: a metro or S-tog line, or every bus or
   * every regional train.
   */
  line: 'm1' | 'm2' | 'm3' | 'm4' | 'a' | 'b' | 'c' | 'e' | 'f' | 'h' | 'bus' | 'regional'
  /**
   * The glyph box: `icon.size.325` beside caption text, `icon.size.400` beside label text,
   * `icon.size.450` in larger rows.
   */
  size?: 'small' | 'medium' | 'large'
  /** Overrides "Live". */
  liveLabel?: string
  /** Overrides "Ageing". */
  ageingLabel?: string
  /** Overrides "Estimated". */
  estimatedLabel?: string
  /** Overrides "Timetable only". */
  timetableOnlyLabel?: string
  /** Overrides "No signal". */
  noSignalLabel?: string
}

/** The owned string that names each data state (CR-6). */
const LABEL = {
  live: 'live',
  ageing: 'ageing',
  estimated: 'estimated',
  'timetable-only': 'timetableOnly',
  'no-signal': 'noSignal',
} as const satisfies Record<NonNullable<PrikProps['variant']>, OwnedStringKey>

/**
 * One vehicle as a dot in its line colour, shaped by its data state, for lists, rows and legends
 * outside the map canvas. It draws the state it is given (CR-3); write the state in words beside
 * it (CR-5), and pass `aria-hidden` when you do, so the word is heard once (CR-6).
 */
export function Prik({
  variant = 'live',
  line,
  size = 'medium',
  liveLabel,
  ageingLabel,
  estimatedLabel,
  timetableOnlyLabel,
  noSignalLabel,
  ref,
  className,
  ...rest
}: PrikProps) {
  const strings = useOwnedStrings({
    live: liveLabel,
    ageing: ageingLabel,
    estimated: estimatedLabel,
    timetableOnly: timetableOnlyLabel,
    noSignal: noSignalLabel,
  })
  return (
    <svg
      {...rest}
      ref={ref}
      role="img"
      aria-label={strings[LABEL[variant]]}
      data-variant={variant}
      data-line={line}
      data-size={size}
      className={className ? `pn-Prik ${className}` : 'pn-Prik'}
    >
      <circle className="pn-Prik-dot" />
    </svg>
  )
}
