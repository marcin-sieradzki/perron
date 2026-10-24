// EmptyState: stands in for a list or panel with nothing to show, saying what is empty, why, and
// what to try. No Base UI component has behaviour for it, so every part renders through useRender.
// Spec: docs/components/empty-state.md.
import type { ReactNode } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import './EmptyState.css'

export interface EmptyStateProps extends Omit<
  useRender.ComponentProps<'div'>,
  'title' | 'children' | 'render'
> {
  /**
   * What is empty, in a few words: "No matches for Nørrebro st". Required. Replaces the HTML
   * `title` attribute
   */
  title: ReactNode
  /** The sentence under the title: why it is empty and what to try. "Try a line number such as 5C." */
  children?: ReactNode
  /** An icon from Perron's set above the title, for the eye only: it is hidden from screen readers */
  icon?: ReactNode
  /** What the person can do about it, such as a button that clears the search, below the sentence */
  action?: ReactNode
  /** Swaps the root element, keeping its class and props */
  render?: useRender.RenderProp
  /** Props for each inner part, merged with the part's own, which win */
  slotProps?: {
    /** Props for the `icon` part */
    icon?: useRender.ComponentProps<'div'>
    /** Props for the `title` part. Its `render` makes the title a heading: `render: <h3 />` */
    title?: useRender.ComponentProps<'p'>
    /** Props for the `description` part */
    description?: useRender.ComponentProps<'div'>
    /** Props for the `action` part */
    action?: useRender.ComponentProps<'div'>
  }
}

/** A node that renders something: `null`, `undefined` and booleans render nothing (CR-1). */
const given = (node: ReactNode) => node != null && typeof node !== 'boolean'

/**
 * One inner part: its `slotProps` value merged with the part's own props, its own last, so its
 * class and children stay while the caller's `className` joins and its `render` swaps the element
 * (CR-4). With `enabled` false it renders nothing (CR-1).
 */
function usePart(
  defaultTagName: 'div' | 'p',
  slot: useRender.ComponentProps<'div'> | useRender.ComponentProps<'p'> | undefined,
  own: useRender.ElementProps<'div'>,
  enabled: boolean,
) {
  const { render, ...props } = slot ?? {}
  return useRender({
    defaultTagName,
    render,
    enabled,
    props: mergeProps<'div'>(props as useRender.ElementProps<'div'>, own),
  })
}

/**
 * Stands in for a list or panel that has nothing to show, and says in plain words what is empty,
 * why, and what to try next.
 */
export function EmptyState({
  title,
  children,
  icon,
  action,
  render,
  slotProps,
  ref,
  ...rest
}: EmptyStateProps) {
  const iconPart = usePart(
    'div',
    slotProps?.icon,
    // aria-hidden after the caller's, so the icon never speaks (CR-2)
    { className: 'pn-EmptyState-icon', 'aria-hidden': true, children: icon },
    given(icon),
  )
  const titlePart = usePart(
    'p',
    slotProps?.title,
    { className: 'pn-EmptyState-title', children: title },
    true,
  )
  const descriptionPart = usePart(
    'div',
    slotProps?.description,
    { className: 'pn-EmptyState-description', children },
    given(children),
  )
  const actionPart = usePart(
    'div',
    slotProps?.action,
    { className: 'pn-EmptyState-action', children: action },
    given(action),
  )

  return useRender({
    defaultTagName: 'div',
    render,
    ref,
    props: mergeProps<'div'>(rest, {
      className: 'pn-EmptyState',
      children: (
        <>
          {iconPart}
          {titlePart}
          {descriptionPart}
          {actionPart}
        </>
      ),
    }),
  })
}
