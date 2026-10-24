// A made-up component in the contract's shape, for component-page.test.ts: its props table is read
// from this file's docgen as Storybook reads a real component's.
import { Meter } from '@base-ui/react/meter'
import type { ReactNode, Ref } from 'react'

export interface GaugeProps extends Omit<Meter.Root.Props, 'className'> {
  /** How the gauge is drawn. */
  variant?: 'bar' | 'ring'
  /** The label read with the value. */
  label: ReactNode
  /** Overrides "Loading". */
  loadingLabel?: string
  /** A class for the root, merged after `pn-Gauge`. */
  className?: string
  ref?: Ref<HTMLDivElement>
  /** Props for the inner parts. */
  slotProps?: {
    track?: Meter.Track.Props
    indicator?: Meter.Indicator.Props
  }
  /** Whether the gauge is greyed out. */
  disabled?: boolean
}

export function Gauge({
  variant = 'bar',
  label,
  loadingLabel,
  className,
  slotProps,
  disabled = false,
  ...rest
}: GaugeProps) {
  return (
    <Meter.Root
      {...rest}
      className={['pn-Gauge', className].filter(Boolean).join(' ')}
      data-variant={variant}
      data-disabled={disabled || undefined}
    >
      {label}
      {loadingLabel}
      <Meter.Track {...slotProps?.track}>
        <Meter.Indicator {...slotProps?.indicator} />
      </Meter.Track>
    </Meter.Root>
  )
}
