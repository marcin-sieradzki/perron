'use client'
// Section: a titled group of content inside a panel or a page, such as a stop's departures. No Base
// UI component has behaviour for it, so every part renders through useRender.
// Spec: docs/components/section.md.
import { useId } from 'react'
import type { ReactNode } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { given } from '../../internal/nodes.ts'
import { usePart } from '../../internal/use-part.ts'
import './Section.css'

export interface SectionProps extends Omit<
  useRender.ComponentProps<'section'>,
  'title' | 'children'
> {
  /**
   * What the section is about, in a word or two and in sentence case: "Departures". Set in
   * capitals by the style; it names the section for screen readers. Required. Replaces the HTML
   * `title` attribute
   */
  title: ReactNode
  /** The section's content, below the title */
  children?: ReactNode
  /**
   * One small action at the end of the header, such as a small `outline` LinkButton to everything
   * the section lists
   */
  action?: ReactNode
  /** Props for each inner part, merged with the part's own, which win */
  slotProps?: {
    /** Props for the `header` part */
    header?: useRender.ComponentProps<'div'>
    /**
     * Props for the `title` part. Its `render` changes the heading's level, `render: <h2 />`, and
     * its `id` is the one the root's `aria-labelledby` points at
     */
    title?: useRender.ComponentProps<'h3'>
    /** Props for the `action` part */
    action?: useRender.ComponentProps<'div'>
    /** Props for the `content` part */
    content?: useRender.ComponentProps<'div'>
  }
}

/**
 * A titled group of content inside a panel or a page: a small heading in capitals, an optional
 * action beside it, and the content below. A `<section>` named by its title.
 */
export function Section({
  title,
  children,
  action,
  render,
  slotProps,
  ref,
  ...rest
}: SectionProps) {
  // The title's id is the caller's when given, else React's, so the region is always named by
  // its own heading (CR-2)
  const generatedId = useId()
  const titleId = slotProps?.title?.id ?? generatedId

  const titlePart = usePart(
    'h3',
    slotProps?.title,
    { className: 'pn-Section-title', id: titleId, children: title },
    true,
  )
  const actionPart = usePart(
    'div',
    slotProps?.action,
    { className: 'pn-Section-action', children: action },
    given(action),
  )
  const headerPart = usePart(
    'div',
    slotProps?.header,
    {
      className: 'pn-Section-header',
      children: (
        <>
          {titlePart}
          {actionPart}
        </>
      ),
    },
    true,
  )
  const contentPart = usePart(
    'div',
    slotProps?.content,
    { className: 'pn-Section-content', children },
    given(children),
  )

  // title, action, children, slotProps and render never reach the root (CR-3); aria-labelledby
  // after the caller's rest props, so it always points at the title (CR-2)
  return useRender({
    defaultTagName: 'section',
    render,
    ref,
    props: mergeProps<'section'>(rest, {
      className: 'pn-Section',
      'aria-labelledby': titleId,
      children: (
        <>
          {headerPart}
          {contentPart}
        </>
      ),
    }),
  })
}
