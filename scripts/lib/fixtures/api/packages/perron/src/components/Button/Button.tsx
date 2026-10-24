// A component whose props type is an interface over an HTML element's attributes.
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Size = 'small' | 'medium' | 'large'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  /** The look */
  variant?: 'contained' | 'outlined'
  /** How big */
  size?: Size
  /** Turns it off */
  disabled?: boolean
  /** Before the label */
  startIcon?: ReactNode
  /** When it opens */
  onOpen?: (event: Event) => void
  /** Read out */
  label: string
}

export function Button(props: ButtonProps) {
  return <button {...props} />
}
