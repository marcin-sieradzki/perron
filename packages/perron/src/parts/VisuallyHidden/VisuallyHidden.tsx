// The VisuallyHidden shared part: text a screen reader reads and the eye doesn't see, for a word the
// eye gets from an icon or a shape. Internal: composed by components, never exported.
import type { ComponentProps } from 'react'
import './VisuallyHidden.css'

/** Text for screen readers only, laid over its positioned parent and clipped to nothing. */
export function VisuallyHidden({ className, ...rest }: ComponentProps<'span'>) {
  return (
    <span
      {...rest}
      className={className ? `pn-VisuallyHidden ${className}` : 'pn-VisuallyHidden'}
    />
  )
}
