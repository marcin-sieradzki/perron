// Link: a native <a href> in text, underlined in the colour of the text around it, that takes the
// reader to another page or place. Spec: docs/components/link.md.
import type { CSSProperties, ReactNode, Ref } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import './Link.css'

// The <a> element's props and Base UI's `render`, inherited as it is, without React's non-standard
// `color` attribute, so `color="brand"` is a type error; the <a> element's type already has no
// `disabled` (CR-7).
export interface LinkProps extends Omit<
  useRender.ComponentProps<'a'>,
  'children' | 'ref' | 'color' | 'href' | 'className' | 'style'
> {
  /**
   * Where the link goes: a URL or a path. Give it on every Link, unless `render` gives a router's
   * link that brings its own destination.
   */
  href?: string
  /**
   * The link's words, which name where it goes: "Rejseplanen", "Show all departures". Phrasing
   * content only. Required in practice: a link with no words has no name.
   */
  children?: ReactNode
  /** Reaches the root; `className` is merged after `pn-Link`. */
  className?: string
  /** Reaches the root; `className` is merged after `pn-Link`. */
  style?: CSSProperties
  /** Reaches the root element. */
  ref?: Ref<HTMLAnchorElement>
}

/**
 * A link in text, such as "Departures from Rejseplanen", underlined in the colour of the text
 * around it.
 */
export function Link({ href, render, children, className, style, ref, ...rest }: LinkProps) {
  // Each declared prop taken out of rest, then merged with Link's own last, so its class and href
  // stand: the class reads "pn-Link <caller's>", and `href` only when given, so a router link's
  // own destination stands (CR-1, CR-8).
  const own = {
    className: 'pn-Link',
    ...(href !== undefined && { href }),
    children,
  }
  // A native <a>, never Base UI's Button, which would give it role="button" (CR-1)
  return useRender({
    defaultTagName: 'a',
    render,
    ref,
    props: mergeProps<'a'>(rest, { className, style }, own),
  })
}
