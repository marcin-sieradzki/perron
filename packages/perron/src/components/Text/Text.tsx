'use client'
// Text: a piece of text in one typography role and one text colour, on the element the caller's
// document needs. It renders through Base UI's useRender, so `render` swaps the element and keeps
// Perron's class, data attributes and ref (docs/components/text.md).
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from 'react'
import './Text.css'

/** The roles set on a `<p>`: sentences. Every other role is a `<span>` (CR-1). */
const PARAGRAPH_ROLES: ReadonlySet<string> = new Set(['body', 'body-sm'])

export interface TextProps
  extends
    Omit<HTMLAttributes<HTMLElement>, 'color' | 'children' | 'className' | 'style'>,
    Pick<useRender.ComponentProps<'span'>, 'render'> {
  /**
   * The typography role, one per job, as Typography gives them: `data` roles for anything compared
   * down a column, `overline` set in capitals. All sixteen roles, spelled as their tokens are, with
   * `'body'` first and the default: it is the role `perron.css` sets on the page body.
   * @default 'body'
   */
  variant?:
    | 'body'
    | 'display'
    | 'heading-lg'
    | 'heading-md'
    | 'heading-sm'
    | 'body-sm'
    | 'caption'
    | 'label'
    | 'label-sm'
    | 'overline'
    | 'badge'
    | 'stat'
    | 'data-xl'
    | 'data-lg'
    | 'data'
    | 'data-sm'
  /**
   * The intent: what the colour means. `neutral` is main text; `brand` is emphasis on the hero page,
   * never a link; the status intents say on time, warning, late or info, always beside words that
   * say it too, such as "Late" or "+4 min": colour is never the only sign. All six intents, each
   * with its `color.text.*` token, default `'neutral'` (`color.text.primary`) rather than
   * inheriting: every intent has a text token measured at 4.5:1, and text on an inverse or coloured
   * fill is the fill's own component's text, not a Text.
   * @default 'neutral'
   */
  color?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'
  /**
   * How strongly neutral text stands out: `primary` for what people read first, `secondary` for
   * supporting text, `tertiary` for hints and captions next to stronger text. Changes nothing with
   * any other `color`. A prop of Text's own, for `color.text.secondary` and `color.text.tertiary`,
   * which are no intent and so can't be `color` values; its values are the tokens' own names.
   * @default 'primary'
   */
  emphasis?: 'primary' | 'secondary' | 'tertiary'
  /** The text: a string, an element such as `<strong>` or `<time>`, or a list of both. */
  children?: ReactNode
  /** Joined after `pn-Text` on the root. */
  className?: string
  /** Merged onto the root. */
  style?: CSSProperties
  /** Reaches the root element, whichever element `render` makes it. */
  ref?: Ref<HTMLElement>
}

/** A piece of text in one typography role and one text colour. */
export function Text({
  variant = 'body',
  color = 'neutral',
  emphasis = 'primary',
  render,
  ref,
  ...rest
}: TextProps) {
  const own = {
    className: 'pn-Text',
    'data-variant': variant,
    'data-color': color,
    'data-emphasis': emphasis,
  }
  return useRender({
    // with no render, the role picks the element: <p> for sentences, <span> for the rest (CR-1)
    defaultTagName: PARAGRAPH_ROLES.has(variant) ? 'p' : 'span',
    render,
    ref,
    // the caller's first, so Text's own data attributes win and its class comes first (CR-2)
    props: mergeProps<'p'>(rest, own),
  })
}
