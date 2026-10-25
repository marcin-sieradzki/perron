'use client'
// IconButton: a native <button> from Base UI's Button that runs one action and shows it as an icon
// alone, named by its required label in a VisuallyHidden span. The spec is
// docs/components/icon-button.md.
import { Button as BaseButton } from '@base-ui/react/button'
import type { CSSProperties, ReactNode, Ref } from 'react'
import { VisuallyHidden } from '../../parts/VisuallyHidden/VisuallyHidden.tsx'
import './IconButton.css'

export interface IconButtonProps extends Omit<
  BaseButton.Props,
  'className' | 'style' | 'color' | 'children' | 'disabled' | 'ref'
> {
  /**
   * The words that name the action, in sentence case, such as "Zoom in". Required: the icon is
   * hidden from screen readers, so these words are the button's name. Never seen, read by screen
   * readers.
   */
  label: string
  /**
   * The intent: `neutral` is quiet ink, for every action but the main one; `brand` is the brand
   * yellow, for the one main action of a screen.
   * @default 'neutral'
   */
  color?: 'neutral' | 'brand'
  /**
   * The icon's step in the `size.control` square: `medium` is `icon.size.400`, for icons drawn on
   * the 16 px grid; `large` is `icon.size.450`, for the top bar's icons drawn on the 18 px grid.
   * @default 'medium'
   */
  size?: 'medium' | 'large'
  /**
   * Whether the button ignores the pointer and the keys. A disabled button leaves the tab order
   * unless `focusableWhenDisabled` is set.
   * @default false
   */
  disabled?: boolean
  /**
   * The icon, such as an SVG from `packages/perron/icons/` with the `perron-icon` class. Hidden
   * from screen readers: `label` names the button.
   */
  children?: ReactNode
  /** Reaches the root. `className` is merged after `pn-IconButton`. */
  className?: string
  /** Reaches the root. */
  style?: CSSProperties
  /** Reaches the root. */
  ref?: Ref<HTMLButtonElement>
}

/** A button that runs one action and shows it as an icon alone, such as zoom in or show help. */
export function IconButton({
  label,
  color = 'neutral',
  size = 'medium',
  disabled = false,
  children,
  className,
  style,
  ref,
  ...rest
}: IconButtonProps) {
  return (
    <BaseButton
      {...rest}
      ref={ref}
      disabled={disabled}
      className={className ? `pn-IconButton ${className}` : 'pn-IconButton'}
      style={style}
      data-color={color}
      data-size={size}
    >
      <span className="pn-IconButton-icon" aria-hidden="true">
        {children}
      </span>
      <VisuallyHidden>{label}</VisuallyHidden>
    </BaseButton>
  )
}
