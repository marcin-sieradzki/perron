import type { ReactNode } from 'react'

export interface TypesProps {
  /** Stops interaction */
  disabled?: 'yes' | 'no'
  /** Open */
  open?: string
  /** An icon before the label */
  startIcon?: string
  /** The field's name */
  name?: number
  /** Overrides "Close" */
  closeLabel?: ReactNode
}
