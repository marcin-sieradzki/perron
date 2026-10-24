// Button grown since the release: wider unions, a new optional prop, a prop made optional.
export interface ButtonProps {
  /** The look */
  variant?: 'contained' | 'outlined' | 'text'
  /** How big */
  size?: 'small' | 'medium' | 'large'
  /** The intent */
  color?: 'neutral' | 'brand'
  /** Fills its container's width */
  fullWidth?: boolean
  /** Read out */
  label?: string
  /** After the label */
  endIcon?: string
}
