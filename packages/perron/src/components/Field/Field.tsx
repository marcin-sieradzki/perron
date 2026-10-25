'use client'
// Field: the frame round one form control, its label above it, a line of help, and the error
// message under it, all tied to the control for the ear by Base UI's Field, which Perron rebuilds
// none of (CR-1). It draws no box: the box is the control's. The spec is docs/components/field.md.
import { Field as BaseField } from '@base-ui/react/field'
import { mergeProps } from '@base-ui/react/merge-props'
import type { ReactNode, Ref } from 'react'
import { given, withClass } from '../../internal/nodes.ts'
import { VisuallyHidden } from '../../parts/VisuallyHidden/VisuallyHidden.tsx'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import './Field.css'

export interface FieldProps extends Omit<BaseField.Root.Props, 'children' | 'ref'> {
  /**
   * Required. The field's name, in sentence case, such as "Stop name": shown above the control,
   * and the control's accessible name.
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
   * and heard as part of the control's name. Set it on the few fields a form doesn't ask for;
   * Field draws no mark for a required one.
   * @default false
   */
  optional?: boolean
  /**
   * Overrides "(optional)", the mark after the label's words with `optional`.
   * @default The locale's
   */
  optionalLabel?: string
  /**
   * A line of help under the label, such as "As written on the stop sign", read after the label by
   * a screen reader. Left out, no description is rendered.
   */
  description?: ReactNode
  /**
   * What is wrong with the value and how to put it right, such as "Enter a stop name". Given, it
   * marks the field invalid and is shown under the control; left out, the field shows Base UI's own
   * message when the control fails its checks.
   */
  error?: ReactNode
  /**
   * Required. The control the field labels: a control built on Base UI, which registers with the
   * field, such as a TextField's box.
   */
  children: ReactNode
  /** Reaches the root, the `Field.Root` `<div>`. */
  ref?: Ref<HTMLDivElement>
  /** Props for each inner part, merged with the part's own, which win. */
  slotProps?: {
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

/** The frame round one form control: its label, a line of help, and its error message. */
export function Field({
  label,
  hiddenLabel = false,
  optional = false,
  optionalLabel,
  description,
  error,
  children,
  invalid,
  slotProps,
  className,
  ref,
  ...rest
}: FieldProps) {
  const strings = useOwnedStrings({ optional: optionalLabel })
  // CR-4: a given error marks the field invalid, unless the caller says otherwise, and shows at
  // once; left out, Base UI's own message shows when the control fails its checks
  const hasError = given(error)

  return (
    <BaseField.Root
      {...rest}
      ref={ref}
      invalid={hasError ? (invalid ?? true) : invalid}
      className={withClass('pn-Field', className)}
    >
      <BaseField.Label
        {...mergeProps<typeof BaseField.Label>(
          slotProps?.label,
          // CR-6: a hidden label stays the control's name, in a span the eye never sees
          hiddenLabel ? { render: <VisuallyHidden />, nativeLabel: false } : undefined,
        )}
        className={withClass('pn-Field-label', slotProps?.label?.className)}
      >
        {label}
        {/* CR-11: the mark sits inside the label, seen or hidden, so it is in the control's name */}
        {optional ? (
          <>
            {' '}
            <span className="pn-Field-optional">{strings.optional}</span>
          </>
        ) : null}
      </BaseField.Label>
      {given(description) ? (
        <BaseField.Description
          {...slotProps?.description}
          className={withClass('pn-Field-description', slotProps?.description?.className)}
        >
          {description}
        </BaseField.Description>
      ) : null}
      {children}
      {/* CR-2: always rendered; Base UI mounts it only while there is a message to show */}
      <BaseField.Error
        {...mergeProps<typeof BaseField.Error>(
          slotProps?.error,
          hasError ? { match: true, children: error } : undefined,
        )}
        className={withClass('pn-Field-error', slotProps?.error?.className)}
      />
    </BaseField.Root>
  )
}
