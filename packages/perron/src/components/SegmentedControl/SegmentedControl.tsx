// SegmentedControl: a row of two to five segments on an inset track, one of them selected, that
// picks how one view shows its content, on Base UI's ToggleGroup. Its segment lives here too: Base
// UI's Toggle reads the group's context for its pressed state, so it can't be built or shown apart
// (docs/components/segmented-control.md, Anatomy). Base UI gives the keys, the roving focus, the
// single selection and aria-pressed; nothing here adds a key handler (CR-1).
import { Toggle } from '@base-ui/react/toggle'
import { ToggleGroup } from '@base-ui/react/toggle-group'
import type { CSSProperties, ReactNode, Ref } from 'react'
import { classes } from '../../internal/nodes.ts'
import './SegmentedControl.css'

/**
 * What each of the two inherits from its Base UI part: every prop but `own`, the ones it declares
 * itself or leaves out, and React's `className`, `style`, `children` and `ref`, which it declares
 * as React's.
 */
type Inherited<P, own extends keyof P = never> = Omit<
  P,
  own | 'className' | 'style' | 'children' | 'ref'
>

export interface SegmentedControlProps extends Inherited<
  ToggleGroup.Props<string>,
  'value' | 'defaultValue' | 'onValueChange' | 'onChange' | 'disabled' | 'multiple' | 'orientation'
> {
  /**
   * The selected segment's `value`, when the caller controls it. A value no segment has selects
   * none.
   */
  value?: string
  /**
   * The segment selected at first, when the control keeps the value itself. Left out, with no
   * `value`, no segment is selected until one is chosen.
   */
  defaultValue?: string
  /**
   * Called when another segment is selected, by a click, Enter or Space (`details.reason`
   * `'none'`), with that segment's `value`. Not called when the selected segment is pressed again.
   * `event` is `details.event`.
   */
  onChange?: (event: Event, value: string, details: ToggleGroup.ChangeEventDetails) => void
  /**
   * Whether every segment ignores the pointer and the keys. The selected segment still shows, and
   * the control leaves the tab order.
   * @default false
   */
  disabled?: boolean
  /** The control's `Segment`s, in reading order. */
  children?: ReactNode
  /** Reaches the root. Merged after `pn-SegmentedControl`. */
  className?: string
  /** Reaches the root. */
  style?: CSSProperties
  /** Reaches the root, the `role="group"` element. */
  ref?: Ref<HTMLDivElement>
}

/**
 * A row of two to five segments on an inset track, one of them selected, that picks how one view
 * shows its content. Holds its `Segment`s; name it with `aria-label` or `aria-labelledby`.
 */
export function SegmentedControl({
  value,
  defaultValue,
  onChange,
  disabled = false,
  className,
  ref,
  ...rest
}: SegmentedControlProps) {
  return (
    <ToggleGroup
      {...rest}
      // each only when given, so a control given neither is uncontrolled with nothing selected
      // (CR-4)
      {...(value !== undefined && { value: [value] })}
      {...(defaultValue !== undefined && { defaultValue: [defaultValue] })}
      ref={ref}
      disabled={disabled}
      onValueChange={(next: string[], details: ToggleGroup.ChangeEventDetails) => {
        // an empty value is the selected segment pressed again: keep it selected, and stay quiet
        if (next.length === 0) {
          details.cancel()
          return
        }
        onChange?.(details.event, next[0], details)
      }}
      className={classes('pn-SegmentedControl', className)}
    />
  )
}

export interface SegmentProps extends Inherited<
  Toggle.Props<string>,
  'value' | 'disabled' | 'pressed' | 'defaultPressed' | 'onPressedChange'
> {
  /** Required. The value that selects this segment, unique within its control. */
  value: string
  /**
   * Whether the segment ignores the pointer and the keys. It leaves the tab and arrow-key order,
   * and is announced as dimmed.
   * @default false
   */
  disabled?: boolean
  /** The label: a word or two that names the choice, in sentence case, such as "Metro". */
  children?: ReactNode
  /** Reaches the segment's `<button>`. Merged after `pn-Segment`. */
  className?: string
  /** Reaches the segment's `<button>`. */
  style?: CSSProperties
  /** Reaches the root, the segment's `<button>`. */
  ref?: Ref<HTMLButtonElement>
}

/**
 * One choice in a `SegmentedControl`: a native button, pressed while selected, that selects the
 * control's value of the same `value`. Renders only inside a `SegmentedControl` (CR-2).
 */
export function Segment({
  value,
  disabled = false,
  children,
  className,
  ref,
  ...rest
}: SegmentProps) {
  return (
    <Toggle
      {...rest}
      ref={ref}
      value={value}
      disabled={disabled}
      className={classes('pn-Segment', className)}
    >
      {/* One label, so text and elements flow and wrap as one line of text, centred, where the
          segment's flex row would set each beside the next as a column of its own (CR-9). */}
      <span className="pn-Segment-label">{children}</span>
    </Toggle>
  )
}
