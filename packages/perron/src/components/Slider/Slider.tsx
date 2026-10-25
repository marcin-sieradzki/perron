// Slider: a control for choosing a number, or a range between two numbers, along a track, framed by
// Perron's Field, which gives it its label, its line of help and its error. The root is Base UI's
// Slider.Root, the group that holds the value; Base UI moves, steps, clamps, formats and submits it,
// names it and ties the help and the error to it, and Slider rebuilds none of it (CR-1). The spec is
// docs/components/slider.md.
import { Field as BaseField } from '@base-ui/react/field'
import { mergeProps } from '@base-ui/react/merge-props'
import { Slider as BaseSlider } from '@base-ui/react/slider'
import { useMemo } from 'react'
import type { ReactNode, Ref } from 'react'
import { withClass } from '../../internal/nodes.ts'
import { useLocale, useOwnedStrings } from '../../PerronProvider.tsx'
import { Field } from '../Field/Field.tsx'
import './Slider.css'

export interface SliderProps extends Omit<
  BaseSlider.Root.Props,
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'onValueChange'
  | 'onValueCommitted'
  | 'orientation'
  | 'thumbAlignment'
  | 'locale'
  | 'disabled'
  | 'children'
  | 'ref'
> {
  /**
   * Required. What the number is, in sentence case, such as "Trail length": shown above the
   * slider, and the name of the slider and of each thumb.
   */
  label: ReactNode
  /**
   * Whether the label is heard but not seen. Use it only where the screen around the slider
   * already says what it is for.
   * @default false
   */
  hiddenLabel?: boolean
  /**
   * A line of help between the label and the slider, such as "Minutes of movement drawn behind
   * each vehicle", read after the label by a screen reader. Left out, no description is rendered.
   */
  description?: ReactNode
  /**
   * What is wrong with the value and how to put it right, such as "Choose 8 minutes or fewer".
   * Given, it marks the slider invalid and is shown under it; left out, the slider shows Base UI's
   * own message when its checks fail.
   */
  error?: ReactNode
  /**
   * Whether the slider ignores the person: no thumb takes focus, a press or a key changes nothing,
   * and the label, the help, the fill and the figure turn to the tertiary ink.
   * @default false
   */
  disabled?: boolean
  /**
   * The value, when the caller controls it: a number for one thumb, or a pair for a range, its two
   * thumbs at the lower and the upper end.
   */
  value?: number | readonly [number, number]
  /**
   * The value at first, when the slider keeps it itself: a number, or a pair for a range. Left
   * out, a single thumb starts at `min`.
   */
  defaultValue?: number | readonly [number, number]
  /**
   * Called at every step the value moves, with the new value: by a key (`details.reason`
   * `'keyboard'`), a drag (`'drag'`), a press on the track (`'track-press'`), or a screen reader or
   * the browser setting the hidden range input itself (`'input-change'`); `details.cancel()` keeps
   * the value as it was. `event` is `details.event`, whose `target` holds `value` and `name`, for a
   * form library.
   */
  onChange?: (
    event: Event,
    value: number | readonly [number, number],
    details: BaseSlider.Root.ChangeEventDetails,
  ) => void
  /**
   * Called once the person settles on a value: when a drag ends (`details.reason` `'drag'`), the
   * track is pressed (`'track-press'`), a key is pressed (`'keyboard'`), or a screen reader or the
   * browser sets the hidden range input itself (`'input-change'`). It is not called when the value
   * didn't change. Use it to act once on the final value, such as to fetch, rather than at every
   * step. `event` is `details.event`.
   */
  onChangeCommitted?: (
    event: Event,
    value: number | readonly [number, number],
    details: BaseSlider.Root.CommitEventDetails,
  ) => void
  /**
   * The locale `Intl.NumberFormat` formats the figure and each thumb's value text in: "1.5 km" in
   * English, "1,5 km" in Danish, Swedish and Norwegian. Left out, the nearest PerronProvider's.
   * @default The PerronProvider's locale
   */
  locale?: Intl.LocalesArgument
  /**
   * Overrides "Minimum", the name of a range's lower thumb.
   * @default The locale's
   */
  minimumLabel?: string
  /**
   * Overrides "Maximum", the name of a range's upper thumb.
   * @default The locale's
   */
  maximumLabel?: string
  /** Reaches the root, the `Slider.Root` `<div>`. */
  ref?: Ref<HTMLDivElement>
  /** Props for each inner part, merged with the part's own, which win. */
  slotProps?: {
    /**
     * Props for the `field` part, the frame: Base UI's `invalid`, `validate`, `validationMode`,
     * `validationDebounceTime`, `dirty`, `touched` and `actionsRef`, and a `className` or `style`
     * for the frame.
     */
    field?: Omit<BaseField.Root.Props, 'children' | 'disabled' | 'name'>
    /** Props for the `label` part. */
    label?: BaseField.Label.Props
    /** Props for the `description` part. */
    description?: BaseField.Description.Props
    /**
     * Props for the `error` part, such as `match`, to show a message of the caller's own for one
     * failing check only.
     */
    error?: BaseField.Error.Props
    /** Props for the `control` part. */
    control?: BaseSlider.Control.Props
    /** Props for the `track` part. */
    track?: BaseSlider.Track.Props
    /** Props for the `indicator` part. */
    indicator?: BaseSlider.Indicator.Props
    /**
     * Props for each `thumb` part, such as `getAriaValueText`, to say a value in words of the
     * caller's own, as "5 minutes".
     */
    thumb?: Omit<BaseSlider.Thumb.Props, 'index'>
    /** Props for the `value` part. */
    value?: Omit<BaseSlider.Value.Props, 'children'>
  }
}

/** Base UI's join between a range's two figures, so the sizers measure what the figure shows. */
const JOIN = ' – '

/**
 * A control for choosing a number, or a range between two numbers, along a track, with its label,
 * its line of help, its error and the figure it shows.
 */
export function Slider({
  label,
  hiddenLabel = false,
  description,
  error,
  disabled = false,
  value,
  defaultValue,
  onChange,
  onChangeCommitted,
  locale,
  minimumLabel,
  maximumLabel,
  slotProps,
  className,
  ref,
  ...rest
}: SliderProps) {
  const strings = useOwnedStrings({ minimum: minimumLabel, maximum: maximumLabel })
  const providerLocale = useLocale()
  // CR-13: the caller's locale, or the PerronProvider's, never the runtime's
  const numberLocale = locale ?? providerLocale
  // CR-3: one thumb per value, counted from value, or from defaultValue when it is left out
  const range = Array.isArray(value ?? defaultValue)
  const { min = 0, max = 100, format } = rest

  // CR-8: the ends as the figure would show them, in the same locale and format, so the figure's
  // column holds the width of the widest; a range writes each end twice, as its figure does
  const ends = useMemo(() => {
    const formatter = new Intl.NumberFormat(numberLocale, format)
    return [min, max].map((end) => {
      const figure = formatter.format(end)
      return range ? `${figure}${JOIN}${figure}` : figure
    })
  }, [numberLocale, format, min, max, range])

  // CR-7: a range's thumbs are named "Minimum" and "Maximum" and say their value alone, unless the
  // caller's slotProps.thumb names them or says their value itself
  const thumbSlot = slotProps?.thumb
  const callerNames =
    thumbSlot?.getAriaLabel !== undefined ||
    thumbSlot?.['aria-label'] !== undefined ||
    thumbSlot?.['aria-labelledby'] !== undefined
  const callerValueText =
    thumbSlot?.getAriaValueText !== undefined || thumbSlot?.['aria-valuetext'] !== undefined
  const thumbWords = {
    ...(range &&
      !callerNames && {
        getAriaLabel: (index: number) => (index === 0 ? strings.minimum : strings.maximum),
      }),
    ...(range && !callerValueText && { getAriaValueText: (formatted: string) => formatted }),
  }

  // CR-3: the indicator, then one thumb per value, in the track
  const track = (
    <BaseSlider.Track
      {...slotProps?.track}
      className={withClass('pn-Slider-track', slotProps?.track?.className)}
    >
      <BaseSlider.Indicator
        {...slotProps?.indicator}
        className={withClass('pn-Slider-indicator', slotProps?.indicator?.className)}
      />
      {(range ? [0, 1] : [0]).map((index) => (
        <BaseSlider.Thumb
          key={index}
          {...mergeProps<typeof BaseSlider.Thumb>(thumbSlot, { index, ...thumbWords })}
          className={withClass('pn-Slider-thumb', thumbSlot?.className)}
        />
      ))}
    </BaseSlider.Track>
  )

  return (
    // CR-2: Field draws the frame, its label, its help and its error; Slider adds its classes
    <Field
      {...slotProps?.field}
      className={withClass('pn-Slider-field', slotProps?.field?.className)}
      // CR-5: disabled goes to the frame, which disables every thumb and marks every part
      disabled={disabled}
      label={label}
      hiddenLabel={hiddenLabel}
      description={description}
      error={error}
      slotProps={{
        label: {
          ...slotProps?.label,
          className: withClass('pn-Slider-label', slotProps?.label?.className),
        },
        description: {
          ...slotProps?.description,
          className: withClass('pn-Slider-description', slotProps?.description?.className),
        },
        error: {
          ...slotProps?.error,
          className: withClass('pn-Slider-error', slotProps?.error?.className),
        },
      }}
    >
      {/* CR-4: the rest first, then Slider's own; a value prop left out stays out, so an
          uncontrolled slider stays uncontrolled */}
      <BaseSlider.Root
        {...rest}
        ref={ref}
        {...(value !== undefined && { value })}
        {...(defaultValue !== undefined && { defaultValue })}
        // CR-6: Base UI's callbacks adapted once, to MUI's names, with the details unchanged
        {...(onChange && {
          onValueChange: (next: number | readonly number[], details) =>
            onChange(details.event, next as number | readonly [number, number], details),
        })}
        {...(onChangeCommitted && {
          onValueCommitted: (next: number | readonly number[], details) =>
            onChangeCommitted(details.event, next as number | readonly [number, number], details),
        })}
        locale={numberLocale}
        className={withClass('pn-Slider', className)}
      >
        <BaseSlider.Control
          {...mergeProps<typeof BaseSlider.Control>(slotProps?.control, {
            // CR-11: a drag along the slider moves the thumb, never a bottom sheet round it
            'data-base-ui-swipe-ignore': 'x',
            children: track,
          } as BaseSlider.Control.Props)}
          className={withClass('pn-Slider-control', slotProps?.control?.className)}
        />
        {/* CR-8: the figure, then the two ends, invisible, in the same cell */}
        <BaseSlider.Value
          {...slotProps?.value}
          className={withClass('pn-Slider-value', slotProps?.value?.className)}
        >
          {(formatted) => (
            <>
              <span className="pn-Slider-valueText">{formatted.join(JOIN)}</span>
              {ends.map((end, index) => (
                <span key={index} className="pn-Slider-valueSizer" aria-hidden="true">
                  {end}
                </span>
              ))}
            </>
          )}
        </BaseSlider.Value>
      </BaseSlider.Root>
    </Field>
  )
}
