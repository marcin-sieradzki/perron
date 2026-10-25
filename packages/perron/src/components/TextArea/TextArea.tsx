// TextArea: the box a person types several lines of words into, framed by Perron's Field, which
// gives it its label, its line of help and its error. The root is the native <textarea> itself, Base
// UI's Field.Control rendered as one, so React's own onChange, value and defaultValue, and a form
// library's register(), reach it unchanged. Base UI names it, ties the help and the error to it,
// runs the checks and keeps its state (CR-1). The spec is docs/components/text-area.md.
import { Field as BaseField } from '@base-ui/react/field'
import type { ChangeEvent, ComponentPropsWithoutRef, ReactNode, Ref } from 'react'
import { withClass } from '../../internal/nodes.ts'
import { Field } from '../Field/Field.tsx'
import './TextArea.css'

// CR-15: the <textarea>'s own attributes, so every handler is typed on it, with className and
// style from Base UI, functions of the control's state; Base UI's render and onValueChange are out
export interface TextAreaProps
  extends
    Omit<
      ComponentPropsWithoutRef<'textarea'>,
      | 'onChange'
      | 'value'
      | 'defaultValue'
      | 'disabled'
      | 'children'
      | 'dangerouslySetInnerHTML'
      | 'className'
      | 'style'
    >,
    Pick<BaseField.Control.Props, 'className' | 'style'> {
  /**
   * Required. The field's name, in sentence case, such as "What happened": shown above the box,
   * and the textarea's accessible name.
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
   * and heard as part of the textarea's name. It sets no check: `required` does.
   * @default false
   */
  optional?: boolean
  /**
   * Overrides "(optional)", the mark after the label's words with `optional`.
   * @default The locale's
   */
  optionalLabel?: string
  /**
   * A line of help between the label and the box, such as "Say where and when, such as the stop and
   * the time", read after the label by a screen reader. Left out, no description is rendered.
   */
  description?: ReactNode
  /**
   * What is wrong with the words and how to put it right, such as "Say what happened". Given, it
   * marks the field invalid and is shown under the box; left out, the field shows Base UI's own
   * message when the textarea fails its checks.
   */
  error?: ReactNode
  /**
   * Whether the field ignores the person: the box takes no focus, no typing and no resizing, and
   * the label, the help and the words turn to the tertiary ink.
   * @default false
   */
  disabled?: boolean
  /** The name the words are submitted under in a form's `FormData`. */
  name?: string
  /**
   * How many lines of words the box shows before they scroll. The person can drag the box taller.
   * @default 3
   */
  rows?: number
  /**
   * Words shown in the empty box, such as "Such as the 5C waited at Nørreport for 10 minutes".
   * They vanish as the person types, so they never replace the label or the description.
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
   * The words in the box at first, when the textarea keeps them itself. Left out, the box starts
   * empty.
   */
  defaultValue?: string
  /**
   * React's own change event, called on every change to the words; `event.target.value` holds
   * them, new lines included. Native, so a form library's `register()` or `handleChange` connects
   * unchanged.
   */
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void
  /** Reaches the root, the `<textarea>`. */
  ref?: Ref<HTMLTextAreaElement>
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

/** A box for several lines of words, with its label, its line of help and its error message. */
export function TextArea({
  label,
  hiddenLabel = false,
  optional = false,
  optionalLabel,
  description,
  error,
  disabled = false,
  name,
  rows = 3,
  placeholder,
  required,
  value,
  defaultValue,
  onChange,
  slotProps,
  className,
  ref,
  ...rest
}: TextAreaProps) {
  // CR-3, CR-4: the textarea takes the rest as given, then its declared props, React's own onChange
  // among them; CR-10: its rows in every render. Base UI types Field.Control on an <input>, and here
  // it renders a <textarea> (CR-6), so the textarea's attributes are handed over as the control's.
  const control = {
    ...rest,
    name,
    rows,
    placeholder,
    required,
    value,
    defaultValue,
    onChange,
  } as BaseField.Control.Props

  return (
    // CR-2: Field draws the frame, its label, its help and its error; TextArea adds its classes
    <Field
      {...slotProps?.field}
      className={withClass('pn-TextArea-field', slotProps?.field?.className)}
      // CR-5: disabled goes to the frame, which disables the textarea and marks every part
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
          className: withClass('pn-TextArea-label', slotProps?.label?.className),
        },
        description: {
          ...slotProps?.description,
          className: withClass('pn-TextArea-description', slotProps?.description?.className),
        },
        error: {
          ...slotProps?.error,
          className: withClass('pn-TextArea-error', slotProps?.error?.className),
        },
      }}
    >
      {/* CR-6: the textarea is the box, rendered after the spread in every render */}
      <BaseField.Control
        {...control}
        ref={ref}
        render={<textarea />}
        className={withClass('pn-TextArea', className)}
      />
    </Field>
  )
}
