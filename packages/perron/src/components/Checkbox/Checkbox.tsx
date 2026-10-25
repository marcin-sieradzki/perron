// Checkbox: a box with its words beside it that turns one setting or one answer on and off, on Base
// UI's Checkbox. Base UI gives the role, the click and Space, the hidden input and the state;
// nothing here adds a key or click handler (CR-1). The box is the CheckboxIndicator shared part,
// rendered through Checkbox.Indicator (CR-4). The spec is docs/components/checkbox.md.
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox'
import { mergeProps } from '@base-ui/react/merge-props'
import type { CSSProperties, ReactNode, Ref } from 'react'
import { classes, given, withClass } from '../../internal/nodes.ts'
import { CheckboxIndicator } from '../../parts/CheckboxIndicator/CheckboxIndicator.tsx'
import './Checkbox.css'

export interface CheckboxProps extends Omit<
  BaseCheckbox.Root.Props,
  'onCheckedChange' | 'onChange' | 'parent' | 'children' | 'className' | 'style' | 'ref'
> {
  /**
   * Called when a click or Space ticks or unticks the checkbox, with the new state as `value`;
   * `details.reason` is `'none'`, and `details.cancel()` keeps the state as it was. `event` is
   * `details.event`. Not called while disabled or read-only.
   */
  onChange?: (event: Event, value: boolean, details: BaseCheckbox.Root.ChangeEventDetails) => void
  /**
   * The label: what ticking the box turns on or agrees to, in sentence case, such as "Show planned
   * works on the map". It names the checkbox and stays the same ticked or not. Left out, give the
   * checkbox an `aria-label` or `aria-labelledby`.
   */
  children?: ReactNode
  /** Reaches the root, the `<span role="checkbox">`. Merged after `pn-Checkbox`. */
  className?: string
  /** Reaches the root, the `<span role="checkbox">`. */
  style?: CSSProperties
  /** Reaches the root, the `<span role="checkbox">`. */
  ref?: Ref<HTMLElement>
  /** Props for each inner part, merged with the part's own, which win. */
  slotProps?: {
    /**
     * Props for the `indicator` part, the box, all but `keepMounted` and `render`, which stay
     * Checkbox's.
     */
    indicator?: Omit<BaseCheckbox.Indicator.Props, 'keepMounted' | 'render'>
  }
}

/**
 * The box as the CheckboxIndicator part, with Base UI's props and the mark its state calls for: the
 * tick while ticked, the dash while indeterminate, none while unticked (CR-4). Written once, outside
 * the component, since it reads nothing but its arguments.
 */
const renderIndicator: BaseCheckbox.Indicator.Props['render'] = (props, state) => (
  <CheckboxIndicator
    {...props}
    mark={state.indeterminate ? 'dash' : state.checked ? 'tick' : undefined}
  />
)

/** A box with its words beside it that turns one setting or one answer on and off. */
export function Checkbox({
  onChange,
  children,
  className,
  style,
  ref,
  slotProps,
  ...rest
}: CheckboxProps) {
  return (
    <BaseCheckbox.Root
      {...rest}
      ref={ref}
      // CR-2: Base UI's one handler, adapted to the contract's onChange(event, value, details)
      onCheckedChange={
        onChange &&
        ((checked: boolean, details: BaseCheckbox.Root.ChangeEventDetails) =>
          onChange(details.event, checked, details))
      }
      className={classes('pn-Checkbox', className)}
      style={style}
    >
      <BaseCheckbox.Indicator
        {...mergeProps<typeof BaseCheckbox.Indicator>(slotProps?.indicator, {
          keepMounted: true,
          render: renderIndicator,
        })}
        className={withClass('pn-Checkbox-indicator', slotProps?.indicator?.className)}
      />
      {/* CR-10: the label, after the box in reading order, only when it renders something */}
      {given(children) && <span className="pn-Checkbox-label">{children}</span>}
    </BaseCheckbox.Root>
  )
}
