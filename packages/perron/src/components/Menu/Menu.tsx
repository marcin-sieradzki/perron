// Menu: a list of actions and settings that opens from a button, on Base UI's Menu. Base UI gives
// the opening, the placing, the arrow keys, typeahead, the checkbox and radio state, the submenus,
// Esc, the outside press, the focus return and every role; nothing here adds a key or pointer
// handler (CR-1). Its items, groups, separator and submenu live here too: Base UI's parts read the
// root's context, so they can't be built or shown apart (docs/components/menu.md, Anatomy).
import { mergeProps } from '@base-ui/react/merge-props'
import { Menu as BaseMenu } from '@base-ui/react/menu'
import { useId } from 'react'
import type { CSSProperties, ReactElement, ReactNode, Ref } from 'react'
import { classes, given, withClass } from '../../internal/nodes.ts'
import { positionerOffsets, tokenValue } from '../../internal/tokens.ts'
import { CheckboxIndicator } from '../../parts/CheckboxIndicator/CheckboxIndicator.tsx'
import { SelectedMark } from '../../parts/SelectedMark/SelectedMark.tsx'
import './Menu.css'

/**
 * What each of the nine inherits from its Base UI part: every prop but `own`, the ones it declares
 * itself, and React's `className`, `style`, `children` and `ref`, which it declares as React's.
 */
type Inherited<P, own extends keyof P = never> = Omit<
  P,
  own | 'className' | 'style' | 'children' | 'ref'
>

/** A length token's value in pixels, or `NaN` until a token stylesheet gives it in pixels. */
const pixels = (value: string | undefined) =>
  value?.endsWith('px') ? Number.parseFloat(value) : Number.NaN

/** CR-9's offsets in pixels, read once a token stylesheet gives both, and kept. */
let offsets: { sideOffset: number; alignOffset: number } | undefined

/**
 * The popup's `sideOffset`, `space.100`, and a submenu's `alignOffset`, minus `space.100` plus
 * `border.width.025`, by `tokenValue` (CR-9). Nothing with no document, as on a server, or before
 * a token stylesheet gives both, so Base UI's own defaults hold until they can be read.
 */
function menuOffsets() {
  if (offsets === undefined) {
    const space = pixels(tokenValue('--perron-space-100'))
    const edge = pixels(tokenValue('--perron-border-width-025'))
    if (!Number.isNaN(space) && !Number.isNaN(edge))
      offsets = { sideOffset: space, alignOffset: -(space + edge) }
  }
  return offsets
}

/** The rows that hold a start icon and a label, by the class each part's name starts with. */
type Row = 'MenuItem' | 'MenuLinkItem' | 'MenuSubmenu'

/** A row's start icon, only when one is given, and its label, which grows to fill the row (CR-11). */
function RowContent({
  row,
  startIcon,
  children,
}: {
  row: Row
  startIcon: ReactNode
  children: ReactNode
}) {
  return (
    <>
      {given(startIcon) && (
        <span className={`pn-${row}-startIcon`} aria-hidden="true">
          {startIcon}
        </span>
      )}
      <span className={`pn-${row}-label`}>{children}</span>
    </>
  )
}

export interface MenuProps extends Inherited<BaseMenu.Popup.Props, 'id'> {
  /**
   * The button that opens the menu, such as a Button or an IconButton, rendered in
   * place of the menu. Required: it opens the menu, names it, and gets focus back when the menu
   * closes.
   */
  trigger: ReactElement
  /**
   * The menu's items, in reading order: `MenuItem`, `MenuLinkItem`, `MenuCheckboxItem`,
   * `MenuRadioGroup`, `MenuGroup`, `MenuSeparator` and `MenuSubmenu`.
   */
  children?: ReactNode
  /**
   * Whether the menu is open. Set it to control the menu, with `onOpen` and `onClose` to hear when
   * it asks to change; leave it out for a menu its trigger opens.
   */
  open?: boolean
  /**
   * Whether the menu is open at first, when `open` is left out.
   * @default false
   */
  defaultOpen?: boolean
  /**
   * Called when the menu asks to open, from its trigger: `details.reason` is `'trigger-press'`,
   * `'trigger-hover'` or another of Base UI's reasons, and `details.cancel()` keeps it closed.
   */
  onOpen?: (event: Event, details: BaseMenu.Root.ChangeEventDetails) => void
  /**
   * Called when the menu asks to close: `reason` is `'item-press'`, `'escape-key'`,
   * `'outside-press'`, `'focus-out'` or another of Base UI's reasons, and `details.cancel()` keeps
   * it open.
   */
  onClose?: (
    event: Event,
    reason: BaseMenu.Root.ChangeEventReason,
    details: BaseMenu.Root.ChangeEventDetails,
  ) => void
  /**
   * Whether the trigger ignores the pointer and the keys, so the menu can't open. The trigger
   * carries `data-disabled`.
   * @default false
   */
  disabled?: boolean
  /**
   * The popup's `id`, which the trigger's `aria-controls` reads. Base UI sets one itself when left
   * out.
   */
  id?: string
  /** Reaches the root, the popup. Merged after `pn-Menu`. */
  className?: string
  /** Reaches the root, the popup. */
  style?: CSSProperties
  /** Reaches the root, the popup, the `role="menu"` element. */
  ref?: Ref<HTMLDivElement>
  /** Props for each inner part, merged with the part's own, which win but where CR-9 says. */
  slotProps?: {
    /**
     * Props for the `trigger` part, such as `nativeButton={false}` when `trigger` is not a
     * `<button>`, or `openOnHover`.
     */
    trigger?: BaseMenu.Trigger.Props
    /** Props for the `portal` part, such as its `container`. */
    portal?: BaseMenu.Portal.Props
    /**
     * Props for the `positioner` part, such as `side` or `align`. Its `align`, `sideOffset` and
     * `collisionPadding` replace Menu's own (CR-9).
     */
    positioner?: BaseMenu.Positioner.Props
  }
}

/** A list of actions and settings that opens from a button, such as "Map options". */
export function Menu({
  trigger,
  children,
  open,
  defaultOpen = false,
  onOpen,
  onClose,
  disabled = false,
  className,
  style,
  ref,
  slotProps,
  ...rest
}: MenuProps) {
  const generatedId = useId()

  // CR-4: Base UI's one handler becomes MUI's two
  const handleOpenChange = (next: boolean, details: BaseMenu.Root.ChangeEventDetails) => {
    if (next) onOpen?.(details.event, details)
    else onClose?.(details.event, details.reason, details)
  }

  // CR-5: the trigger's id names the popup and tells Base UI where focus returns, for a menu open
  // at first render or controlled
  const triggerId = (trigger.props as { id?: string }).id ?? slotProps?.trigger?.id ?? generatedId
  const triggerLink = open === undefined ? { defaultTriggerId: triggerId } : { triggerId }

  // CR-9: below the trigger, at its start edge, space.100 away and size.panel-gap from the screen's
  // edge; the caller's positioner wins
  const positioner = slotProps?.positioner
  const defaults = positionerOffsets()

  return (
    <BaseMenu.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={handleOpenChange}
      disabled={disabled}
      {...triggerLink}
    >
      <BaseMenu.Trigger
        {...mergeProps<typeof BaseMenu.Trigger>(slotProps?.trigger, {
          render: trigger,
          id: triggerId,
        })}
        className={withClass('pn-Menu-trigger', slotProps?.trigger?.className)}
      />
      <BaseMenu.Portal
        {...slotProps?.portal}
        className={withClass('pn-Menu-portal', slotProps?.portal?.className)}
      >
        <BaseMenu.Positioner
          // CR-9: the caller's props, then Menu's defaults where it gives none
          {...mergeProps<typeof BaseMenu.Positioner>(positioner, {
            align: positioner?.align ?? 'start',
            sideOffset: positioner?.sideOffset ?? menuOffsets()?.sideOffset,
            collisionPadding: positioner?.collisionPadding ?? defaults.collisionPadding,
          })}
          className={withClass('pn-Menu-positioner', positioner?.className)}
        >
          <BaseMenu.Popup
            {...rest}
            ref={ref}
            style={style}
            className={classes('pn-Menu', className)}
          >
            {children}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  )
}

export interface MenuItemProps extends Inherited<BaseMenu.Item.Props, 'disabled' | 'id'> {
  /**
   * An icon before the label, in reading order, such as `locate` for "Centre the map". Hidden from
   * screen readers: the label names the item.
   */
  startIcon?: ReactNode
  /**
   * Whether the item ignores presses. It stays focusable and in the arrow-key order, announced as
   * dimmed, so the person learns it is there.
   * @default false
   */
  disabled?: boolean
  /** The label: the words that name the action, in sentence case, such as "Centre the map". */
  children?: ReactNode
  /** The row's `id`. Base UI sets one itself when left out. */
  id?: string
  /** Reaches the root, the row. Merged after `pn-MenuItem`. */
  className?: string
  /** Reaches the root, the row. */
  style?: CSSProperties
  /** Reaches the root, the row, the `role="menuitem"` element. */
  ref?: Ref<HTMLDivElement>
}

/** One action in a `Menu`, such as "Centre the map": a press runs it and closes the menu. */
export function MenuItem({
  startIcon,
  disabled = false,
  children,
  className,
  ref,
  ...rest
}: MenuItemProps) {
  return (
    <BaseMenu.Item
      {...rest}
      ref={ref}
      disabled={disabled}
      className={classes('pn-MenuItem', className)}
    >
      <RowContent row="MenuItem" startIcon={startIcon}>
        {children}
      </RowContent>
    </BaseMenu.Item>
  )
}

export interface MenuLinkItemProps extends Inherited<BaseMenu.LinkItem.Props, 'id'> {
  /**
   * An icon before the label, in reading order. Hidden from screen readers: the label names the
   * link.
   */
  startIcon?: ReactNode
  /** The label: the words that say where the link goes, in sentence case, such as "Data sources". */
  children?: ReactNode
  /** The `<a>`'s `id`. Base UI sets one itself when left out. */
  id?: string
  /**
   * Reaches the root, the `<a>`. Merged after `pn-MenuLinkItem`. `href`, `target` and the other
   * attributes of an `<a>` reach it through the rest props.
   */
  className?: string
  /** Reaches the root, the `<a>`. */
  style?: CSSProperties
  /** Reaches the root, the `<a role="menuitem">`. */
  ref?: Ref<HTMLAnchorElement>
}

/** One link in a `Menu`, such as "Data sources": an `<a href>` drawn as a row. */
export function MenuLinkItem({ startIcon, children, className, ref, ...rest }: MenuLinkItemProps) {
  return (
    <BaseMenu.LinkItem {...rest} ref={ref} className={classes('pn-MenuLinkItem', className)}>
      <RowContent row="MenuLinkItem" startIcon={startIcon}>
        {children}
      </RowContent>
    </BaseMenu.LinkItem>
  )
}

/**
 * The box as the CheckboxIndicator part, with Base UI's props and the tick while ticked (CR-8).
 * Written once, outside the component, since it reads nothing but its arguments.
 */
const renderCheckboxItemIndicator: BaseMenu.CheckboxItemIndicator.Props['render'] = (
  props,
  state,
) => <CheckboxIndicator {...props} mark={state.checked ? 'tick' : undefined} />

export interface MenuCheckboxItemProps extends Inherited<
  BaseMenu.CheckboxItem.Props,
  'checked' | 'defaultChecked' | 'onCheckedChange' | 'onChange' | 'disabled' | 'id'
> {
  /**
   * Whether the setting is on, when the caller controls it. Announced as checked or not checked.
   */
  checked?: boolean
  /**
   * Whether the setting is on at first, when the item keeps its state itself.
   * @default false
   */
  defaultChecked?: boolean
  /**
   * Called when a press, Enter or Space turns the setting on or off, with the new state as
   * `value`; `details.cancel()` keeps it as it was. `event` is `details.event`.
   */
  onChange?: (
    event: Event,
    value: boolean,
    details: BaseMenu.CheckboxItem.ChangeEventDetails,
  ) => void
  /**
   * Whether the item ignores presses. It stays focusable and in the arrow-key order, keeps its
   * state, and is announced as dimmed.
   * @default false
   */
  disabled?: boolean
  /**
   * The label: the words that name the setting, which stay the same on and off, such as "Show stop
   * names".
   */
  children?: ReactNode
  /** The row's `id`. Base UI sets one itself when left out. */
  id?: string
  /** Reaches the root, the row. Merged after `pn-MenuCheckboxItem`. */
  className?: string
  /** Reaches the root, the row. */
  style?: CSSProperties
  /** Reaches the root, the row, the `role="menuitemcheckbox"` element. */
  ref?: Ref<HTMLDivElement>
  /** Props for each inner part, merged with the part's own, which win. */
  slotProps?: {
    /**
     * Props for the box, all but `keepMounted` and `render`: the box always shows, and is always
     * the `CheckboxIndicator` part.
     */
    checkboxItemIndicator?: Omit<BaseMenu.CheckboxItemIndicator.Props, 'keepMounted' | 'render'>
  }
}

/** A setting in a `Menu` turned on or off, such as "Show stop names", with its box at the end. */
export function MenuCheckboxItem({
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  children,
  className,
  ref,
  slotProps,
  ...rest
}: MenuCheckboxItemProps) {
  return (
    <BaseMenu.CheckboxItem
      {...rest}
      ref={ref}
      checked={checked}
      defaultChecked={defaultChecked}
      disabled={disabled}
      // CR-4: Base UI's one handler, adapted to the contract's onChange(event, value, details)
      onCheckedChange={
        onChange &&
        ((next: boolean, details: BaseMenu.CheckboxItem.ChangeEventDetails) =>
          onChange(details.event, next, details))
      }
      className={classes('pn-MenuCheckboxItem', className)}
    >
      <span className="pn-MenuCheckboxItem-label">{children}</span>
      <BaseMenu.CheckboxItemIndicator
        {...mergeProps<typeof BaseMenu.CheckboxItemIndicator>(slotProps?.checkboxItemIndicator, {
          keepMounted: true,
          render: renderCheckboxItemIndicator,
        })}
        className={withClass(
          'pn-MenuCheckboxItem-checkboxItemIndicator',
          slotProps?.checkboxItemIndicator?.className,
        )}
      />
    </BaseMenu.CheckboxItem>
  )
}

export interface MenuRadioGroupProps extends Inherited<
  BaseMenu.RadioGroup.Props,
  'value' | 'defaultValue' | 'onValueChange' | 'onChange' | 'disabled'
> {
  /**
   * The choice's name, in sentence case, such as "Theme", shown above its items and naming the
   * group for screen readers. Leave it out only when the menu's trigger, or the submenu's row that
   * holds the group, already names the choice.
   */
  label?: ReactNode
  /** The `value` of the chosen radio item, when the caller controls it. */
  value?: string
  /** The `value` of the radio item chosen at first, when the group keeps its value itself. */
  defaultValue?: string
  /**
   * Called when a press, Enter or Space chooses another radio item, with its `value`;
   * `details.cancel()` keeps the choice as it was. `event` is `details.event`.
   */
  onChange?: (event: Event, value: string, details: BaseMenu.RadioGroup.ChangeEventDetails) => void
  /**
   * Whether every radio item in the group ignores presses. They stay focusable and keep the choice.
   * @default false
   */
  disabled?: boolean
  /** The group's `MenuRadioItem`s, in reading order. */
  children?: ReactNode
  /** Reaches the root, the group. Merged after `pn-MenuRadioGroup`. */
  className?: string
  /** Reaches the root, the group. */
  style?: CSSProperties
  /** Reaches the root, the `role="group"` element. */
  ref?: Ref<HTMLDivElement>
  /** Props for each inner part, merged with the part's own, which win. */
  slotProps?: {
    /** Props for the `groupLabel` part. */
    groupLabel?: BaseMenu.GroupLabel.Props
  }
}

/** One choice in a `Menu`, such as "Theme": its radio items, under its label. */
export function MenuRadioGroup({
  label,
  value,
  defaultValue,
  onChange,
  disabled = false,
  children,
  className,
  ref,
  slotProps,
  ...rest
}: MenuRadioGroupProps) {
  return (
    <BaseMenu.RadioGroup
      {...rest}
      ref={ref}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      // CR-4: Base UI's one handler, adapted to the contract's onChange(event, value, details)
      onValueChange={
        onChange &&
        ((next: string, details: BaseMenu.RadioGroup.ChangeEventDetails) =>
          onChange(details.event, next, details))
      }
      className={classes('pn-MenuRadioGroup', className)}
    >
      {given(label) && (
        <BaseMenu.GroupLabel
          {...slotProps?.groupLabel}
          className={withClass('pn-MenuRadioGroup-groupLabel', slotProps?.groupLabel?.className)}
        >
          {label}
        </BaseMenu.GroupLabel>
      )}
      {children}
    </BaseMenu.RadioGroup>
  )
}

export interface MenuRadioItemProps extends Inherited<
  BaseMenu.RadioItem.Props,
  'value' | 'disabled' | 'id'
> {
  /** Required: the value the radio group takes when this item is chosen. */
  value: string
  /**
   * Whether the item ignores presses. It stays focusable and in the arrow-key order, keeps its
   * tick while chosen, and is announced as dimmed.
   * @default false
   */
  disabled?: boolean
  /** The label: the option's name, such as "Dark". */
  children?: ReactNode
  /** The row's `id`. Base UI sets one itself when left out. */
  id?: string
  /** Reaches the root, the row. Merged after `pn-MenuRadioItem`. */
  className?: string
  /** Reaches the root, the row. */
  style?: CSSProperties
  /** Reaches the root, the row, the `role="menuitemradio"` element. */
  ref?: Ref<HTMLDivElement>
  /** Props for each inner part, merged with the part's own, which win. */
  slotProps?: {
    /**
     * Props for the tick, all but `keepMounted` and `render`: the tick shows only on the chosen
     * item, and is always the `SelectedMark` part.
     */
    radioItemIndicator?: Omit<BaseMenu.RadioItemIndicator.Props, 'keepMounted' | 'render'>
  }
}

/** One option of a `MenuRadioGroup`, such as "Dark", with the tick at its end while chosen. */
export function MenuRadioItem({
  value,
  disabled = false,
  children,
  className,
  ref,
  slotProps,
  ...rest
}: MenuRadioItemProps) {
  return (
    <BaseMenu.RadioItem
      {...rest}
      ref={ref}
      value={value}
      disabled={disabled}
      className={classes('pn-MenuRadioItem', className)}
    >
      <span className="pn-MenuRadioItem-label">{children}</span>
      <BaseMenu.RadioItemIndicator
        {...mergeProps<typeof BaseMenu.RadioItemIndicator>(slotProps?.radioItemIndicator, {
          keepMounted: false,
          render: <SelectedMark />,
        })}
        className={withClass(
          'pn-MenuRadioItem-radioItemIndicator',
          slotProps?.radioItemIndicator?.className,
        )}
      />
    </BaseMenu.RadioItem>
  )
}

export interface MenuGroupProps extends Inherited<BaseMenu.Group.Props> {
  /**
   * The group's name, in sentence case, such as "Map", shown above its items and naming the group
   * for screen readers.
   */
  label?: ReactNode
  /** The group's items, in reading order. */
  children?: ReactNode
  /** Reaches the root, the group. Merged after `pn-MenuGroup`. */
  className?: string
  /** Reaches the root, the group. */
  style?: CSSProperties
  /** Reaches the root, the `role="group"` element. */
  ref?: Ref<HTMLDivElement>
  /** Props for each inner part, merged with the part's own, which win. */
  slotProps?: {
    /** Props for the `groupLabel` part. */
    groupLabel?: BaseMenu.GroupLabel.Props
  }
}

/** Related items in a `Menu`, such as "Map", under their label. */
export function MenuGroup({ label, children, className, ref, slotProps, ...rest }: MenuGroupProps) {
  return (
    <BaseMenu.Group {...rest} ref={ref} className={classes('pn-MenuGroup', className)}>
      {given(label) && (
        <BaseMenu.GroupLabel
          {...slotProps?.groupLabel}
          className={withClass('pn-MenuGroup-groupLabel', slotProps?.groupLabel?.className)}
        >
          {label}
        </BaseMenu.GroupLabel>
      )}
      {children}
    </BaseMenu.Group>
  )
}

export interface MenuSeparatorProps extends Inherited<BaseMenu.Separator.Props, 'orientation'> {
  /** Reaches the root, the hairline. Merged after `pn-MenuSeparator`. */
  className?: string
  /** Reaches the root, the hairline. */
  style?: CSSProperties
  /** Reaches the root, the `role="separator"` element. */
  ref?: Ref<HTMLDivElement>
}

/** A hairline across a `Menu` between items or groups. */
export function MenuSeparator({ className, ref, ...rest }: MenuSeparatorProps) {
  return (
    <BaseMenu.Separator {...rest} ref={ref} className={classes('pn-MenuSeparator', className)} />
  )
}

export interface MenuSubmenuProps extends Inherited<
  BaseMenu.SubmenuTrigger.Props,
  'label' | 'disabled' | 'id'
> {
  /**
   * Required: the words of the row that opens the submenu, in sentence case, such as "Language".
   * They name the row and the submenu.
   */
  label: ReactNode
  /**
   * An icon before the label, in reading order. Hidden from screen readers: the label names the
   * row.
   */
  startIcon?: ReactNode
  /**
   * Whether the row ignores presses and hovers, so the submenu can't open. It stays focusable and
   * in the arrow-key order, announced as dimmed.
   * @default false
   */
  disabled?: boolean
  /** The submenu's items, in reading order, the same components a Menu takes. */
  children?: ReactNode
  /** The row's `id`. Base UI sets one itself when left out. */
  id?: string
  /** Reaches the root, the row. Merged after `pn-MenuSubmenu`. */
  className?: string
  /** Reaches the root, the row. */
  style?: CSSProperties
  /** Reaches the root, the row, the `role="menuitem"` element that opens the submenu. */
  ref?: Ref<HTMLDivElement>
  /** Props for each inner part, merged with the part's own, which win but where CR-9 says. */
  slotProps?: {
    /** Props for the submenu's `portal` part. */
    portal?: BaseMenu.Portal.Props
    /**
     * Props for the submenu's `positioner` part. Its `alignOffset` and `collisionPadding` replace
     * the submenu's own (CR-9).
     */
    positioner?: BaseMenu.Positioner.Props
    /** Props for the submenu's `popup` part, such as `aria-label`. */
    popup?: BaseMenu.Popup.Props
  }
}

/** A row in a `Menu` that opens a submenu, such as "Language", with the chevron at its end. */
export function MenuSubmenu({
  label,
  startIcon,
  disabled = false,
  children,
  className,
  ref,
  slotProps,
  ...rest
}: MenuSubmenuProps) {
  // CR-9: the first item level with the row, pulled up by the popup's padding and edge, and
  // size.panel-gap from the screen's edge
  const positioner = slotProps?.positioner
  const defaults = positionerOffsets()
  return (
    <BaseMenu.SubmenuRoot>
      <BaseMenu.SubmenuTrigger
        {...rest}
        ref={ref}
        disabled={disabled}
        className={classes('pn-MenuSubmenu', className)}
      >
        <RowContent row="MenuSubmenu" startIcon={startIcon}>
          {label}
        </RowContent>
        {/* icons/chevron-right.svg, inlined, unchanged but for width and height, in a holder that
            takes its size and colour */}
        <span className="pn-MenuSubmenu-chevron" aria-hidden="true">
          <svg
            className="perron-icon"
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 3.5 4.5 4.5L6 12.5" />
          </svg>
        </span>
      </BaseMenu.SubmenuTrigger>
      <BaseMenu.Portal
        {...slotProps?.portal}
        className={withClass('pn-MenuSubmenu-portal', slotProps?.portal?.className)}
      >
        <BaseMenu.Positioner
          // CR-9: the caller's props, then the submenu's defaults where it gives none
          {...mergeProps<typeof BaseMenu.Positioner>(positioner, {
            alignOffset: positioner?.alignOffset ?? menuOffsets()?.alignOffset,
            collisionPadding: positioner?.collisionPadding ?? defaults.collisionPadding,
          })}
          className={withClass('pn-MenuSubmenu-positioner', positioner?.className)}
        >
          <BaseMenu.Popup
            {...slotProps?.popup}
            className={withClass('pn-MenuSubmenu-popup', slotProps?.popup?.className)}
          >
            {children}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.SubmenuRoot>
  )
}
