// Switch: a two-state control that turns one setting on or off at once, on Base UI's Switch, a
// track with a thumb that slides to its inline end when on. Base UI gives the role, aria-checked,
// the tab stop, Space and Enter, the label's click, disabled, read-only, the hidden input and the
// Field; nothing here adds a key or click handler (CR-1). The spec is docs/components/switch.md.
import { mergeProps } from '@base-ui/react/merge-props'
import { Switch as BaseSwitch } from '@base-ui/react/switch'
import type { CSSProperties, Ref } from 'react'
import { classes, withClass } from '../../internal/nodes.ts'
import './Switch.css'

export interface SwitchProps extends Omit<
  BaseSwitch.Root.Props,
  | 'checked'
  | 'defaultChecked'
  | 'onCheckedChange'
  | 'disabled'
  | 'readOnly'
  | 'required'
  | 'name'
  | 'className'
  | 'style'
  | 'children'
  | 'ref'
> {
  /** Whether the switch is on, when the caller controls it. Announced as on or off. */
  checked?: boolean
  /**
   * Whether the switch is on at first, when it keeps its state itself.
   * @default false
   */
  defaultChecked?: boolean
  /**
   * Called when a click, Space or Enter, or a click on its label, turns the switch on or off, with
   * the new state as `value`; `details.reason` is `'none'`, and `details.cancel()` keeps the
   * state as it was. `event` is `details.event`, the hidden input's change.
   */
  onChange?: (event: Event, value: boolean, details: BaseSwitch.Root.ChangeEventDetails) => void
  /**
   * Whether the switch ignores the pointer and the keys. It leaves the tab order, keeps its state,
   * and is announced as dimmed.
   * @default false
   */
  disabled?: boolean
  /**
   * Whether the switch shows its state but can't be changed. It keeps its place in the tab order
   * and is announced as read-only.
   * @default false
   */
  readOnly?: boolean
  /**
   * Whether the switch must be on before its form submits. Announced as required; the label says
   * so to the eye.
   * @default false
   */
  required?: boolean
  /**
   * The name the switch's value is submitted under in a native `<form>`. Inside a Base UI
   * `Field.Root`, the field's name wins.
   */
  name?: string
  /** Reaches the root. Merged after `pn-Switch`. */
  className?: string
  /** Reaches the root. */
  style?: CSSProperties
  /** Reaches the root, the `<span role="switch">`. */
  ref?: Ref<HTMLElement>
  /** Props for each inner part, merged with the part's own, which win. */
  slotProps?: {
    /**
     * Props for the thumb part, merged under Perron's own; its `className` joins after
     * `pn-Switch-thumb`.
     */
    thumb?: BaseSwitch.Thumb.Props
  }
}

/**
 * A two-state control that turns one setting on or off at once, such as showing vehicle trails on
 * the map. Name it with a `<label>`, a Field's label, `aria-label` or `aria-labelledby`.
 */
export function Switch({
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  readOnly = false,
  required = false,
  name,
  className,
  style,
  ref,
  slotProps,
  ...rest
}: SwitchProps) {
  const { className: thumbClassName, ...thumb } = slotProps?.thumb ?? {}
  return (
    <BaseSwitch.Root
      {...rest}
      ref={ref}
      // CR-2: `checked` left out is uncontrolled; Base UI's change adapted to the contract's shape
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={
        onChange &&
        ((next: boolean, details: BaseSwitch.Root.ChangeEventDetails) =>
          onChange(details.event, next, details))
      }
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      name={name}
      className={classes('pn-Switch', className)}
      style={style}
    >
      {/* CR-4: Base UI's thumb, which keeps the root's state attributes, with the caller's props
          merged under its own: its class first, by `withClass`, since the caller's may be a function
          of the thumb's state, which `mergeProps` can't join */}
      <BaseSwitch.Thumb
        {...mergeProps<typeof BaseSwitch.Thumb>(thumb, {
          className: withClass('pn-Switch-thumb', thumbClassName),
        })}
      />
    </BaseSwitch.Root>
  )
}
