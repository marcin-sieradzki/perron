'use client'
// NumberField: the box a person types a number into, or steps up and down with its minus and plus
// buttons and the arrow keys, framed by Perron's Field, which gives it its label, its line of help
// and its error. The root is Base UI's NumberField.Root, which keeps the number, parses and formats
// it in the locale, steps and clamps it, and submits it through its hidden input; Base UI's Field
// names the input and ties the help and the error to it (CR-1). The spec is
// docs/components/number-field.md.
import type { Field as BaseField } from '@base-ui/react/field'
import { mergeProps } from '@base-ui/react/merge-props'
import { NumberField as BaseNumberField } from '@base-ui/react/number-field'
import type { ReactNode, Ref } from 'react'
import { withClass } from '../../internal/nodes.ts'
import { useLocale, useOwnedStrings } from '../../PerronProvider.tsx'
import { Field } from '../Field/Field.tsx'
import './NumberField.css'

export interface NumberFieldProps extends Omit<
  BaseNumberField.Root.Props,
  'onValueChange' | 'onValueCommitted' | 'disabled' | 'locale' | 'children' | 'ref'
> {
  /**
   * Required. The field's name, in sentence case, such as "Departures to show": shown above the
   * box, and the input's accessible name.
   */
  label: ReactNode
  /**
   * Whether the label is heard but not seen. Use it only where the screen around the field already
   * says what it is for.
   * @default false
   */
  hiddenLabel?: boolean
  /**
   * Whether the person may leave the field empty. Adds "(optional)" after the label's words, seen
   * and heard as part of the input's name. It sets no check: `required` does.
   * @default false
   */
  optional?: boolean
  /**
   * Overrides "(optional)", the mark after the label's words with `optional`.
   * @default The locale's
   */
  optionalLabel?: string
  /**
   * A line of help between the label and the box, such as "From 1 to 20", read after the label by
   * a screen reader. Left out, no description is rendered.
   */
  description?: ReactNode
  /**
   * What is wrong with the number and how to put it right, such as "Enter a number from 1 to 20".
   * Given, it marks the field invalid and is shown under the box; left out, the field shows Base
   * UI's own message when the number fails its checks.
   */
  error?: ReactNode
  /**
   * Whether the field ignores the person: the box takes no focus, no typing and no presses, and the
   * label, the help, the number and the buttons turn to the tertiary ink.
   * @default false
   */
  disabled?: boolean
  /**
   * Called when the number changes: as the person types a number that parses (`details.reason`
   * `'input-change'`), clears the box (`'input-clear'`, `value` `null`), leaves it and the number
   * is clamped or rounded (`'input-blur'`), pastes (`'input-paste'`), steps it with the keys
   * (`'keyboard'`), presses a button (`'increment-press'`, `'decrement-press'`) or turns the wheel
   * (`'wheel'`), or the browser autofills Base UI's hidden input (`'none'`). `event` is
   * `details.event`, and `details.cancel()` keeps the number as it was.
   */
  onChange?: (
    event: Event,
    value: number | null,
    details: BaseNumberField.Root.ChangeEventDetails,
  ) => void
  /**
   * Called once the person has settled on a number: when they leave the box after typing, release
   * a held button, or with each key step and wheel turn; `event` is `details.event`. Use it to save
   * or fetch, where `onChange` fires on every step of a held button.
   */
  onChangeCommitted?: (
    event: Event,
    value: number | null,
    details: BaseNumberField.Root.CommitEventDetails,
  ) => void
  /**
   * The locale the number is written and read in: "1,500" in English, "1.500" in Danish, "1 500"
   * in Swedish and Norwegian. Left out, the nearest PerronProvider's.
   * @default The PerronProvider's locale
   */
  locale?: Intl.LocalesArgument
  /**
   * Words shown in the empty box, such as "Such as 8". They vanish as the person types, so they
   * never replace the label or the description.
   */
  placeholder?: string
  /**
   * Overrides "Increase", the increment button's name.
   * @default The locale's
   */
  increaseLabel?: string
  /**
   * Overrides "Decrease", the decrement button's name.
   * @default The locale's
   */
  decreaseLabel?: string
  /**
   * Overrides "Number field", what a screen reader calls the input in place of its role.
   * @default The locale's
   */
  numberFieldLabel?: string
  /** Reaches the root, the `NumberField.Root` `<div>`. */
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
     * failing check only, as `match="rangeOverflow"`.
     */
    error?: BaseField.Error.Props
    /** Props for the `group` part, the box. */
    group?: BaseNumberField.Group.Props
    /** Props for the `input` part, such as `autoFocus`, or an `onBlur` of the caller's own. */
    input?: BaseNumberField.Input.Props
    /** Props for the `decrement` part, the button that steps the number down. */
    decrement?: BaseNumberField.Decrement.Props
    /** Props for the `increment` part, the button that steps the number up. */
    increment?: BaseNumberField.Increment.Props
  }
}

/** `minus` from packages/perron/icons/, hidden from the ear: the button's name says it (CR-8). */
const MINUS_ICON = (
  <svg
    className="perron-icon"
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3.5 8h9" />
  </svg>
)

/** `plus` from packages/perron/icons/, hidden from the ear: the button's name says it (CR-8). */
const PLUS_ICON = (
  <svg
    className="perron-icon"
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3.5 8h9M8 3.5v9" />
  </svg>
)

/** A box for a number, stepped by its buttons and the arrow keys, with its label, help and error. */
export function NumberField({
  label,
  hiddenLabel = false,
  optional = false,
  optionalLabel,
  description,
  error,
  disabled = false,
  onChange,
  onChangeCommitted,
  locale,
  placeholder,
  increaseLabel,
  decreaseLabel,
  numberFieldLabel,
  slotProps,
  className,
  ref,
  ...rest
}: NumberFieldProps) {
  // CR-9: the buttons' names and the input's role description, with the overrides laid over them
  const strings = useOwnedStrings({
    increase: increaseLabel,
    decrease: decreaseLabel,
    numberField: numberFieldLabel,
  })
  const providerLocale = useLocale()

  return (
    // CR-2: Field draws the frame, its label, its help and its error; NumberField adds its classes
    <Field
      {...slotProps?.field}
      className={withClass('pn-NumberField-field', slotProps?.field?.className)}
      // CR-5: disabled goes to the frame, which disables the input and both buttons
      disabled={disabled}
      label={label}
      hiddenLabel={hiddenLabel}
      optional={optional}
      optionalLabel={optionalLabel}
      description={description}
      error={error}
      slotProps={{
        label: {
          ...slotProps?.label,
          className: withClass('pn-NumberField-label', slotProps?.label?.className),
        },
        description: {
          ...slotProps?.description,
          className: withClass('pn-NumberField-description', slotProps?.description?.className),
        },
        error: {
          ...slotProps?.error,
          className: withClass('pn-NumberField-error', slotProps?.error?.className),
        },
      }}
    >
      {/* CR-3: the rest reaches the root first, then NumberField's own props */}
      <BaseNumberField.Root
        {...rest}
        ref={ref}
        className={withClass('pn-NumberField', className)}
        // CR-6: the caller's locale, or the PerronProvider's, never the runtime's
        locale={locale ?? providerLocale}
        // CR-4: Base UI's events become MUI's, here, and neither reaches the caller
        onValueChange={(value, details) => onChange?.(details.event, value, details)}
        onValueCommitted={(value, details) => onChangeCommitted?.(details.event, value, details)}
      >
        <BaseNumberField.Group
          {...slotProps?.group}
          className={withClass('pn-NumberField-group', slotProps?.group?.className)}
        >
          <BaseNumberField.Input
            {...mergeProps<typeof BaseNumberField.Input>(slotProps?.input, {
              // mergeProps copies an undefined value too, so the caller's own placeholder stays
              placeholder: placeholder ?? slotProps?.input?.placeholder,
              'aria-roledescription': strings.numberField,
            })}
            className={withClass('pn-NumberField-input', slotProps?.input?.className)}
          />
          <BaseNumberField.Decrement
            {...mergeProps<typeof BaseNumberField.Decrement>(slotProps?.decrement, {
              'aria-label': strings.decrease,
            })}
            className={withClass('pn-NumberField-decrement', slotProps?.decrement?.className)}
          >
            {MINUS_ICON}
          </BaseNumberField.Decrement>
          <BaseNumberField.Increment
            {...mergeProps<typeof BaseNumberField.Increment>(slotProps?.increment, {
              'aria-label': strings.increase,
            })}
            className={withClass('pn-NumberField-increment', slotProps?.increment?.className)}
          >
            {PLUS_ICON}
          </BaseNumberField.Increment>
        </BaseNumberField.Group>
      </BaseNumberField.Root>
    </Field>
  )
}
