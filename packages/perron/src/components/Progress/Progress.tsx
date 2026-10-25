// Progress: a bar that shows how far a task has got, such as an export, with the words that name
// the task and the share done, such as "Exporting the report" at "45%", or, while how far is not
// known, a segment that sweeps along the track and the words "In progress". Base UI's Progress
// gives the role, the aria-value* attributes, the clamping, the status attributes, the formatting
// and the label's id; nothing here rebuilds them (CR-1). Spec: docs/components/progress.md.
import { mergeProps } from '@base-ui/react/merge-props'
import { Progress as BaseProgress } from '@base-ui/react/progress'
import type { CSSProperties, ReactNode, Ref } from 'react'
import { useLocale, useOwnedStrings } from '../../PerronProvider.tsx'
import { classes, known, withClass } from '../../internal/nodes.ts'
import './Progress.css'

export interface ProgressProps extends Omit<
  BaseProgress.Root.Props,
  'value' | 'children' | 'locale' | 'className' | 'style' | 'ref'
> {
  /**
   * The task, in a few words, such as "Exporting the report": shown above the track, and the
   * progress bar's accessible name. Required
   */
  label: ReactNode
  /**
   * Required. How far the task has got, between `min` and `max`; one outside them is shown at the
   * nearest end. `null`, or a number that is not finite, while how far is not known: Progress then
   * sweeps a segment along the track and says "In progress" (CR-5)
   */
  value: number | null
  /**
   * The locale `Intl.NumberFormat` formats the figure in: "45%" in English, "45 %" in Danish,
   * Swedish and Norwegian. Left out, the nearest PerronProvider's
   * @default The PerronProvider's locale
   */
  locale?: Intl.LocalesArgument
  /**
   * Overrides "In progress", heard in place of the figure while the value is indeterminate
   * @default The locale's
   */
  inProgressLabel?: string
  /** Joined after `pn-Progress` on the root */
  className?: string
  /** Reaches the root */
  style?: CSSProperties
  /** Reaches the root element */
  ref?: Ref<HTMLDivElement>
  /** Props for each inner part, merged with the part's own, which win */
  slotProps?: {
    /** Props for the `label` part */
    label?: BaseProgress.Label.Props
    /**
     * Props for the `value` part. Its function `children` writes the figure from
     * `(formattedValue, value)` while the value is known
     */
    value?: BaseProgress.Value.Props
    /** Props for the `track` part */
    track?: BaseProgress.Track.Props
    /** Props for the `indicator` part */
    indicator?: BaseProgress.Indicator.Props
  }
}

/** CR-5: the value part's children while indeterminate, so the row shows the label alone. */
const nothing = () => null

/**
 * A bar that shows how far a task has got, with the words that name the task and the share done.
 * With no value it sweeps a segment along the track and says "In progress".
 */
export function Progress({
  label,
  value,
  locale,
  inProgressLabel,
  slotProps,
  className,
  ref,
  ...rest
}: ProgressProps) {
  const strings = useOwnedStrings({ inProgress: inProgressLabel })
  const providerLocale = useLocale()
  // CR-5: null, NaN and ±Infinity are indeterminate, as Base UI takes them; 0 is a value
  const indeterminate = !known(value)

  // CR-3: each part's slotProps merged under its own props, which win; its class set after the
  // merge, since mergeProps joins only strings and a Base UI className may be a function
  const indicator = (
    <BaseProgress.Indicator
      {...slotProps?.indicator}
      className={withClass('pn-Progress-indicator', slotProps?.indicator?.className)}
    />
  )

  return (
    <BaseProgress.Root
      {...rest}
      ref={ref}
      // CR-5: as it is; Base UI tells a known value from an indeterminate one the same way
      value={value}
      // CR-11: the caller's locale, or the PerronProvider's, never the runtime's
      locale={locale ?? providerLocale}
      className={classes('pn-Progress', className)}
      // CR-5: after the rest, so it wins over Base UI's English, a caller's aria-valuetext and
      // getAriaValueText, which describe a known value
      {...(indeterminate && { 'aria-valuetext': strings.inProgress })}
    >
      <BaseProgress.Label
        {...mergeProps<typeof BaseProgress.Label>(slotProps?.label, { children: label })}
        className={withClass('pn-Progress-label', slotProps?.label?.className)}
      />
      <BaseProgress.Value
        {...mergeProps<typeof BaseProgress.Value>(
          slotProps?.value,
          // CR-5: so Base UI's English "indeterminate" never reaches a caller's function
          indeterminate ? { children: nothing } : undefined,
        )}
        className={withClass('pn-Progress-value', slotProps?.value?.className)}
      />
      <BaseProgress.Track
        {...mergeProps<typeof BaseProgress.Track>(slotProps?.track, { children: indicator })}
        className={withClass('pn-Progress-track', slotProps?.track?.className)}
      />
    </BaseProgress.Root>
  )
}
