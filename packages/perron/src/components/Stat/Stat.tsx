// Stat: a key figure under the words that say what it counts, such as "412" under "Reporting
// live", set large to read at a glance. No Base UI component has behaviour for it, so every part
// renders through useRender. Spec: docs/components/stat.md.
import type { ReactNode } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { VisuallyHidden } from '../../parts/VisuallyHidden/VisuallyHidden.tsx'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import './Stat.css'

/** U+2014, the dash content design writes for unknown (CR-5). */
const UNKNOWN = '—'

export interface StatProps extends Omit<useRender.ComponentProps<'div'>, 'children'> {
  /** What the figure counts, in a few words: "Reporting live", "Average delay". Required */
  label: ReactNode
  /**
   * The figure, formatted as content design writes numbers: "412", "4 min", "≈ 30". Leave it out
   * when no data says it, and Stat shows "—" and says "Unknown"
   */
  children?: ReactNode
  /**
   * Overrides "Unknown", heard in place of "—" when there is no figure
   * @default The locale's
   */
  unknownLabel?: string
  /** Props for each inner part, merged with the part's own, which win */
  slotProps?: {
    /** Props for the `label` part */
    label?: useRender.ComponentProps<'div'>
    /** Props for the `value` part */
    value?: useRender.ComponentProps<'div'>
  }
}

/**
 * Whether a figure says something: `null`, `undefined`, a boolean, `''`, a number that is not
 * finite, and an array of only such values say nothing; `0` and `'0'` are figures (CR-3).
 */
const known = (node: ReactNode): boolean =>
  Array.isArray(node)
    ? node.some(known)
    : node != null &&
      typeof node !== 'boolean' &&
      node !== '' &&
      (typeof node !== 'number' || Number.isFinite(node))

/**
 * One inner part: its `slotProps` value merged with the part's own props, its own last, so its
 * class and children stay while the caller's `className` joins and its `render` swaps the element
 * (CR-7).
 */
function usePart(
  slot: useRender.ComponentProps<'div'> | undefined,
  own: useRender.ElementProps<'div'>,
) {
  const { render, ...props } = slot ?? {}
  return useRender({
    defaultTagName: 'div',
    render,
    props: mergeProps<'div'>(props as useRender.ElementProps<'div'>, own),
  })
}

/**
 * A key figure with the words that say what it counts, label over figure, set large so it reads
 * at a glance. With no figure it shows "—" and says "Unknown".
 */
export function Stat({
  label,
  children,
  unknownLabel,
  slotProps,
  render,
  ref,
  ...rest
}: StatProps) {
  const strings = useOwnedStrings({ unknown: unknownLabel })
  const unknown = !known(children)

  const labelPart = usePart(slotProps?.label, { className: 'pn-Stat-label', children: label })
  const valuePart = usePart(slotProps?.value, {
    className: 'pn-Stat-value',
    // The "—" for the eye, and the words for the ear in their own text run (CR-4, CR-5)
    children: unknown ? (
      <>
        <span aria-hidden="true">{UNKNOWN}</span>
        <VisuallyHidden>{strings.unknown}</VisuallyHidden>
      </>
    ) : (
      children
    ),
  })

  // Stat's own props last, so they win over the caller's; className joins as "pn-Stat <caller's>".
  // The bare data-unknown marks an unknown figure for the CSS (CR-3).
  const own = {
    className: 'pn-Stat',
    'data-unknown': unknown ? '' : undefined,
    children: (
      <>
        {labelPart}
        {valuePart}
      </>
    ),
  }
  return useRender({
    defaultTagName: 'div',
    render,
    ref,
    props: mergeProps<'div'>(rest, own),
  })
}
