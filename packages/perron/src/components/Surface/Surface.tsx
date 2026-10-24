// Surface: a box on one step of the surface ladder, glass or an opaque panel over the map, a raised
// card inside a panel, or an inset box, holding the caller's content. Spec: docs/components/surface.md.
import type { CSSProperties, ReactNode, Ref } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import './Surface.css'

export interface SurfaceProps extends Omit<
  useRender.ComponentProps<'div'>,
  'children' | 'className' | 'style' | 'render' | 'ref'
> {
  /**
   * The step of the surface ladder: `raised` for a card inside a panel, `inset` for a box or track
   * set into one, `glass` for a panel floating over the map, `opaque` for a floating panel full of
   * text on a phone, where glass would let the map show through.
   * @default 'raised'
   */
  variant?: 'raised' | 'inset' | 'glass' | 'opaque'
  /**
   * Swaps the root element, keeping the class, data attribute and content: `<section>` or
   * `<aside>` with `aria-labelledby` for a named region.
   * @default <div />
   */
  render?: useRender.ComponentProps<'div'>['render']
  /** The content the surface holds */
  children?: ReactNode
  /** Reaches the root, merged after `pn-Surface` */
  className?: string
  /** Reaches the root */
  style?: CSSProperties
  /** Reaches the root element */
  ref?: Ref<HTMLDivElement>
}

/**
 * A box on one step of the surface ladder: a raised card, an inset box, or a glass or opaque panel
 * floating over the map. A `<div>` with no role; render it as a named `<section>` for a region.
 */
export function Surface({ variant = 'raised', render, ref, ...rest }: SurfaceProps) {
  // Surface's own props last, so they win over the caller's; className joins as
  // "pn-Surface <caller's>", and variant never reaches the DOM (CR-1, CR-2)
  const own = { className: 'pn-Surface', 'data-variant': variant }
  return useRender({
    defaultTagName: 'div',
    render,
    ref,
    props: mergeProps<'div'>(rest, own),
  })
}
