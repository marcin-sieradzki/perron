// FactList: a short list of facts about one thing, each a name and what it is, such as
// "Operator: Movia", set as a description list. No Base UI component has behaviour for it, so
// every part renders through useRender. Spec: docs/components/fact-list.md.
import type { CSSProperties, Key, ReactNode, Ref } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { VisuallyHidden } from '../../parts/VisuallyHidden/VisuallyHidden.tsx'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import './FactList.css'

/** U+2014, the dash content design writes for unknown (CR-5). */
const UNKNOWN = '—'

/** One fact: its name and what it is. */
export interface FactListItem {
  /** The fact's name, in a word or two: "Operator", "Last report". Required */
  label: ReactNode
  /**
   * What the fact is, written as content design writes it: "Movia", "32 km/h". Leave it out when
   * no data says it, and FactList shows "—" and says "Unknown"
   */
  value?: ReactNode
  /** The React key for the fact's row, when the facts change order; the entry's index when left out */
  key?: Key
}

export interface FactListProps extends Omit<useRender.ComponentProps<'dl'>, 'children' | 'ref'> {
  /**
   * The facts, in reading order, each `{ label, value, key }`: `label` names the fact, `value` says
   * what it is, and `key` is its React key when the facts change order. Required
   */
  items: ReadonlyArray<FactListItem>
  /**
   * Overrides "Unknown", heard in place of "—" for a fact with no value
   * @default The locale's
   */
  unknownLabel?: string
  /**
   * Props for each inner part, merged with the part's own, which win. One value reaches every
   * part of its kind, so give it no `id`, which would repeat
   */
  slotProps?: {
    /** Props for every `item` part */
    item?: useRender.ComponentProps<'div'>
    /** Props for every `label` part */
    label?: useRender.ComponentProps<'dt'>
    /** Props for every `value` part */
    value?: useRender.ComponentProps<'dd'>
  }
  /** Joined after `pn-FactList` on the root */
  className?: string
  /** Reaches the root */
  style?: CSSProperties
  /** Reaches the root element */
  ref?: Ref<HTMLDListElement>
}

/**
 * Whether a value says something: `null`, `undefined`, a boolean, `''`, a number that is not
 * finite, and an array of only such values say nothing; `0` and `'0'` are values (CR-4).
 */
const known = (node: ReactNode): boolean =>
  Array.isArray(node)
    ? node.some(known)
    : node != null &&
      typeof node !== 'boolean' &&
      node !== '' &&
      (typeof node !== 'number' || Number.isFinite(node))

type PartTag = 'div' | 'dt' | 'dd'

/**
 * One inner part: its `slotProps` value merged with the part's own props, its own last, so its
 * class, `data-unknown` and children stay while the caller's `className` joins and its `render`
 * swaps the element (CR-7).
 */
function usePart(
  defaultTagName: PartTag,
  slot: useRender.ComponentProps<PartTag> | undefined,
  own: useRender.ElementProps<PartTag> & { 'data-unknown'?: string },
) {
  const { render, ...props } = slot ?? {}
  // dt, dd and div all take HTMLElement's props, so one merge serves the three
  return useRender({
    defaultTagName,
    render,
    props: mergeProps<'div'>(
      props as useRender.ElementProps<'div'>,
      own as useRender.ElementProps<'div'>,
    ),
  })
}

interface FactProps {
  fact: FactListItem
  slotProps: FactListProps['slotProps']
  unknownLabel: string
}

/** One fact's item part, holding its label part then its value part (CR-2). */
function Fact({ fact, slotProps, unknownLabel }: FactProps) {
  const unknown = !known(fact.value)
  // The bare data-unknown marks an unknown value: on the value for the CSS, so one class and one
  // attribute select the "—" colour, and on the item for the caller (CR-4)
  const dataUnknown = unknown ? '' : undefined
  const label = usePart('dt', slotProps?.label, {
    className: 'pn-FactList-label',
    children: fact.label,
  })
  const value = usePart('dd', slotProps?.value, {
    className: 'pn-FactList-value',
    'data-unknown': dataUnknown,
    // The "—" for the eye, and the words for the ear in their own text run (CR-5, CR-6)
    children: unknown ? (
      <>
        <span aria-hidden="true">{UNKNOWN}</span>
        <VisuallyHidden>{unknownLabel}</VisuallyHidden>
      </>
    ) : (
      fact.value
    ),
  })
  return usePart('div', slotProps?.item, {
    className: 'pn-FactList-item',
    'data-unknown': dataUnknown,
    children: (
      <>
        {label}
        {value}
      </>
    ),
  })
}

/**
 * A short list of facts about one thing, each a name and what it is, as a description list: the
 * names in one column and their values beside them. A fact with no value shows "—" and says
 * "Unknown".
 */
export function FactList({ items, unknownLabel, slotProps, render, ref, ...rest }: FactListProps) {
  const strings = useOwnedStrings({ unknown: unknownLabel })
  // FactList's own props last, so they win over the caller's; className joins as
  // "pn-FactList <caller's>", and the facts are the only children (CR-2, CR-9)
  const own = {
    className: 'pn-FactList',
    children: items.map((fact, index) => (
      <Fact
        key={fact.key ?? index}
        fact={fact}
        slotProps={slotProps}
        unknownLabel={strings.unknown}
      />
    )),
  }
  return useRender({
    defaultTagName: 'dl',
    render,
    ref,
    props: mergeProps<'dl'>(rest, own),
  })
}
