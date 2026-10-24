// Button as the last release shipped it.
export interface ButtonProps {
  /** The look */
  variant?: 'contained' | 'outlined'
  /** How big */
  size?: 'small' | 'medium'
  /** The intent */
  color?: 'neutral' | 'brand'
  /** Fills its container's width */
  fullWidth?: boolean
  /** Read out */
  label: string
}
