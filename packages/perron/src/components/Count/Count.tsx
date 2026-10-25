// Count: a small pill holding how many there are, such as the "3" after "Delays" in a filter chip,
// set in tabular figures on an inset or tinted surface. No Base UI component has behaviour for it,
// so the root renders through useRender. Spec: docs/components/count.md.
import type { ReactNode } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { VisuallyHidden } from '../../parts/VisuallyHidden/VisuallyHidden.tsx'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import './Count.css'

/** U+2014, the dash content design writes for unknown (CR-5). */
const UNKNOWN = '—'

export interface CountProps extends Omit<useRender.ComponentProps<'span'>, 'children' | 'color'> {
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
}

/**
 * Whether a count says something: `null`, `undefined`, a boolean, `''`, a number that is not
 * finite, and an array of only such values say nothing; `0` and `'0'` are counts (CR-4).
 */
const known = (node: ReactNode): boolean =>
  Array.isArray(node)
    ? node.some(known)
    : node != null &&
      typeof node !== 'boolean' &&
      node !== '' &&
      (typeof node !== 'number' || Number.isFinite(node))

/** The "—" for the eye and the words for the ear, each in its own text run (CR-5). */
const unknownCount = (label: string) => (
  <>
    <span aria-hidden="true">{UNKNOWN}</span>
    <VisuallyHidden>{label}</VisuallyHidden>
  </>
)

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
    children: unknown ? unknownCount(strings.unknown) : children,
  }
  return useRender({
    defaultTagName: 'span',
    render,
    ref,
    props: mergeProps<'span'>(rest, own),
  })
}
