// LineBadge: a small filled label that names one Copenhagen line in the operator's own colours.
// No Base UI component: a <span> rendered through useRender, so the contract's render prop works.
import type { ReactNode } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import './LineBadge.css'

export interface LineBadgeProps extends Omit<useRender.ComponentProps<'span'>, 'children'> {
  /**
   * The line whose colours the badge takes: a metro line (`m1` to `m4`), an S-tog line (`a` to
   * `h`), any bus (`bus`), or any regional or Øresund train (`regional`). Required, with no
   * default; set on the root as `data-line`.
   */
  line: 'm1' | 'm2' | 'm3' | 'm4' | 'a' | 'b' | 'c' | 'e' | 'f' | 'h' | 'bus' | 'regional'
  /**
   * `medium` is the badge in rows and lists, `size.badge` tall; `large` is the badge in a panel's
   * header, `size.badge-lg` tall. Both sizes set the label in `typography.badge`.
   * @default 'medium'
   */
  size?: 'medium' | 'large'
  /**
   * The line's short name as riders know it: "M1", "A", "5C", "RE". Required: the badge never
   * derives it from `line`, which holds no bus number.
   */
  children: ReactNode
}

/** Names one line, such as M1, A or 5C, in its operator's fill and label colour. */
export function LineBadge({ line, size = 'medium', render, ref, ...rest }: LineBadgeProps) {
  const own = { className: 'pn-LineBadge', 'data-line': line, 'data-size': size }
  return useRender({
    defaultTagName: 'span',
    render,
    ref,
    // the caller's props first, so the component's own class and data attributes win; mergeProps
    // puts the rightmost class first, so pn-LineBadge leads the caller's
    props: mergeProps<'span'>(rest, own),
  })
}
