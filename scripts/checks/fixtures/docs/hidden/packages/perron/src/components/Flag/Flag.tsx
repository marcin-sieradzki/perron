// Marks `closedLabel` `@ignore`, which the docs page's props table drops its row for, though the
// spec gives it one.
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
   * @ignore
   */
  closedLabel?: string
  /**
   * Overrides "Open".
   *
   * @default The locale's
   */
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
