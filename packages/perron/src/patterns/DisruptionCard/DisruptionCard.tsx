'use client'
// DisruptionCard: one disruption on Copenhagen's network as a raised card: its kind, the lines it
// touches, a short title and a plain sentence, then the stops it affects, its time and one action.
// A pattern: it composes Surface, SeverityLabel, LineBadge, Text and the VisuallyHidden part, and
// imports nothing from Base UI.
// Spec: docs/patterns/disruption-card.md.
import type { ComponentPropsWithRef, ReactNode } from 'react'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import { LineBadge } from '../../components/LineBadge/LineBadge.tsx'
import type { LineBadgeProps } from '../../components/LineBadge/LineBadge.tsx'
import { SeverityLabel } from '../../components/SeverityLabel/SeverityLabel.tsx'
import type {
  SeverityLabelProps,
  SeverityLabelSeverity,
} from '../../components/SeverityLabel/SeverityLabel.tsx'
import { Surface } from '../../components/Surface/Surface.tsx'
import type { SurfaceProps } from '../../components/Surface/Surface.tsx'
import { Text } from '../../components/Text/Text.tsx'
import type { TextProps } from '../../components/Text/Text.tsx'
import { VisuallyHidden } from '../../parts/VisuallyHidden/VisuallyHidden.tsx'
import { classes, given } from '../../internal/nodes.ts'
import { grouped } from '../../internal/numbers.ts'
import { interpolate } from '../../internal/strings.ts'
import './DisruptionCard.css'

/** One line a disruption touches: the line whose colours its badge takes, and its short name. */
export interface DisruptionCardLine {
  /** The line whose colours the badge takes, as LineBadge's `line` */
  line: LineBadgeProps['line']
  /** The line's short name as riders know it: "M2", "5C" */
  name: string
}

/** A stretch of line a disruption covers, by the stops at its two ends. */
export interface DisruptionCardStretch {
  /** The stop at the stretch's first end, as the message names it: "Hellerup" */
  from: string
  /** The stop at the stretch's other end: "Klampenborg" */
  to: string
}

/** When a disruption runs: its start, its end or both, each written as the caller formats it. */
export interface DisruptionCardTime {
  /** When it starts: "08:03", "24", "Saturday 06:00", or a `<time>` element */
  from?: ReactNode
  /** When it ends: "22:00", "25 October", or a `<time>` element */
  to?: ReactNode
}

export interface DisruptionCardProps extends Omit<SurfaceProps, 'variant' | 'children' | 'title'> {
  /**
   * The kind of disruption, shown by the SeverityLabel in the card's header: `delay` for vehicles
   * running late, `diversion` for a changed route, `planned` for planned works, `data` for a
   * problem with the real-time data feed, `notice` for a service notice whose message does not say
   * which of the others it is.
   */
  severity: SeverityLabelSeverity
  /**
   * The lines the disruption touches, in the order to show them, each as a LineBadge: `line` gives
   * its colours and `name` the short name riders know, "M2", "5C". Leave it out, or pass an empty
   * array, for a disruption across the network, such as a data feed problem.
   */
  lines?: ReadonlyArray<DisruptionCardLine>
  /**
   * What is happening, in a few words: "Signal fault at Kongens Nytorv". Required. Replaces the
   * HTML `title` attribute.
   */
  title: ReactNode
  /**
   * The sentence under the title: where, why and for how long, and how sure we are. "M2 and M3
   * trains between Kongens Nytorv and Christianshavn run slower than planned." Left out, or a value
   * that renders nothing (`null`, a boolean, `''` or an array of only such values), it renders no
   * `description`
   */
  children?: ReactNode
  /**
   * The stops the disruption affects, under the sentence: a list of stop names, in the order to
   * show them, "Affects Nørreport, Kongens Nytorv and 3 more", or a stretch by its two ends,
   * "Between Hellerup and Klampenborg". A list names three stops at most: past three it names the
   * first two and counts the rest. Leave it out, or pass an empty array, to show no stops.
   */
  stops?: ReadonlyArray<string> | DisruptionCardStretch
  /**
   * When the disruption runs, under the stops: `from` alone reads "From 08:03", `to` alone "Until
   * 22:00", and both "24 to 25 October", each value written as the caller formats it. Leave it
   * out, or give neither, to show no time.
   */
  time?: DisruptionCardTime
  /**
   * One link or button at the foot of the card, such as a LinkButton "Show on map". Leave it out
   * when the card is itself a link through `render`: links and buttons can't nest.
   */
  action?: ReactNode
  /**
   * Overrides "Affected lines", the words screen readers hear just before the list of line badges.
   *
   * @default The locale's
   */
  affectedLinesLabel?: string
  /**
   * Overrides "Affects {stops}", the words around the stops; `{stops}` is the names.
   *
   * @default The locale's
   */
  affectsStopsLabel?: string
  /**
   * Overrides "{stops} and {stop}", which joins the last stop name to those before it.
   *
   * @default The locale's
   */
  stopListEndLabel?: string
  /**
   * Overrides "{stops} and {count} more", the list cut short past three stops; `{count}` is how
   * many it leaves out, 2 or more.
   *
   * @default The locale's
   */
  moreStopsLabel?: string
  /**
   * Overrides "Between {from} and {to}", the words around a stretch's two ends.
   *
   * @default The locale's
   */
  betweenStopsLabel?: string
  /**
   * Overrides "From {time}", the time with a start and no end.
   *
   * @default The locale's
   */
  fromTimeLabel?: string
  /**
   * Overrides "Until {time}", the time with an end and no start.
   *
   * @default The locale's
   */
  untilTimeLabel?: string
  /**
   * Overrides "{from} to {to}", the time with a start and an end.
   *
   * @default The locale's
   */
  timeRangeLabel?: string
  /**
   * Props for each inner part, merged with the part's own, which win: the caller's class follows
   * the part's own
   */
  slotProps?: {
    /** Props for the `header` part */
    header?: ComponentPropsWithRef<'div'>
    /**
     * Props for the `severity` part, the SeverityLabel: its `delaysLabel`, `diversionsLabel`,
     * `plannedWorksLabel`, `dataFeedProblemsLabel` and `serviceNoticeLabel` override the kind's name
     */
    severity?: Omit<SeverityLabelProps, 'severity'>
    /** Props for the `lines` part, the list of line badges */
    lines?: ComponentPropsWithRef<'ul'>
    /** Props for the `title` part. Its `render` makes the title a heading: `render: <h3 />` */
    title?: Omit<TextProps, 'variant' | 'children'>
    /** Props for the `description` part */
    description?: Omit<TextProps, 'variant' | 'children'>
    /** Props for the `stops` part */
    stops?: Omit<TextProps, 'variant' | 'children'>
    /** Props for the `time` part */
    time?: Omit<TextProps, 'variant' | 'children'>
    /** Props for the `action` part, the block that holds `action` */
    action?: ComponentPropsWithRef<'div'>
  }
}

/** The elements the parts render as by default (CR-4, CR-5), made once. */
const LIST_ITEM = <li />
const PARAGRAPH = <p />
const BLOCK = <div />

/** The owned strings in the card's locale, as `useOwnedStrings` gives them. */
type OwnedStrings = ReturnType<typeof useOwnedStrings>

/** CR-12: a list names this many stops at most, and past it names the first two and counts the rest. */
const NAMED_STOPS = 3
const NAMED_BEFORE_MORE = 2

/** The names before the last, joined as every one of the four locales joins a list. */
const joined = (names: ReadonlyArray<string>) => names.join(', ')

/** CR-12: the stops as their owned words with the names filled in, or nothing for none. */
function stopsText(stops: DisruptionCardProps['stops'], strings: OwnedStrings): ReactNode {
  if (!stops) return null
  if ('from' in stops) return interpolate(strings.betweenStops, { from: stops.from, to: stops.to })
  if (!stops.length) return null
  const names =
    stops.length > NAMED_STOPS
      ? interpolate(strings.moreStops, {
          stops: joined(stops.slice(0, NAMED_BEFORE_MORE)),
          count: grouped(stops.length - NAMED_BEFORE_MORE),
        })
      : stops.length === 1
        ? stops[0]
        : interpolate(strings.stopListEnd, {
            stops: joined(stops.slice(0, -1)),
            stop: stops.at(-1),
          })
  return interpolate(strings.affectsStops, { stops: names })
}

/** CR-13: the time as its owned words with the caller's start and end filled in, or nothing. */
function timeText(time: DisruptionCardTime | undefined, strings: OwnedStrings): ReactNode {
  const from = given(time?.from)
  const to = given(time?.to)
  if (from && to) return interpolate(strings.timeRange, { from: time?.from, to: time?.to })
  if (from) return interpolate(strings.fromTime, { time: time?.from })
  if (to) return interpolate(strings.untilTime, { time: time?.to })
  return null
}

/**
 * One disruption on Copenhagen's network as a raised card: its kind, the lines it touches, a short
 * title and a plain sentence on what is happening, then the stops it affects, its time and one
 * action.
 */
export function DisruptionCard({
  severity,
  lines,
  title,
  children,
  stops,
  time,
  action,
  affectedLinesLabel,
  affectsStopsLabel,
  stopListEndLabel,
  moreStopsLabel,
  betweenStopsLabel,
  fromTimeLabel,
  untilTimeLabel,
  timeRangeLabel,
  slotProps,
  className,
  ...rest
}: DisruptionCardProps) {
  // CR-7: the owned strings, with this instance's labels laid over them
  const strings = useOwnedStrings({
    affectedLines: affectedLinesLabel,
    affectsStops: affectsStopsLabel,
    stopListEnd: stopListEndLabel,
    moreStops: moreStopsLabel,
    betweenStops: betweenStopsLabel,
    fromTime: fromTimeLabel,
    untilTime: untilTimeLabel,
    timeRange: timeRangeLabel,
  })
  const header = slotProps?.header
  const label = slotProps?.severity
  const list = slotProps?.lines
  const heading = slotProps?.title
  const description = slotProps?.description
  const stopsProps = slotProps?.stops
  const timeProps = slotProps?.time
  const actionProps = slotProps?.action
  const affected = stopsText(stops, strings)
  const when = timeText(time, strings)

  // CR-6: each part's slotProps first, its own props last, so they win; classes join by hand
  return (
    <Surface
      {...rest}
      variant="raised"
      className={classes('pn-DisruptionCard', className)}
      // CR-2: after the caller's, so a list can select on it; the CSS sets no colour from it
      data-severity={severity}
    >
      <div {...header} className={classes('pn-DisruptionCard-header', header?.className)}>
        <SeverityLabel
          {...label}
          className={classes('pn-DisruptionCard-severity', label?.className)}
          severity={severity}
        />
        {/* CR-4: no list for no lines, so no empty list is announced. The list has no name of its
            own: "Affected lines" is said just before it, so a card made a link keeps the badges'
            names in its own */}
        {lines?.length ? (
          <>
            <VisuallyHidden>{strings.affectedLines}</VisuallyHidden>
            <ul {...list} className={classes('pn-DisruptionCard-lines', list?.className)}>
              {lines.map((entry) => (
                <LineBadge
                  key={`${entry.line}-${entry.name}`}
                  className="pn-DisruptionCard-line"
                  render={LIST_ITEM}
                  line={entry.line}
                  size="medium"
                >
                  {entry.name}
                </LineBadge>
              ))}
            </ul>
          </>
        ) : null}
      </div>
      {/* CR-5: a <p> until slotProps.title.render swaps it for a heading */}
      <Text
        {...heading}
        render={heading?.render ?? PARAGRAPH}
        className={classes('pn-DisruptionCard-title', heading?.className)}
        variant="heading-sm"
      >
        {title}
      </Text>
      {given(children) ? (
        <Text
          {...description}
          render={description?.render ?? BLOCK}
          className={classes('pn-DisruptionCard-description', description?.className)}
          variant="body-sm"
          emphasis="secondary"
        >
          {children}
        </Text>
      ) : null}
      {/* CR-12, CR-13: where, then how long, each a line of its own and left out when not given */}
      {given(affected) ? (
        <Text
          {...stopsProps}
          render={stopsProps?.render ?? PARAGRAPH}
          className={classes('pn-DisruptionCard-stops', stopsProps?.className)}
          variant="caption"
          emphasis="secondary"
        >
          {affected}
        </Text>
      ) : null}
      {given(when) ? (
        <Text
          {...timeProps}
          render={timeProps?.render ?? PARAGRAPH}
          className={classes('pn-DisruptionCard-time', timeProps?.className)}
          variant="caption"
          emphasis="secondary"
        >
          {when}
        </Text>
      ) : null}
      {/* CR-14: one link or button, the caller's, at the foot */}
      {given(action) ? (
        <div
          {...actionProps}
          className={classes('pn-DisruptionCard-action', actionProps?.className)}
        >
          {action}
        </div>
      ) : null}
    </Surface>
  )
}
