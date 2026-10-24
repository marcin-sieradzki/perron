// The VisuallyHidden shared part: text for screen readers only. Internal: composed by components,
// never registered or exported. Its class and its hiding declarations live only in this folder.
import type { ComponentProps } from 'react'
import './VisuallyHidden.css'

/** The props of VisuallyHidden: a `<span>`'s. */
export type VisuallyHiddenProps = ComponentProps<'span'>

/** Text a screen reader reads and the eye never sees, such as a delay said in words. */
export function VisuallyHidden({ className, ...rest }: VisuallyHiddenProps) {
  return (
    <span
      {...rest}
      className={className ? `pn-VisuallyHidden ${className}` : 'pn-VisuallyHidden'}
    />
  )
}
