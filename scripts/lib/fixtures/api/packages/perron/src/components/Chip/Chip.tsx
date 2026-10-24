// A component whose props type is an intersection, overriding a member it inherits.
import type { HTMLAttributes } from 'react'

export type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  /** The intent */
  color?: 'neutral' | 'brand'
}

export function Chip(props: ChipProps) {
  return <span {...props} />
}
