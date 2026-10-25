// Separator: a hairline between two groups of content, announced as a break, on Base UI's
// Separator (docs/components/separator.md). Base UI sets the role, aria-orientation and
// data-orientation from orientation (CR-1); Perron adds its class, and the CSS draws the line.
import { Separator as BaseSeparator } from '@base-ui/react/separator'
import type { CSSProperties, Ref } from 'react'
import { classes } from '../../internal/nodes.ts'
import './Separator.css'

export interface SeparatorProps extends Omit<
  BaseSeparator.Props,
  'className' | 'style' | 'children' | 'ref'
> {
  /** Joined after `pn-Separator` on the root */
  className?: string
  /** Reaches the root */
  style?: CSSProperties
  /** Reaches the root, the `role="separator"` element */
  ref?: Ref<HTMLDivElement>
}

/**
 * A hairline that divides two groups of content, across a column or down a row, and tells a
 * screen reader there is a break there. It takes no children: a break that needs words is a
 * heading (CR-5).
 */
export function Separator({ className, ref, ...rest }: SeparatorProps) {
  // orientation stays in rest, so Base UI's default, 'horizontal', holds (CR-1); no role of its
  // own, so Base UI's separator is the one it announces (CR-9)
  return <BaseSeparator {...rest} ref={ref} className={classes('pn-Separator', className)} />
}
