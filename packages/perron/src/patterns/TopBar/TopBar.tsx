'use client'
// TopBar: the bar along the top of the moving map, on every screen size: the brand, the status line
// that says when the map's data is from, the screen's filters and its tools, on one glass panel. A
// pattern: Perron's Surface, Brand and Text over plain elements, never Base UI (CR-1); the filters
// and the tools are the caller's own elements. Spec: docs/patterns/top-bar.md.
import type { ComponentPropsWithRef, CSSProperties, ReactNode, Ref } from 'react'
import { Brand } from '../../components/Brand/Brand.tsx'
import type { BrandProps } from '../../components/Brand/Brand.tsx'
import { Surface } from '../../components/Surface/Surface.tsx'
import { Text } from '../../components/Text/Text.tsx'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import { classes, given } from '../../internal/nodes.ts'
import { interpolate } from '../../internal/strings.ts'
import './TopBar.css'

export interface TopBarProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /**
   * The bar's layout: `medium` is one row at least `size.top-bar` tall, for a wide screen; `small`
   * is the phone's, at least `size.top-bar-phone` tall, with the status line under the brand and
   * the filters on a second row of their own that scrolls sideways. The screen picks `small` under
   * `breakpoint.phone`.
   * @default 'medium'
   */
  size?: 'medium' | 'small'
  /**
   * Where the brand leads, such as the start screen, `'/en'`. Given, the brand is a link there;
   * left out, it is the brand alone.
   */
  brandHref?: string
  /**
   * The time of the data the map shows, 24-hour `HH:MM:SS`, such as `'08:14:05'`, or `HH:MM`, in
   * Copenhagen's time, shown as "Updated 08:14:05" as it is given, and given again when the data
   * changes; the bar never counts up from it. Left out, before any data has come, the line reads
   * "Updated —".
   */
  time?: string
  /**
   * The map takes no updates for now: the status line starts with "Paused", and the time stays the
   * time of the data the map shows.
   * @default false
   */
  paused?: boolean
  /**
   * The app judges the data may be out of date, such as when its last refresh failed or the time
   * is past the app's limit: the line reads "Updated 08:09:40, may be out of date", in warning ink.
   * The bar never judges it from the time.
   * @default false
   */
  outOfDate?: boolean
  /**
   * The screen's filters, in the order they show: a FilterChip for each, with its count, its state
   * and its handler kept by the caller. Left out, the bar has no filters group.
   */
  filters?: ReactNode
  /**
   * The screen's tools at the end of the bar, in the order they show, such as the language link, a
   * small outline LinkButton, and the About button, a large IconButton. Left out, the bar has no
   * tools group.
   */
  tools?: ReactNode
  /**
   * Overrides "Updated {time}", the status line's phrase; `{time}` is filled with `time`, or "—"
   * when it is left out
   * @default The locale's
   */
  updatedLabel?: string
  /**
   * Overrides "Updated {time}, may be out of date", the phrase while `outOfDate` is set; `{time}`
   * is filled as `updatedLabel`'s is
   * @default The locale's
   */
  updatedOutOfDateLabel?: string
  /**
   * Overrides "Paused", the word that starts the status line while `paused` is set
   * @default The locale's
   */
  sourcePausedLabel?: string
  /**
   * Overrides "Filters", the filters group's name, heard as the group is entered, such as "Modes"
   * where every filter is a mode
   * @default The locale's
   */
  filtersLabel?: string
  /**
   * Overrides "Mylder", the brand name; given to the Brand
   * @default The locale's
   */
  brandNameLabel?: string
  /** Joined after `pn-TopBar` on the root, such as the screen's class that places the bar */
  className?: string
  /** Reaches the root */
  style?: CSSProperties
  /** Reaches the root element */
  ref?: Ref<HTMLDivElement>
  /** Props for each inner part, merged with the part's own, which win: the caller's class follows the part's own */
  slotProps?: {
    /** Props for the `identity` part, the brand and the status line */
    identity?: ComponentPropsWithRef<'div'>
    /**
     * Props for the `brand` part, the Brand: its `variant`, `'mark'` where the bar is tight, and a
     * `className`
     */
    brand?: Omit<BrandProps, 'brandNameLabel' | 'render'>
    /** Props for the `status` part, the status line */
    status?: Omit<ComponentPropsWithRef<'span'>, 'children' | 'color'>
    /** Props for the `paused` part, the word "Paused" */
    paused?: ComponentPropsWithRef<'span'>
    /** Props for the `separator` part, the "·" after "Paused" */
    separator?: ComponentPropsWithRef<'span'>
    /** Props for the `time` part, the phrase that gives the time */
    time?: ComponentPropsWithRef<'time'>
    /** Props for the `filters` part, the group of filters */
    filters?: ComponentPropsWithRef<'fieldset'>
    /** Props for the `tools` part, the group of tools */
    tools?: ComponentPropsWithRef<'div'>
  }
}

/** U+2014, the dash content design writes for unknown, filling `{time}` while no time is given (CR-4). */
const UNKNOWN_TIME = '—'

/** U+00A0, before the "·", so a wrapped line never starts with one (CR-4). */
const NO_BREAK_SPACE = ' '

/**
 * The bar along the top of the moving map: the Mylder brand, the status line that says when the
 * map's data is from, the screen's filters and its tools, on one glass panel over the map.
 */
export function TopBar({
  size = 'medium',
  brandHref,
  time,
  paused = false,
  outOfDate = false,
  filters,
  tools,
  updatedLabel,
  updatedOutOfDateLabel,
  sourcePausedLabel,
  filtersLabel,
  brandNameLabel,
  slotProps,
  className,
  ...rest
}: TopBarProps) {
  // CR-8: the bar's words, with this instance's overrides laid over them
  const strings = useOwnedStrings({
    updated: updatedLabel,
    updatedOutOfDate: updatedOutOfDateLabel,
    sourcePaused: sourcePausedLabel,
    filters: filtersLabel,
  })
  const {
    identity: identityProps,
    brand: brandProps,
    status: statusProps,
    paused: pausedProps,
    separator: separatorProps,
    time: timeProps,
    filters: filtersProps,
    tools: toolsProps,
  } = slotProps ?? {}

  // CR-12: each part's slot props first, then its own, so its own win; the class joins after its own
  const identity = (
    <div {...identityProps} className={classes('pn-TopBar-identity', identityProps?.className)}>
      {/* CR-5: 'full' by default, under slotProps.brand, so its variant wins; a link with brandHref */}
      <Brand
        variant="full"
        {...brandProps}
        className={classes('pn-TopBar-brand', brandProps?.className)}
        brandNameLabel={brandNameLabel}
        render={brandHref === undefined ? undefined : <a href={brandHref} />}
      />
      {/* CR-4: "Paused" and a separator while paused, then the time in its one owned phrase */}
      <Text
        {...statusProps}
        variant="data-sm"
        emphasis="secondary"
        className={classes('pn-TopBar-status', statusProps?.className)}
      >
        {paused && (
          <>
            <span {...pausedProps} className={classes('pn-TopBar-paused', pausedProps?.className)}>
              {strings.sourcePaused}
            </span>
            {NO_BREAK_SPACE}
            <span
              {...separatorProps}
              className={classes('pn-TopBar-separator', separatorProps?.className)}
            >
              ·
            </span>{' '}
          </>
        )}
        {/* CR-4, CR-6: the caller's time as it is, or "—", in one text run; no timer, no clock */}
        <time
          {...timeProps}
          className={classes('pn-TopBar-time', timeProps?.className)}
          dateTime={time}
        >
          {interpolate(outOfDate ? strings.updatedOutOfDate : strings.updated, {
            time: time ?? UNKNOWN_TIME,
          })}
        </time>
      </Text>
    </div>
  )

  // CR-7: a group only when the caller gives it something to hold, the caller's elements as they are
  const filtersGroup = given(filters) && (
    <fieldset
      key="filters"
      {...filtersProps}
      className={classes('pn-TopBar-filters', filtersProps?.className)}
      aria-label={strings.filters}
    >
      {filters}
    </fieldset>
  )
  const toolsGroup = given(tools) && (
    <div key="tools" {...toolsProps} className={classes('pn-TopBar-tools', toolsProps?.className)}>
      {tools}
    </div>
  )

  return (
    // CR-2, CR-11: Surface's glass, never set here; the rest props and the caller's ref reach its
    // div, then the bar's own size, states and class, "pn-Surface pn-TopBar <caller's>"
    <Surface
      {...rest}
      variant="glass"
      data-size={size}
      data-paused={paused ? '' : undefined}
      data-out-of-date={outOfDate ? '' : undefined}
      className={classes('pn-TopBar', className)}
    >
      {/* CR-3: the order on screen is the DOM order, the tools before the filters on a phone; keyed,
          so a bar that changes size moves its groups and keeps the caller's elements mounted */}
      {identity}
      {size === 'small' ? [toolsGroup, filtersGroup] : [filtersGroup, toolsGroup]}
    </Surface>
  )
}
