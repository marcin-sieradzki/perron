import type { ReactNode } from 'react'
import './VisuallyHidden.css'

/** Text for screen readers only. */
export const VisuallyHidden = ({ children }: { children: ReactNode }) => (
  <span className="pn-VisuallyHidden">{children}</span>
)
