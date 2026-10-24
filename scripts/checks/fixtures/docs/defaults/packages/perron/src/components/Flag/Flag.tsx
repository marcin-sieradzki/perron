// Gives `variant` a destructuring default and `render` and `closedLabel` theirs as `@default`, as
// the spec does, but leaves `openLabel` without the default the spec gives it.
import type { Ref } from 'react'
import { useRender } from '@base-ui/react/use-render'

export interface FlagProps extends Omit<useRender.ComponentProps<'span'>, 'render' | 'ref'> {
  /** The flag's words. */
  label: string
  /** How loud the flag is. */
  variant?: 'quiet' | 'loud'
  /**
   * Swaps the root element.
   *
   * @default <span />
   */
  render?: useRender.ComponentProps<'span'>['render']
  /**
   * Overrides "Closed".
   *
   * @default The locale's
   */
  closedLabel?: string
  /** Overrides "Open". */
  openLabel?: string
  /** Reaches the root. */
  ref?: Ref<HTMLSpanElement>
}

export function Flag({ label, variant = 'quiet', render, ref, ...rest }: FlagProps) {
  return useRender({
    defaultTagName: 'span',
    render,
    ref,
    props: { ...rest, children: [label, variant] },
  })
}
