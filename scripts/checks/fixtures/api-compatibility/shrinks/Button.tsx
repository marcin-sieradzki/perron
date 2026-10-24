// Button shrunk since the release: a prop removed, one made required, two narrowed, one new and
// required.
export interface ButtonProps {
  /** The look */
  variant?: 'contained' | 'text'
  /** How big */
  size?: 'small'
  /** The intent */
  color: 'neutral' | 'brand'
  /** Read out */
  label: string
  /** The form field */
  name: string
}
