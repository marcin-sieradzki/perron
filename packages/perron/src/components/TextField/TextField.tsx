// TextField: the box a person types one line of words into, framed by Perron's Field, which gives
// it its label, its line of help and its error. The root is the native <input> itself, Base UI's
// Field.Control, so React's own onChange, value and defaultValue, and a form library's register(),
// reach it unchanged. Base UI names it, ties the help and the error to it, runs the checks and keeps
// its state (CR-1). The spec is docs/components/text-field.md.
import { Field as BaseField } from '@base-ui/react/field'
import type { ChangeEvent, ReactNode, Ref } from 'react'
import { withClass } from '../../internal/nodes.ts'
import { Field } from '../Field/Field.tsx'
import './TextField.css'

export interface TextFieldProps extends Omit<
  BaseField.Control.Props,
  'onValueChange' | 'ref' | 'disabled' | 'children' | 'dangerouslySetInnerHTML'
> {
  /**
   * Required. The field's name, in sentence case, such as "Stop name": shown above the box, and the
   * input's accessible name.
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
   * A line of help between the label and the box, such as "As written on the stop sign", read
   * after the label by a screen reader. Left out, no description is rendered.
   */
  description?: ReactNode
  /**
   * What is wrong with the words and how to put it right, such as "Enter a stop name". Given, it
   * marks the field invalid and is shown under the box; left out, the field shows Base UI's own
   * message when the input fails its checks.
   */
  error?: ReactNode
  /**
   * Whether the field ignores the person: the box takes no focus and no typing, and the label, the
   * help and the words turn to the tertiary ink.
   * @default false
   */
  disabled?: boolean
  /** The name the words are submitted under in a form's `FormData`. */
  name?: string
  /**
   * What the words are: plain text, an email address, a password (shown as dots), a phone number
   * or a web address. It sets the phone's keyboard and the browser's own check.
   * @default 'text'
   */
  type?: 'text' | 'email' | 'password' | 'tel' | 'url'
  /**
   * Words shown in the empty box, such as "Such as Nørreport St.". They vanish as the person
   * types, so they never replace the label or the description.
   */
  placeholder?: string
  /**
   * Whether the field must hold words before a form is submitted: an empty box fails the browser's
   * check, and Base UI shows the error.
   * @default false
   */
  required?: boolean
  /** The words in the box, when the caller controls them. */
  value?: string
  /**
   * The words in the box at first, when the input keeps them itself. Left out, the box starts
   * empty.
   */
  defaultValue?: string
  /**
   * React's own change event, called on every change to the words; `event.target.value` holds
   * them. Native, so a form library's `register()` or `handleChange` connects unchanged.
   */
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
  /** Reaches the root, the `<input>`. */
  ref?: Ref<HTMLInputElement>
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
     * failing check only, as `match="valueMissing"`.
     */
    error?: BaseField.Error.Props
  }
}

/** A box for one line of words, with its label, its line of help and its error message. */
export function TextField({
  label,
  hiddenLabel = false,
  optional = false,
  optionalLabel,
  description,
  error,
  disabled = false,
  type = 'text',
  slotProps,
  className,
  ref,
  ...rest
}: TextFieldProps) {
  return (
    // CR-2: Field draws the frame, its label, its help and its error; TextField adds its classes
    <Field
      {...slotProps?.field}
      className={withClass('pn-TextField-field', slotProps?.field?.className)}
      // CR-5: disabled goes to the frame, which disables the input and marks every part
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
          className: withClass('pn-TextField-label', slotProps?.label?.className),
        },
        description: {
          ...slotProps?.description,
          className: withClass('pn-TextField-description', slotProps?.description?.className),
        },
        error: {
          ...slotProps?.error,
          className: withClass('pn-TextField-error', slotProps?.error?.className),
        },
      }}
    >
      {/* CR-3, CR-4: the input takes the rest as given, React's own onChange among it; CR-10:
          its type in every render */}
      <BaseField.Control
        {...rest}
        ref={ref}
        type={type}
        className={withClass('pn-TextField', className)}
      />
    </Field>
  )
}
