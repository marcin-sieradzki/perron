'use client'
// HighlightChip: a pill on glass that floats alone over the map and turns one map highlight on and
// off, on Base UI's Toggle, which keeps the state, sets aria-pressed and data-pressed, and handles
// the click, Enter and Space (CR-2). The spec is docs/components/highlight-chip.md.
import { Toggle } from '@base-ui/react/toggle'
import type { CSSProperties, ReactNode, Ref } from 'react'
import { classes } from '../../internal/nodes.ts'
import './HighlightChip.css'

export interface HighlightChipProps extends Omit<
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
  /** Whether the highlight is on, when the caller controls it. Announced as pressed. */
  selected?: boolean
  /**
   * Whether the highlight is on at first, when the chip keeps the state itself.
   * @default false
   */
  defaultSelected?: boolean
  /**
   * Called when a click, Enter or Space turns the chip on or off, with the next selected state:
   * `true` turns the highlight on, `false` clears it. `event` is `details.event`, and
   * `details.cancel()` keeps the chip as it was.
   */
  onChange?: (event: Event, value: boolean, details: Toggle.ChangeEventDetails) => void
  /**
   * Whether the chip ignores the pointer and the keys. A disabled chip leaves the tab order, and a
   * selected one still shows that the highlight is on.
   * @default false
   */
  disabled?: boolean
  /**
   * Required. What the chip highlights, in a word or two in sentence case, such as "Line 5C" or
   * "Delayed vehicles": the chip's name. A string, an element such as a LineBadge, or a list of
   * both.
   */
  children: ReactNode
  /** Reaches the root. Merged after `pn-HighlightChip`. */
  className?: string
  /** Reaches the root. */
  style?: CSSProperties
  /** Reaches the root, the chip's `<button>`. */
  ref?: Ref<HTMLButtonElement>
}

/**
 * A pill on glass that floats alone over the map and turns one highlight of the map on and off,
 * such as "Line 5C" in focus with everything outside it dimmed. The screen places it and clears it
 * on Esc.
 */
export function HighlightChip({
  selected,
  defaultSelected = false,
  onChange,
  disabled = false,
  children,
  className,
  style,
  ref,
  ...rest
}: HighlightChipProps) {
  return (
    <Toggle
      {...rest}
      ref={ref}
      pressed={selected}
      defaultPressed={defaultSelected}
      // Base UI's onPressedChange, adapted once: details passes through, so cancel() keeps the
      // chip as it was (CR-3)
      onPressedChange={(next, details) => onChange?.(details.event, next, details)}
      disabled={disabled}
      className={classes('pn-HighlightChip', className)}
      style={style}
    >
      {children}
    </Toggle>
  )
}
