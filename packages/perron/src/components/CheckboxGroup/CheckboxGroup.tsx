// CheckboxGroup: a named set of checkboxes that answer one question together, on Base UI's
// CheckboxGroup and Field. One element is the field, Perron's Fieldset and Base UI's group at once:
// Field.Root renders as the Fieldset, and the Fieldset as Base UI's CheckboxGroup, so the
// `<div role="group">` takes the legend's name, the field's help and error, its name and its
// validation (CR-2). Base UI keeps the ticked list, the parent checkbox, the form entries, the
// validation and the disabled state; nothing here adds a key, pointer or validation handler, or
// any ARIA (CR-1, CR-10, CR-12). The spec is docs/components/checkbox-group.md.
import { CheckboxGroup as BaseCheckboxGroup } from '@base-ui/react/checkbox-group'
import { Field as BaseField } from '@base-ui/react/field'
import type { Fieldset as BaseFieldset } from '@base-ui/react/fieldset'
import { mergeProps } from '@base-ui/react/merge-props'
import type { CSSProperties, ReactNode, Ref } from 'react'
import { given, withClass } from '../../internal/nodes.ts'
import { Fieldset } from '../Fieldset/Fieldset.tsx'
import './CheckboxGroup.css'

export interface CheckboxGroupProps
  extends
    Omit<
      BaseCheckboxGroup.Props,
      'onValueChange' | 'onChange' | 'disabled' | 'children' | 'className' | 'style' | 'ref'
    >,
    Pick<
      BaseField.Root.Props,
      | 'invalid'
      | 'validate'
      | 'validationMode'
      | 'validationDebounceTime'
      | 'dirty'
      | 'touched'
      | 'actionsRef'
    > {
  /**
   * Required. The group's name, in sentence case, a few words or a short question, such as "Show
   * on the map": shown above the checkboxes, and the group's accessible name.
   */
  label: ReactNode
  /**
   * Whether the label is heard but not seen. Use it where a heading right above already names the
   * group for the eye, so the group keeps its name for the ear.
   * @default false
   */
  hiddenLabel?: boolean
  /**
   * A line of help under the label about the whole set, such as "The map shows vehicles of the
   * ticked modes only", read after each checkbox's name by a screen reader. Left out, no
   * description is rendered.
   */
  description?: ReactNode
  /**
   * What is wrong with the ticked set and how to put it right, such as "Choose at least one mode".
   * Given, it marks the group invalid and is shown under the checkboxes; left out, the group shows
   * Base UI's own message when its `validate` fails.
   */
  error?: ReactNode
  /**
   * Called when a click or Space ticks or unticks a checkbox in the group, or a parent checkbox
   * ticks or unticks the set, with the new list of ticked values as `value`; `details.reason` is
   * `'none'`, and `details.cancel()` keeps the list as it was. `event` is `details.event`. Not
   * called while disabled.
   */
  onChange?: (event: Event, value: string[], details: BaseCheckboxGroup.ChangeEventDetails) => void
  /**
   * Whether every checkbox in the group ignores the pointer and the keys. They leave the tab order
   * and take the disabled look, with the label, the description and the error; a fieldset round
   * the group disables it too.
   * @default false
   */
  disabled?: boolean
  /**
   * Identifies the group when a form is submitted: each ticked checkbox submits its `value` under
   * this name, and a disabled one submits nothing.
   */
  name?: string
  /**
   * Required. The group's checkboxes, in reading order: each a Checkbox with its own `value`,
   * which the group's `value` lists while it is ticked, and, with `allValues`, a parent Checkbox
   * first.
   */
  children: ReactNode
  /** Reaches the root, the group. Merged after `pn-CheckboxGroup`. */
  className?: string
  /** Reaches the root, the group. */
  style?: CSSProperties
  /** Reaches the root, the group: the `<div role="group">`, or the element `render` gives. */
  ref?: Ref<HTMLElement>
  /** Props for each inner part, merged with the part's own, which win. */
  slotProps?: {
    /**
     * Props for the `legend` part, passed to Fieldset's own `slotProps.legend`. Its `id` is the
     * one the group's `aria-labelledby` points at.
     */
    legend?: BaseFieldset.Legend.Props
    /** Props for the `description` part. */
    description?: BaseField.Description.Props
    /**
     * Props for the `error` part, such as `match`, to show a message of the caller's own for one
     * failing check only.
     */
    error?: BaseField.Error.Props
  }
}

/**
 * A named set of checkboxes that answer one question together, such as which modes the map shows:
 * its label above, a line of help, the checkboxes in one column, and its error under them.
 */
export function CheckboxGroup({
  label,
  hiddenLabel = false,
  description,
  error,
  disabled = false,
  name,
  onChange,
  children,
  className,
  style,
  invalid,
  validate,
  validationMode,
  validationDebounceTime,
  dirty,
  touched,
  actionsRef,
  ref,
  slotProps,
  ...rest
}: CheckboxGroupProps) {
  // CR-4: a given error marks the group invalid, unless the caller says otherwise, and shows at
  // once; left out, Base UI's own message shows when the group fails its `validate`
  const hasError = given(error)
  const legend = slotProps?.legend

  return (
    // CR-2, CR-3: the field renders as the Fieldset, which renders as Base UI's group, so the three
    // are one element; the field hands its class, style and ref on to it
    <BaseField.Root
      // Field.Root types its ref for its own <div>; it lands on the element `render` gives, the
      // group's <div>, or the caller's own through the group's `render`
      ref={ref as Ref<HTMLDivElement> | undefined}
      name={name}
      disabled={disabled}
      invalid={hasError ? (invalid ?? true) : invalid}
      validate={validate}
      validationMode={validationMode}
      validationDebounceTime={validationDebounceTime}
      dirty={dirty}
      touched={touched}
      actionsRef={actionsRef}
      className={withClass('pn-CheckboxGroup', className)}
      style={style}
      render={
        // CR-3, CR-5: Fieldset names the group by its legend and hands it `disabled`; the legend
        // takes the group's class after Fieldset's, then the caller's
        <Fieldset
          legend={label}
          hiddenLegend={hiddenLabel}
          disabled={disabled}
          slotProps={{
            legend: {
              ...legend,
              className: withClass('pn-CheckboxGroup-legend', legend?.className),
            },
          }}
          render={
            // CR-3: rest first, so the group's own props win; Base UI's change adapted to the
            // contract's onChange(event, value, details)
            <BaseCheckboxGroup
              {...rest}
              onValueChange={
                onChange &&
                ((value: string[], details: BaseCheckboxGroup.ChangeEventDetails) =>
                  onChange(details.event, value, details))
              }
            />
          }
        />
      }
    >
      {/* CR-2: the help, only when it renders something */}
      {given(description) ? (
        <BaseField.Description
          {...mergeProps<typeof BaseField.Description>(slotProps?.description, {
            children: description,
          })}
          className={withClass('pn-CheckboxGroup-description', slotProps?.description?.className)}
        />
      ) : null}
      {/* CR-2, CR-8: the caller's checkboxes, the root's own children, with no wrapper */}
      {children}
      {/* CR-2, CR-4: always rendered; Base UI mounts it only while there is a message to show */}
      <BaseField.Error
        {...mergeProps<typeof BaseField.Error>(
          slotProps?.error,
          hasError ? { match: true, children: error } : undefined,
        )}
        className={withClass('pn-CheckboxGroup-error', slotProps?.error?.className)}
      />
    </BaseField.Root>
  )
}
