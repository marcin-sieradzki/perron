// Tabs: a row of tabs that switches between views of one thing, one panel showing at a time, on
// Base UI's Tabs. Its list, tab and panel live here too: Base UI's parts read the root's context,
// so they can't be built or shown apart (docs/components/tabs.md, Anatomy). Base UI gives the
// keys, the roving focus, the fallback and the ARIA; nothing here adds a key handler (CR-1).
import { mergeProps } from '@base-ui/react/merge-props'
import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import type { CSSProperties, ReactNode, Ref } from 'react'
import './Tabs.css'

/** `pn-<Name>` first, then the caller's class. */
const classes = (own: string, given: string | undefined) => (given ? `${own} ${given}` : own)

/**
 * What each of the four inherits from its Base UI part: every prop but `own`, the ones it declares
 * itself, and React's `className`, `style`, `children` and `ref`, which it declares as React's.
 */
type Inherited<P, own extends keyof P = never> = Omit<
  P,
  own | 'className' | 'style' | 'children' | 'ref'
>

export interface TabsProps extends Inherited<
  BaseTabs.Root.Props,
  'value' | 'defaultValue' | 'onValueChange' | 'orientation' | 'onChange'
> {
  /** The selected tab's `value`, when the caller controls it. `null` selects no tab. */
  value?: string | null
  /**
   * The tab selected at first, when Tabs keeps the value itself. Left out, the first enabled tab
   * is selected, and `onChange` reports it with `details.reason` `'initial'`.
   * @default The first enabled tab
   */
  defaultValue?: string | null
  /**
   * Called when the selected tab changes: by a click, Enter or Space, or an arrow key with
   * `activateOnFocus` on (`details.reason` `'none'`); and by Tabs itself, at mount when
   * `defaultValue` is left out (`'initial'`), or when the selected tab is disabled or removed
   * (`'disabled'`, `'missing'`). `event` is `details.event`.
   */
  onChange?: (event: Event, value: string | null, details: BaseTabs.Root.ChangeEventDetails) => void
  /** One `TabsList` and a `TabsPanel` for each of its tabs. */
  children?: ReactNode
  /** Reaches the root. Merged after `pn-Tabs`. */
  className?: string
  /** Reaches the root. */
  style?: CSSProperties
  /** Reaches the root, the `<div>` that holds the list and the panels. */
  ref?: Ref<HTMLDivElement>
}

/**
 * A row of tabs that switches between views of one thing, one panel showing at a time. Holds one
 * `TabsList` of `Tab`s and a `TabsPanel` for each.
 */
export function Tabs({ value, defaultValue, onChange, className, ref, ...rest }: TabsProps) {
  return (
    <BaseTabs.Root
      {...rest}
      // only when given, so Base UI's first-enabled fallback runs when it is left out (CR-4)
      {...(defaultValue !== undefined && { defaultValue })}
      ref={ref}
      value={value}
      onValueChange={
        onChange &&
        ((next: string | null, details: BaseTabs.Root.ChangeEventDetails) =>
          onChange(details.event, next, details))
      }
      className={classes('pn-Tabs', className)}
    />
  )
}

export interface TabsListProps extends Inherited<BaseTabs.List.Props> {
  /** The list's `Tab`s, in reading order. */
  children?: ReactNode
  /** Reaches the root. Merged after `pn-TabsList`. */
  className?: string
  /** Reaches the root. */
  style?: CSSProperties
  /** Reaches the root, the `role="tablist"` element. */
  ref?: Ref<HTMLDivElement>
  /** Props for each inner part, merged with the part's own, which win. */
  slotProps?: {
    /** Props for the `indicator` part, the underline under the selected tab. */
    indicator?: BaseTabs.Indicator.Props
  }
}

/**
 * The row of tabs in a `Tabs`, on a hairline, with the underline under the selected tab. Name it
 * with `aria-label` or `aria-labelledby`.
 */
export function TabsList({ children, className, slotProps, ref, ...rest }: TabsListProps) {
  const { className: given, ...indicator } = slotProps?.indicator ?? {}
  return (
    <BaseTabs.List {...rest} ref={ref} className={classes('pn-TabsList', className)}>
      {children}
      {/* The caller's props, then the component's own, which win, merged by mergeProps (CR-5).
          The class is resolved first, out of the slot, since mergeProps joins only string classes
          and a slotProps className may be Base UI's function of the indicator's state. Typed by
          the Indicator part, not 'span', as its `style` may be such a function too. */}
      <BaseTabs.Indicator
        {...mergeProps<typeof BaseTabs.Indicator>(indicator, {
          className: (state: BaseTabs.Indicator.State) =>
            classes('pn-TabsList-indicator', typeof given === 'function' ? given(state) : given),
        })}
      />
    </BaseTabs.List>
  )
}

export interface TabProps extends Inherited<BaseTabs.Tab.Props, 'value' | 'disabled'> {
  /** Required. The value that selects this tab, the same as its `TabsPanel`'s. */
  value: string
  /**
   * Whether the tab can't be selected. It stays focusable and in the arrow-key order, and is
   * announced as dimmed.
   * @default false
   */
  disabled?: boolean
  /**
   * A number after the label, in a pill, such as how many disruptions the panel lists. Heard after
   * the label: "Disruptions 2". Shown for `0` too.
   */
  count?: number
  /** The label: the words that name the view, in sentence case, such as "Departures". */
  children?: ReactNode
  /** Reaches the root. Merged after `pn-Tab`. */
  className?: string
  /** Reaches the root. */
  style?: CSSProperties
  /** Reaches the root, the `role="tab"` `<button>`. */
  ref?: Ref<HTMLButtonElement>
}

/** One tab in a `TabsList`: a native button that selects the `TabsPanel` of the same `value`. */
export function Tab({
  value,
  disabled = false,
  count,
  children,
  className,
  ref,
  ...rest
}: TabProps) {
  return (
    <BaseTabs.Tab
      {...rest}
      ref={ref}
      value={value}
      disabled={disabled}
      className={classes('pn-Tab', className)}
    >
      <span className="pn-Tab-label">{children}</span>
      {/* The count, 0 included, after a space in the markup, so the tab's name reads
          "Disruptions 2", where the CSS gap alone would leave "Disruptions2" (CR-12). */}
      {typeof count === 'number' ? (
        <>
          {' '}
          <span className="pn-Tab-count" data-disabled={disabled ? '' : undefined}>
            {count}
          </span>
        </>
      ) : null}
    </BaseTabs.Tab>
  )
}

export interface TabsPanelProps extends Inherited<BaseTabs.Panel.Props, 'value'> {
  /** Required. The value of the tab that shows this panel. */
  value: string
  /** The view the tab names. */
  children?: ReactNode
  /** Reaches the root. Merged after `pn-TabsPanel`. */
  className?: string
  /** Reaches the root. */
  style?: CSSProperties
  /** Reaches the root, the `role="tabpanel"` element. */
  ref?: Ref<HTMLDivElement>
}

/** The view one `Tab` shows, in a `Tabs`: shown while the tab of the same `value` is selected. */
export function TabsPanel({ value, className, ref, ...rest }: TabsPanelProps) {
  return (
    <BaseTabs.Panel
      {...rest}
      ref={ref}
      value={value}
      className={classes('pn-TabsPanel', className)}
    />
  )
}
