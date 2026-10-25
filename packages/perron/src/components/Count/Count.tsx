'use client'
// Count: a small pill holding how many there are, such as the "3" after "Delays" in a filter chip,
// set in tabular figures on an inset or tinted surface. No Base UI component has behaviour for it,
// so the root renders through useRender. Spec: docs/components/count.md.
import type { CSSProperties, ReactNode, Ref } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { known } from '../../internal/nodes.ts'
import { UnknownValue } from '../../internal/UnknownValue.tsx'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import './Count.css'

export interface CountProps extends Omit<
  useRender.ComponentProps<'span'>,
  'children' | 'color' | 'ref'
> {
  /**
   * The intent: what the count means. `neutral` is a plain tally, such as lines on a tab; the
   * status intents tint the pill for a count of good or bad news, such as `danger` for lines with
   * delays. Always beside words that say what is counted, such as "Delays": colour is never the
   * only sign.
   * @default 'neutral'
   */
  color?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
  /**
   * The count, written as the screen shows it: `3`, `'1 204'`, `'99+'`. Leave it out when no data
   * gives the count, and Count shows "—" and says "Unknown". `0` is a count, and shows.
   */
  children?: ReactNode
  /**
   * Overrides "Unknown", heard in place of "—" when there is no count
   * @default The locale's
   */
  unknownLabel?: string
  /** Joined after `pn-Count` on the root */
  className?: string
  /** Reaches the root */
  style?: CSSProperties
  /** Reaches the root element */
  ref?: Ref<HTMLSpanElement>
}

/**
 * How many there are, in a small pill after the words that say what is counted, such as
 * "Delays 3". With no count it shows "—" and says "Unknown".
 */
export function Count({
  color = 'neutral',
  children,
  unknownLabel,
  render,
  ref,
  ...rest
}: CountProps) {
  const strings = useOwnedStrings({ unknown: unknownLabel })
  const unknown = !known(children)

  // Count's own props last, so they win over the caller's; mergeProps puts the rightmost class
  // first, so the class reads "pn-Count <caller's>" (CR-1). data-color always, the default
  // included (CR-3), and the bare data-unknown for a missing count (CR-4)
  const own = {
    className: 'pn-Count',
    'data-color': color,
    'data-unknown': unknown ? '' : undefined,
    // CR-4 and CR-5: a count that says nothing shows "—" for the eye and the words for the ear
    children: unknown ? <UnknownValue label={strings.unknown} /> : children,
  }
  return useRender({
    defaultTagName: 'span',
    render,
    ref,
    props: mergeProps<'span'>(rest, own),
  })
}
