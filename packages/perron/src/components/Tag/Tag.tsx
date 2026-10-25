// Tag: a short word or two on a pill that marks a property of what it sits beside, such as "Night
// bus" or "Cancelled", set in capitals in one of the intents' colours. Spec: docs/components/tag.md.
// No Base UI component: a <span> rendered through useRender, so the contract's render prop works.
import type { CSSProperties, ReactNode, Ref } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import './Tag.css'

export interface TagProps extends Omit<
  useRender.ComponentProps<'span'>,
  'children' | 'className' | 'style' | 'ref'
> {
  /**
   * How sure the tag is: `filled` lays the intent's tinted surface under the words, for a property
   * that holds; `dashed` has no fill and a dashed edge, for something announced but not yet
   * confirmed by live data. Set on the root as `data-variant`.
   * @default 'filled'
   */
  variant?: 'filled' | 'dashed'
  /**
   * The intent: what the colour means. `neutral` for a plain property, such as "Night bus"; the
   * status intents for good news, a warning, a problem or information, always in words that say it
   * too, such as "Cancelled": colour is never the only sign. Set on the root as `data-color`.
   * @default 'neutral'
   */
  color?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
  /**
   * The words: one or two, and on a `dashed` tag a word more that says it is not confirmed, such
   * as "Replacement bus planned"; written in sentence case, which the tag sets in capitals. A
   * string, an element such as `<time>`, or a list of both.
   */
  children: ReactNode
  /** Joined after `pn-Tag` on the root */
  className?: string
  /** Reaches the root */
  style?: CSSProperties
  /** Reaches the root element */
  ref?: Ref<HTMLSpanElement>
}

/** Marks a property of what it sits beside, such as "Night bus", in one or two words on a pill. */
export function Tag({ variant = 'filled', color = 'neutral', render, ref, ...rest }: TagProps) {
  // CR-1, CR-2: variant and color are out of rest, so they reach the DOM only as data attributes,
  // the defaults included. CR-7: no tabIndex and no handler of Tag's own.
  const own = { className: 'pn-Tag', 'data-variant': variant, 'data-color': color }
  return useRender({
    defaultTagName: 'span',
    render,
    ref,
    // the caller's props first, so Tag's own class and data attributes win; mergeProps puts the
    // rightmost class first, so pn-Tag leads the caller's
    props: mergeProps<'span'>(rest, own),
  })
}
