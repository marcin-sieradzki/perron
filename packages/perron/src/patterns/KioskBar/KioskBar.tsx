// KioskBar: the bar a Mylder screen in kiosk mode shows over the map, read from across a room and
// never touched: the brand, a few key figures about the network, and the clock, large. A pattern:
// Perron's Surface, Brand and Stat over plain elements, never Base UI (CR-1).
// Spec: docs/patterns/kiosk-bar.md.
import type { ComponentPropsWithRef, CSSProperties, ReactNode, Ref } from 'react'
import { Brand } from '../../components/Brand/Brand.tsx'
import type { BrandProps } from '../../components/Brand/Brand.tsx'
import { Stat } from '../../components/Stat/Stat.tsx'
import type { StatProps } from '../../components/Stat/Stat.tsx'
import { Surface } from '../../components/Surface/Surface.tsx'
import './KioskBar.css'

/** One key figure, as KioskBar's `stats` takes it. */
export interface KioskBarStat {
  /** What the figure counts, in a few words, as Stat's `label`: "Reporting live", "Average delay". */
  label: ReactNode
  /**
   * Optional. The figure, written as content design writes numbers, as Stat's `children`: "412",
   * "4 min", "≈ 30". Left out, Stat shows "—" and says "Unknown".
   */
  figure?: ReactNode
}

export interface KioskBarProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /**
   * The time the clock shows, 24-hour `HH:MM`, such as `'08:14'`, in Copenhagen's time. Required.
   * The caller updates it each minute; KioskBar keeps no clock of its own.
   */
  time: string
  /**
   * The key figures, in the order they show: each one's label and figure. Left out or empty, the
   * bar shows the brand and the clock alone.
   */
  stats?: KioskBarStat[]
  /**
   * Overrides "Mylder", the brand name; given to the Brand
   * @default The locale's
   */
  brandNameLabel?: string
  /**
   * Overrides "Unknown", heard in place of "—" for a figure with no data; given to every Stat
   * @default The locale's
   */
  unknownLabel?: string
  /** Joined after `pn-KioskBar` on the root */
  className?: string
  /** Reaches the root */
  style?: CSSProperties
  /** Reaches the root element */
  ref?: Ref<HTMLDivElement>
  /** Props for each inner part, merged with the part's own, which win: the caller's class follows the part's own */
  slotProps?: {
    /**
     * Props for the `brand` part, the Brand: its `variant`, `'mark'` where the bar is tight, and a
     * `className`
     */
    brand?: Omit<BrandProps, 'brandNameLabel'>
    /** Props for the `stats` part, the list */
    stats?: ComponentPropsWithRef<'ul'>
    /** Props for every `stat` part, each Stat: a `className`, or its own `slotProps` */
    stat?: Omit<StatProps, 'label' | 'children' | 'unknownLabel' | 'render'>
    /** Props for the `time` part, the clock */
    time?: ComponentPropsWithRef<'time'>
  }
}

/**
 * The part's own class first, then the caller's: joined, not replaced. A pattern cannot import
 * Base UI's `mergeProps`, so the merge is written here (CR-7).
 */
const classes = (own: string, caller: string | undefined) => (caller ? `${own} ${caller}` : own)

/**
 * The bar a kiosk display shows over the map: the Mylder brand, a few key figures about the
 * network, and the clock, large, for a screen read from across a room and never touched.
 */
export function KioskBar({
  time,
  stats = [],
  brandNameLabel,
  unknownLabel,
  slotProps,
  className,
  ...rest
}: KioskBarProps) {
  const { brand: brandProps, stats: statsProps, stat: statProps, time: timeProps } = slotProps ?? {}

  return (
    // CR-2: Surface's glass, never set here; the rest props and the caller's ref reach its div,
    // and the class joins as "pn-Surface pn-KioskBar <caller's>"
    <Surface {...rest} variant="glass" className={classes('pn-KioskBar', className)}>
      {/* CR-3: brand, then the figures, then the clock, in the DOM and on screen */}
      {/* CR-6: 'full' by default, under slotProps.brand, so its variant wins */}
      <Brand
        variant="full"
        {...brandProps}
        className={classes('pn-KioskBar-brand', brandProps?.className)}
        brandNameLabel={brandNameLabel}
      />
      {/* CR-4: no empty list is announced */}
      {stats.length > 0 && (
        <ul {...statsProps} className={classes('pn-KioskBar-stats', statsProps?.className)}>
          {stats.map((entry, index) => (
            <Stat
              // the figures have no id of their own, and their order is the caller's
              key={index}
              {...statProps}
              className={classes('pn-KioskBar-stat', statProps?.className)}
              render={<li />}
              label={entry.label}
              unknownLabel={unknownLabel}
            >
              {entry.figure}
            </Stat>
          ))}
        </ul>
      )}
      {/* CR-5: the caller's HH:MM as it is, with no timer, clock or formatting of its own */}
      <time
        {...timeProps}
        className={classes('pn-KioskBar-time', timeProps?.className)}
        dateTime={time}
      >
        {time}
      </time>
    </Surface>
  )
}
