// The CloseButton shared part: the icon button that closes what it sits in. A component renders it
// through its Base UI close part's `render` (`Dialog.Close`, `Drawer.Close`), which passes the
// button's behaviour, class and ref in as props. Internal: composed by components, never exported.
import type { ComponentProps } from 'react'
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.tsx'
import './CloseButton.css'

export interface CloseButtonProps extends Omit<ComponentProps<'button'>, 'children'> {
  /** The button's name, read out in place of the icon: the owned `close` string or its override. */
  label: string
}

/** A `size.control` square button with the `close` icon, named by `label`. */
export function CloseButton({ label, className, type = 'button', ...rest }: CloseButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={className ? `pn-CloseButton ${className}` : 'pn-CloseButton'}
    >
      <svg
        className="perron-icon"
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m4 4 8 8M12 4l-8 8" />
      </svg>
      <VisuallyHidden>{label}</VisuallyHidden>
    </button>
  )
}
