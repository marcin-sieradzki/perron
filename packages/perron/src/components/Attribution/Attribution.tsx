'use client'
// Attribution: the map's credits, one strip of caption text on glass in a corner of the map, naming
// where the map and its data come from, with the caller's links to each source
// (docs/components/attribution.md). No Base UI component: a native <small>, small print, rendered
// through useRender, so the contract's render prop works, with no role, ARIA or data attribute of
// its own (CR-1) and no behaviour (CR-2).
import type { ReactNode } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import './Attribution.css'

export interface AttributionProps extends Omit<useRender.ComponentProps<'small'>, 'children'> {
  /**
   * The credits, as each source asks to be credited, with a link to each source's terms where it
   * has one: "Map data © OpenStreetMap contributors". Phrasing content only: text, links and inline
   * elements. Required: an empty strip credits no one.
   */
  children: ReactNode
}

/** Attribution's own props: its class, and nothing else (CR-1). */
const OWN = { className: 'pn-Attribution' }

/** Shows the map's credits, such as "Map data © OpenStreetMap contributors", on glass. */
export function Attribution({ render, ref, ...rest }: AttributionProps) {
  return useRender({
    defaultTagName: 'small',
    render,
    ref,
    // the caller's props first; mergeProps puts the rightmost class first, so pn-Attribution leads
    // the caller's (CR-1)
    props: mergeProps<'small'>(rest, OWN),
  })
}
