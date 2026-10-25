// RadioGroup: a named set of two to six choices of which exactly one holds at a time, each a round
// mark beside its words, on Base UI's RadioGroup and Radio. Its radio lives here too: Base UI's
// Radio.Root reads the group's context for its checked state, so it can't be built or shown apart
// (docs/components/radio-group.md, Anatomy). The group renders Perron's Fieldset with Base UI's
// group as its `render`, so its label is Fieldset's legend (CR-2). Base UI gives the roles, the one
// tab stop, the arrow keys, Space, the click, disabled, read-only, the hidden inputs and the Field;
// nothing here adds a key or click handler or forces a tabIndex, so a disabled group keeps Base UI's
// one focusable stop, announced as dimmed (CR-1).
import type { Fieldset as BaseFieldset } from '@base-ui/react/fieldset'
import { mergeProps } from '@base-ui/react/merge-props'
import { Radio as BaseRadio } from '@base-ui/react/radio'
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group'
import type { CSSProperties, ReactNode, Ref } from 'react'
import { classes, withClass } from '../../internal/nodes.ts'
import { Fieldset } from '../Fieldset/Fieldset.tsx'
import './RadioGroup.css'

export interface RadioGroupProps extends Omit<
  BaseRadioGroup.Props<string>,
  | 'value'
  | 'defaultValue'
  | 'onValueChange'
  | 'onChange'
  | 'disabled'
  | 'readOnly'
  | 'required'
  | 'name'
  | 'className'
  | 'style'
  | 'children'
  | 'ref'
> {
  /**
   * Required. The group's name, in sentence case, a word or a short question, such as "Theme":
   * shown above the radios, and the group's accessible name.
   */
  label: ReactNode
  /**
   * Whether the label is heard but not seen. Use it where a heading right above already names the
   * group for the eye, so the group keeps its name for the ear.
   * @default false
   */
  hiddenLabel?: boolean
  /**
   * The checked radio's `value`, when the caller controls it. A value no radio has checks none.
   */
  value?: string
  /**
   * The radio checked at first, when the group keeps the value itself. Left out, with no `value`,
   * no radio is checked until one is chosen.
   */
  defaultValue?: string
  /**
   * Called when another radio is checked, by a click, an arrow key or Space, with that radio's
   * `value`; `details.reason` is `'none'`, and `details.cancel()` keeps an uncontrolled group as it
   * was. Not called when the checked radio is clicked again. `event` is `details.event`.
   */
  onChange?: (event: Event, value: string, details: BaseRadioGroup.ChangeEventDetails) => void
  /**
   * The name the checked radio's value is submitted under in a native `<form>`. Inside a Base UI
   * `Field.Root`, the field's name wins.
   */
  name?: string
  /**
   * Whether every radio ignores the pointer and the keys. The checked radio still shows, and the
   * group keeps one tab stop, on the checked radio or the first, announced as dimmed, that changes
   * nothing.
   * @default false
   */
  disabled?: boolean
  /**
   * Whether the group shows its choice but can't be changed. It keeps its tab stop, the arrow keys
   * move focus without checking, and it is announced as read-only.
   * @default false
   */
  readOnly?: boolean
  /**
   * Whether a radio must be checked before its form submits. Announced as required; the label says
   * so to the eye.
   * @default false
   */
  required?: boolean
  /** The group's `Radio`s, in reading order, below the label. */
  children?: ReactNode
  /**
   * Reaches the root, the `<div role="radiogroup">`. `className` is merged after `pn-RadioGroup` and
   * Fieldset's `pn-Fieldset`.
   */
  className?: string
  /**
   * Reaches the root, the `<div role="radiogroup">`. `className` is merged after `pn-RadioGroup` and
   * Fieldset's `pn-Fieldset`.
   */
  style?: CSSProperties
  /**
   * Reaches the root, the `<div role="radiogroup">`. `className` is merged after `pn-RadioGroup` and
   * Fieldset's `pn-Fieldset`.
   */
  ref?: Ref<HTMLDivElement>
  /** Props for each inner part, merged with the part's own, which win. */
  slotProps?: {
    /**
     * Props for the `legend` part, merged under Perron's own; its `className` joins after
     * `pn-RadioGroup-legend`, and its `id` is the one the group's `aria-labelledby` points at.
     */
    legend?: BaseFieldset.Legend.Props
  }
}

/**
 * A named set of two to six choices of which exactly one holds at a time, such as the theme the
 * map is drawn in: its label above, its `Radio`s below in one column.
 */
export function RadioGroup({
  label,
  hiddenLabel = false,
  value,
  defaultValue,
  onChange,
  name,
  disabled = false,
  readOnly = false,
  required = false,
  children,
  className,
  style,
  ref,
  slotProps,
  ...rest
}: RadioGroupProps) {
  const legend = slotProps?.legend
  return (
    // CR-2: Fieldset names the group by its legend and hands it `disabled`, with its own and a
    // surrounding fieldset's joined, so `disabled` is given to Fieldset alone
    <Fieldset
      legend={label}
      hiddenLegend={hiddenLabel}
      disabled={disabled}
      className={classes('pn-RadioGroup', className)}
      ref={ref}
      slotProps={{
        legend: { ...legend, className: withClass('pn-RadioGroup-legend', legend?.className) },
      }}
      render={
        // CR-4: rest first, so the group's own props win and none of RadioGroup's own reaches it
        <BaseRadioGroup<string>
          {...rest}
          // CR-3: each only when given, so a group given neither is uncontrolled with nothing
          // checked; Base UI's change adapted to the contract's shape
          {...(value !== undefined && { value })}
          {...(defaultValue !== undefined && { defaultValue })}
          onValueChange={
            onChange &&
            ((next: string, details: BaseRadioGroup.ChangeEventDetails) =>
              onChange(details.event, next, details))
          }
          name={name}
          readOnly={readOnly}
          required={required}
          style={style}
        />
      }
    >
      {children}
    </Fieldset>
  )
}

export interface RadioProps extends Omit<
  BaseRadio.Root.Props<string>,
  'value' | 'disabled' | 'className' | 'style' | 'children' | 'ref'
> {
  /**
   * Required. The value that checks this radio, unique within its group, and the value a form
   * submits when it is checked.
   */
  value: string
  /**
   * Whether the radio ignores the pointer and the keys. The arrow keys skip it, it keeps its
   * checked state, and it is announced as dimmed; checked, it stays the group's tab stop, where
   * Space changes nothing and the arrow keys move on to the enabled radios.
   * @default false
   */
  disabled?: boolean
  /**
   * The label: a few words that name the choice, in sentence case, such as "Match the system". It
   * is the radio's accessible name.
   */
  children?: ReactNode
  /** Reach the radio's `<span role="radio">`. `className` is merged after `pn-Radio`. */
  className?: string
  /** Reach the radio's `<span role="radio">`. `className` is merged after `pn-Radio`. */
  style?: CSSProperties
  /** Reach the radio's `<span role="radio">`. `className` is merged after `pn-Radio`. */
  ref?: Ref<HTMLElement>
  /** Props for each inner part, merged with the part's own, which win. */
  slotProps?: {
    /**
     * Props for the `indicator` part, all but `keepMounted`, which stays Radio's `true`, merged
     * under Perron's own; its `className` joins after `pn-Radio-indicator`.
     */
    indicator?: Omit<BaseRadio.Indicator.Props, 'keepMounted'>
  }
}

/**
 * One choice in a `RadioGroup`: a round mark and its words in one row, checked while the group's
 * value is its `value`. Renders only inside a `RadioGroup`.
 */
export function Radio({
  value,
  disabled = false,
  children,
  className,
  style,
  ref,
  slotProps,
  ...rest
}: RadioProps) {
  const { className: indicatorClassName, ...indicator } = slotProps?.indicator ?? {}
  return (
    // CR-4: rest first, so the radio's own props win
    <BaseRadio.Root
      {...rest}
      ref={ref}
      value={value}
      disabled={disabled}
      className={classes('pn-Radio', className)}
      style={style}
    >
      {/* CR-5: the circle, kept mounted so it is drawn unchecked too, with the caller's props
          merged under Perron's own: its class first, by `withClass`, since the caller's may be a
          function of the indicator's state, which `mergeProps` can't join */}
      <BaseRadio.Indicator
        {...mergeProps<typeof BaseRadio.Indicator>(indicator, {
          className: withClass('pn-Radio-indicator', indicatorClassName),
          keepMounted: true,
        })}
      />
      {/* One label, so text and elements flow and wrap as one run of text beside the mark */}
      <span className="pn-Radio-label">{children}</span>
    </BaseRadio.Root>
  )
}
