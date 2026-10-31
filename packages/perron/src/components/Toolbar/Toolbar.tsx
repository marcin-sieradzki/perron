'use client'
// Toolbar: a bar of actions that is one tab stop, moved through with the arrow keys, on Base UI's
// Toolbar. Its button, group and separator live here too: Base UI's parts read the root's context,
// so they can't be built or shown apart (docs/components/toolbar.md, Anatomy).
import { Toolbar as BaseToolbar } from '@base-ui/react/toolbar'
import type { CSSProperties, ReactNode, Ref } from 'react'
import { classes } from '../../internal/nodes.ts'
import './Toolbar.css'

/** Whether `node` renders anything: React draws nothing for null, undefined, a boolean or ''. */
const renders = (node: ReactNode) =>
  node !== undefined && node !== null && typeof node !== 'boolean' && node !== ''

/**
 * What each of the four inherits from its Base UI part: every prop but `own`, the ones it declares
 * itself, and React's `className`, `style`, `children` and `ref`, which it declares as React's.
 */
type Inherited<P, own extends keyof P = never> = Omit<
  P,
  own | 'className' | 'style' | 'children' | 'ref'
>

export interface ToolbarProps extends Inherited<
  BaseToolbar.Root.Props,
  'orientation' | 'disabled'
> {
  /**
   * Which way the bar runs, and so which arrow keys move through it: Left and Right for
   * `horizontal`, Up and Down for `vertical`.
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical'
  /**
   * Whether every button in the toolbar is disabled. The buttons stay focusable unless their
   * `focusableWhenDisabled` is `false`.
   * @default false
   */
  disabled?: boolean
  /** The toolbar's `ToolbarButton`s, `ToolbarGroup`s and `ToolbarSeparator`s, in reading order. */
  children?: ReactNode
  /** Reaches the root. Merged after `pn-Toolbar`. */
  className?: string
  /** Reaches the root. */
  style?: CSSProperties
  /** Reaches the root, the `role="toolbar"` element. */
  ref?: Ref<HTMLDivElement>
}

/**
 * A bar of actions that is one tab stop, moved through with the arrow keys. Name it with
 * `aria-label` or `aria-labelledby`.
 */
export function Toolbar({
  orientation = 'horizontal',
  disabled = false,
  className,
  ref,
  ...rest
}: ToolbarProps) {
  return (
    <BaseToolbar.Root
      {...rest}
      ref={ref}
      orientation={orientation}
      disabled={disabled}
      className={classes('pn-Toolbar', className)}
    />
  )
}

export interface ToolbarButtonProps extends Inherited<BaseToolbar.Button.Props, 'disabled'> {
  /**
   * The intent: `neutral` is ink on the toolbar's glass, for every action but the main one;
   * `brand` is the brand yellow, for the one main action of a screen.
   * @default 'neutral'
   */
  color?: 'neutral' | 'brand'
  /**
   * Whether the button ignores the pointer and the keys. It stays focusable, and in the arrow-key
   * order, unless `focusableWhenDisabled` is `false`.
   * @default false
   */
  disabled?: boolean
  /**
   * Whether the button, a toggle such as the map's 3D view, is on: `true` or `false` sets
   * `aria-pressed` and draws the button on or off, and `true` sets `data-selected`. Left out, the
   * button is no toggle and has no `aria-pressed`. The caller keeps the state and flips it in
   * `onClick`.
   */
  selected?: boolean
  /**
   * An icon before the label, in reading order. Hidden from screen readers. Alone, with no
   * `children`, it makes an icon-only button, which needs an `aria-label`.
   */
  startIcon?: ReactNode
  /** An icon after the label, in reading order. Hidden from screen readers: the label names the button. */
  endIcon?: ReactNode
  /**
   * The label: the words that name the action, in sentence case. Leave it out only for an
   * icon-only button with an `aria-label`.
   */
  children?: ReactNode
  /** Reaches the root. Merged after `pn-ToolbarButton`. */
  className?: string
  /** Reaches the root. */
  style?: CSSProperties
  /** Reaches the root, the `<button>`. */
  ref?: Ref<HTMLButtonElement>
}

/**
 * One action in a `Toolbar`: a native button in the toolbar's arrow-key order. An icon-only one
 * (a `startIcon` and no `children`) is named by its `aria-label`.
 */
export function ToolbarButton({
  color = 'neutral',
  disabled = false,
  selected,
  startIcon,
  endIcon,
  children,
  className,
  ref,
  ...rest
}: ToolbarButtonProps) {
  const labelled = renders(children)
  const iconOnly = !labelled && renders(startIcon)
  return (
    <BaseToolbar.Button
      {...rest}
      ref={ref}
      disabled={disabled}
      // a toggle only when `selected` is given, so a plain button has no aria-pressed of its own,
      // and a caller's `aria-pressed`, spread with the rest, still reaches the root
      {...(selected !== undefined && { 'aria-pressed': selected })}
      data-selected={selected ? '' : undefined}
      data-color={color}
      data-icon-only={iconOnly ? '' : undefined}
      className={classes('pn-ToolbarButton', className)}
    >
      {renders(startIcon) ? (
        <span className="pn-ToolbarButton-startIcon" aria-hidden="true">
          {startIcon}
        </span>
      ) : null}
      {labelled ? <span className="pn-ToolbarButton-label">{children}</span> : null}
      {renders(endIcon) ? (
        <span className="pn-ToolbarButton-endIcon" aria-hidden="true">
          {endIcon}
        </span>
      ) : null}
    </BaseToolbar.Button>
  )
}

export interface ToolbarGroupProps extends Inherited<BaseToolbar.Group.Props, 'disabled'> {
  /**
   * Whether every button in the group is disabled.
   * @default false
   */
  disabled?: boolean
  /** The group's `ToolbarButton`s, in reading order. */
  children?: ReactNode
  /** Reaches the root. Merged after `pn-ToolbarGroup`. */
  className?: string
  /** Reaches the root. */
  style?: CSSProperties
  /** Reaches the root, the `role="group"` element. */
  ref?: Ref<HTMLDivElement>
}

/** Related buttons in a `Toolbar`, kept together; name it with `aria-label` when it needs one. */
export function ToolbarGroup({ disabled = false, className, ref, ...rest }: ToolbarGroupProps) {
  return (
    <BaseToolbar.Group
      {...rest}
      ref={ref}
      disabled={disabled}
      className={classes('pn-ToolbarGroup', className)}
    />
  )
}

export interface ToolbarSeparatorProps extends Inherited<BaseToolbar.Separator.Props> {
  /** Reaches the root. Merged after `pn-ToolbarSeparator`. */
  className?: string
  /** Reaches the root. */
  style?: CSSProperties
  /** Reaches the root, the `role="separator"` element. */
  ref?: Ref<HTMLDivElement>
}

/** A hairline between buttons or groups in a `Toolbar`, running across the bar. */
export function ToolbarSeparator({ className, ref, ...rest }: ToolbarSeparatorProps) {
  return (
    <BaseToolbar.Separator
      {...rest}
      ref={ref}
      className={classes('pn-ToolbarSeparator', className)}
    />
  )
}
