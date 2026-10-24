// Button: a native <button> from Base UI's Button that runs one action, in ink or, for the one main
// action of a screen, in the brand yellow. The spec is docs/components/button.md.
import { Button as BaseButton } from '@base-ui/react/button'
import type { CSSProperties, ReactNode, Ref } from 'react'
import './Button.css'

/**
 * Whether an icon prop renders anything: `false`, `true`, `null`, `undefined` and `''` leave no
 * icon span.
 */
const rendersSomething = (node: ReactNode) =>
  node != null && typeof node !== 'boolean' && node !== ''

export interface ButtonProps extends Omit<
  BaseButton.Props,
  'className' | 'style' | 'color' | 'children' | 'disabled' | 'ref'
> {
  /**
   * How much the button stands out: `solid` is filled, for the action a panel is for; `outline`
   * is an edge only, for the actions beside it.
   * @default 'solid'
   */
  variant?: 'solid' | 'outline'
  /**
   * The intent: `neutral` is ink, for every action but the main one; `brand` is the brand yellow,
   * for the one main action of a screen.
   * @default 'neutral'
   */
  color?: 'neutral' | 'brand'
  /**
   * The button's height: `medium` is `size.button`, `small` is `size.button-sm`, for dense rows
   * and panels.
   * @default 'medium'
   */
  size?: 'small' | 'medium'
  /**
   * Whether the button ignores the pointer and the keys. A disabled button leaves the tab order
   * unless `focusableWhenDisabled` is set.
   * @default false
   */
  disabled?: boolean
  /**
   * Whether the button fills the width of its container, such as a bottom sheet's main action.
   * Sets `data-full-width`.
   * @default false
   */
  fullWidth?: boolean
  /**
   * An icon before the label, in reading order, so it moves to the right in right-to-left text.
   * Hidden from screen readers: the label names the button.
   */
  startIcon?: ReactNode
  /**
   * An icon after the label, in reading order. Hidden from screen readers: the label names the
   * button.
   */
  endIcon?: ReactNode
  /**
   * The label: the words that name the action, in sentence case. Required in practice: a button
   * with no words is an IconButton.
   */
  children?: ReactNode
  /** Classes for the root, merged after `pn-Button`. */
  className?: string
  /** Inline styles for the root. */
  style?: CSSProperties
  /** The root element. */
  ref?: Ref<HTMLButtonElement>
}

/** A button that runs one action on the screen it sits on, such as "Show departures". */
export function Button({
  variant = 'solid',
  color = 'neutral',
  size = 'medium',
  disabled = false,
  fullWidth = false,
  startIcon,
  endIcon,
  children,
  className,
  style,
  ref,
  ...rest
}: ButtonProps) {
  return (
    <BaseButton
      {...rest}
      ref={ref}
      disabled={disabled}
      className={className ? `pn-Button ${className}` : 'pn-Button'}
      style={style}
      data-variant={variant}
      data-color={color}
      data-size={size}
      data-full-width={fullWidth ? '' : undefined}
    >
      {rendersSomething(startIcon) && (
        <span className="pn-Button-startIcon" aria-hidden="true">
          {startIcon}
        </span>
      )}
      <span className="pn-Button-label">{children}</span>
      {rendersSomething(endIcon) && (
        <span className="pn-Button-endIcon" aria-hidden="true">
          {endIcon}
        </span>
      )}
    </BaseButton>
  )
}
