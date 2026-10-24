// LinkButton: a native <a href> with Button's look, that takes the reader to another page or place,
// where a Button runs an action. Spec: docs/components/link-button.md.
import type { CSSProperties, ReactNode, Ref } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import './LinkButton.css'

/**
 * Whether an icon prop renders anything: `false`, `true`, `null`, `undefined` and `''` leave no
 * icon span (CR-9).
 */
const rendersSomething = (node: ReactNode) =>
  node != null && typeof node !== 'boolean' && node !== ''

// The <a> element's props and Base UI's `render`, inherited as it is, without React's non-standard
// `color` attribute, so `color="brand"` is a type error (CR-14); the <a> element's type already has
// no `disabled`.
export interface LinkButtonProps extends Omit<
  useRender.ComponentProps<'a'>,
  'children' | 'ref' | 'color' | 'href' | 'className' | 'style'
> {
  /**
   * Where the link goes: a URL or a path. Give it on every LinkButton, unless `render` gives a
   * router's link that brings its own destination.
   */
  href?: string
  /**
   * How much the link stands out: `solid` is filled, for the main place a panel leads to;
   * `outline` is an edge only, for the links and actions beside it.
   * @default 'solid'
   */
  variant?: 'solid' | 'outline'
  /**
   * The link's height: `medium` is `size.button`, `small` is `size.button-sm`, for dense rows and
   * panels.
   * @default 'medium'
   */
  size?: 'small' | 'medium'
  /**
   * Whether the link fills the width of its container, such as a bottom sheet's main link. Sets
   * `data-full-width`.
   * @default false
   */
  fullWidth?: boolean
  /**
   * An icon before the label, in reading order, so it moves to the right in right-to-left text.
   * Hidden from screen readers: the label names the link.
   */
  startIcon?: ReactNode
  /**
   * An icon after the label, in reading order. Hidden from screen readers: the label names the
   * link.
   */
  endIcon?: ReactNode
  /**
   * The label: the words that name where the link goes, in sentence case. Required in practice: a
   * link with no words has no name.
   */
  children?: ReactNode
  /** Reaches the root. Merged after `pn-LinkButton`. */
  className?: string
  /** Reaches the root. */
  style?: CSSProperties
  /** Reaches the root element. */
  ref?: Ref<HTMLAnchorElement>
}

/**
 * A link that looks like a Button and takes the reader to another page or place, such as "Back to
 * the map".
 */
export function LinkButton({
  href,
  variant = 'solid',
  size = 'medium',
  fullWidth = false,
  startIcon,
  endIcon,
  render,
  children,
  ref,
  ...rest
}: LinkButtonProps) {
  // LinkButton's own props last, so its class, data attributes and children win (CR-13);
  // className joins as "pn-LinkButton <caller's>". `href` only when given, so a router link's own
  // destination stands (CR-15).
  const own = {
    className: 'pn-LinkButton',
    ...(href !== undefined && { href }),
    'data-variant': variant,
    'data-size': size,
    'data-full-width': fullWidth ? '' : undefined,
    children: (
      <>
        {rendersSomething(startIcon) && (
          <span className="pn-LinkButton-startIcon" aria-hidden="true">
            {startIcon}
          </span>
        )}
        <span className="pn-LinkButton-label">{children}</span>
        {rendersSomething(endIcon) && (
          <span className="pn-LinkButton-endIcon" aria-hidden="true">
            {endIcon}
          </span>
        )}
      </>
    ),
  }
  // A native <a>, never Base UI's Button, which would give it role="button" (CR-1)
  return useRender({
    defaultTagName: 'a',
    render,
    ref,
    props: mergeProps<'a'>(rest, own),
  })
}
