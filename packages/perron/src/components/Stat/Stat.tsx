// Stat: a key figure under the words that say what it counts, such as "412" under "Reporting
// live", set large to read at a glance. No Base UI component has behaviour for it, so every part
// renders through useRender. Spec: docs/components/stat.md.
import type { ReactNode } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import { known } from '../../internal/nodes.ts'
import { UnknownValue } from '../../internal/UnknownValue.tsx'
import { usePart } from '../../internal/use-part.ts'
import './Stat.css'

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

  const labelPart = usePart('div', slotProps?.label, {
    className: 'pn-Stat-label',
    children: label,
  })
  // The bare data-unknown marks an unknown figure: on the value for the CSS, so one class and one
  // attribute select the "—" colour, and on the root for the caller (CR-3)
  const dataUnknown = unknown ? '' : undefined
  const valuePart = usePart('div', slotProps?.value, {
    className: 'pn-Stat-value',
    'data-unknown': dataUnknown,
    // The "—" for the eye, and the words for the ear in their own text run (CR-4, CR-5)
    children: unknown ? <UnknownValue label={strings.unknown} /> : children,
  })

  // Stat's own props last, so they win over the caller's; className joins as "pn-Stat <caller's>"
  const own = {
    className: 'pn-Stat',
    'data-unknown': dataUnknown,
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
