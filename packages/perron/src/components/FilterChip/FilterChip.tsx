'use client'
// FilterChip: a pill that turns one filter on and off, on Base UI's Toggle, with an optional icon
// before its words and a Count after them, in ink when it is on. Base UI gives the button, the
// keys, the state and aria-pressed; nothing here adds a key handler (CR-1). The spec is
// docs/components/filter-chip.md.
import { Toggle } from '@base-ui/react/toggle'
import type { CSSProperties, ReactNode, Ref } from 'react'
import { classes, given } from '../../internal/nodes.ts'
import { Count } from '../Count/Count.tsx'
import './FilterChip.css'

export interface FilterChipProps extends Omit<
  Toggle.Props,
  | 'pressed'
  | 'defaultPressed'
  | 'onPressedChange'
  | 'value'
  | 'onChange'
  | 'disabled'
  | 'className'
  | 'style'
  | 'children'
  | 'ref'
> {
  /** Whether the filter is on, when the caller controls it. Announced as pressed. */
  selected?: boolean
  /**
   * Whether the filter is on at first, when FilterChip keeps the state itself.
   * @default false
   */
  defaultSelected?: boolean
  /**
   * Called when a click, Enter or Space turns the filter on or off, with the new state as `value`;
   * `details.reason` is `'none'`, and `details.cancel()` keeps the state as it was. `event` is
   * `details.event`.
   */
  onChange?: (event: Event, value: boolean, details: Toggle.ChangeEventDetails) => void
  /**
   * Whether the chip ignores the pointer and the keys. A disabled chip leaves the tab order and
   * keeps its state.
   * @default false
   */
  disabled?: boolean
  /**
   * An icon before the label, in reading order, such as the disruption icon of the kind the chip
   * filters. Hidden from screen readers: the label names the chip.
   */
  startIcon?: ReactNode
  /**
   * How many the filter matches, shown after the label as a Count, such as the "3" of "Delays 3".
   * Heard after the label. Shown for `0` too; left out when `undefined` or not a finite number.
   */
  count?: number
  /**
   * The label: the name of what the filter shows, in sentence case, such as "Delays". It stays the
   * same whether the filter is on or off.
   */
  children?: ReactNode
  /** Reaches the root. Merged after `pn-FilterChip`. */
  className?: string
  /** Reaches the root. */
  style?: CSSProperties
  /** Reaches the root, the `<button>` with `aria-pressed`. */
  ref?: Ref<HTMLButtonElement>
}

/**
 * A pill that turns one filter on and off, such as "Delays" in the top bar's filters, with an
 * optional icon before its words and a count after them.
 */
export function FilterChip({
  selected,
  defaultSelected = false,
  onChange,
  disabled = false,
  startIcon,
  count,
  children,
  className,
  style,
  ref,
  ...rest
}: FilterChipProps) {
  return (
    <Toggle
      {...rest}
      ref={ref}
      // CR-2: FilterChip's state names, mapped onto Toggle's; `selected` left out is uncontrolled
      pressed={selected}
      defaultPressed={defaultSelected}
      onPressedChange={
        onChange &&
        ((pressed: boolean, details: Toggle.ChangeEventDetails) =>
          onChange(details.event, pressed, details))
      }
      disabled={disabled}
      className={classes('pn-FilterChip', className)}
      style={style}
    >
      {given(startIcon) && (
        <span className="pn-FilterChip-startIcon" aria-hidden="true">
          {startIcon}
        </span>
      )}
      <span className="pn-FilterChip-label">{children}</span>
      {/* CR-9: the count, 0 included, after a space in the markup, so the chip's name reads
          "Delays 3", where the CSS gap alone would leave "Delays3" */}
      {typeof count === 'number' && Number.isFinite(count) && (
        <>
          {' '}
          <Count className="pn-FilterChip-count">{count}</Count>
        </>
      )}
    </Toggle>
  )
}
