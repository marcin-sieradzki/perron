// Meter: a bar that shows where one measured value sits within a known range, with the words that
// name it and the figure it reaches, such as "Reporting live" at "82%". Base UI's Meter gives the
// role, the aria-value* attributes, the clamping, the formatting and the label's id; nothing here
// rebuilds them (CR-1). Spec: docs/components/meter.md.
import { mergeProps } from '@base-ui/react/merge-props'
import { Meter as BaseMeter } from '@base-ui/react/meter'
import type { CSSProperties, ReactNode, Ref } from 'react'
import { useLocale, useOwnedStrings } from '../../PerronProvider.tsx'
import { classes, known, withClass } from '../../internal/nodes.ts'
import { UNKNOWN } from '../../internal/UnknownValue.tsx'
import './Meter.css'

export interface MeterProps extends Omit<
  BaseMeter.Root.Props,
  'value' | 'children' | 'locale' | 'color' | 'className' | 'style' | 'ref'
> {
  /**
   * Required. What the meter measures, in a few words, such as "Reporting live", shown above the
   * track and the meter's accessible name; a `meter` with no name fails axe's `aria-meter-name`,
   * and Stat's `label` is required for the same reason.
   */
  label: ReactNode
  /**
   * Required. The measured value, between `min` and `max`; one outside them is shown at the
   * nearest end. `null`, or a number that is not finite, when no data gives it: Meter then shows
   * "—" over an empty track and says "Unknown" (CR-5)
   */
  value: number | null
  /**
   * The intent: what the fill means. `neutral` is a plain measure in ink; the status intents tint
   * the fill for a value that is good or bad news, such as the live share's. Always beside words
   * that say what the value means: colour is never the only sign
   * @default 'neutral'
   */
  color?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
  /**
   * The locale `Intl.NumberFormat` formats the figure in: "82%" in English, "82 %" in Danish,
   * Swedish and Norwegian. Left out, the nearest PerronProvider's
   * @default The PerronProvider's locale
   */
  locale?: Intl.LocalesArgument
  /**
   * Overrides "Unknown", heard in place of the figure when the value is unknown
   * @default The locale's
   */
  unknownLabel?: string
  /** Joined after `pn-Meter` on the root */
  className?: string
  /** Reaches the root */
  style?: CSSProperties
  /** Reaches the root element */
  ref?: Ref<HTMLDivElement>
  /** Props for each inner part, merged with the part's own, which win */
  slotProps?: {
    /** Props for the `label` part */
    label?: BaseMeter.Label.Props
    /**
     * Props for the `value` part. Its function `children` writes the figure from
     * `(formattedValue, value)` while the value is known
     */
    value?: BaseMeter.Value.Props
    /** Props for the `track` part */
    track?: BaseMeter.Track.Props
    /** Props for the `indicator` part */
    indicator?: BaseMeter.Indicator.Props
  }
}

/**
 * A bar that shows where one measured value sits within a known range, with the words that name
 * it and the figure it reaches. With no value it shows "—" over an empty track and says "Unknown".
 */
export function Meter({
  label,
  value,
  color = 'neutral',
  locale,
  unknownLabel,
  slotProps,
  className,
  ref,
  ...rest
}: MeterProps) {
  const strings = useOwnedStrings({ unknown: unknownLabel })
  const providerLocale = useLocale()
  // CR-5: null, NaN and ±Infinity say nothing; 0 is a value
  const unknown = !known(value)
  const dataUnknown = unknown ? { 'data-unknown': '' } : {}

  // CR-3: each part's slotProps merged under its own props, which win; its class set after the
  // merge, since mergeProps joins only strings and a Base UI className may be a function
  const indicator = (
    <BaseMeter.Indicator
      {...mergeProps<typeof BaseMeter.Indicator>(slotProps?.indicator, undefined)}
      className={withClass('pn-Meter-indicator', slotProps?.indicator?.className)}
    />
  )

  return (
    <BaseMeter.Root
      {...rest}
      ref={ref}
      // CR-5: an unknown value reaches Base UI as min, so the fill is empty
      value={unknown ? (rest.min ?? 0) : (value as number)}
      // CR-11: the caller's locale, or the PerronProvider's, never the runtime's
      locale={locale ?? providerLocale}
      className={classes('pn-Meter', className)}
      // CR-2: always, the default included
      data-color={color}
      {...dataUnknown}
      // CR-5: after the rest, so it wins over a caller's aria-valuetext and getAriaValueText
      {...(unknown && { 'aria-valuetext': strings.unknown })}
    >
      <BaseMeter.Label
        {...mergeProps<typeof BaseMeter.Label>(slotProps?.label, { children: label })}
        className={withClass('pn-Meter-label', slotProps?.label?.className)}
      />
      <BaseMeter.Value
        {...mergeProps<typeof BaseMeter.Value>(
          slotProps?.value,
          // CR-5: Base UI shows only a function's children, so the "—" comes from one
          unknown ? { ...dataUnknown, children: () => UNKNOWN } : undefined,
        )}
        className={withClass('pn-Meter-value', slotProps?.value?.className)}
      />
      <BaseMeter.Track
        {...mergeProps<typeof BaseMeter.Track>(slotProps?.track, { children: indicator })}
        className={withClass('pn-Meter-track', slotProps?.track?.className)}
      />
    </BaseMeter.Root>
  )
}
