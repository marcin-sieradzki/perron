'use client'
// SourceLine: one caption line naming where a panel's data comes from and the time of that data,
// each source with its own time and, in the app's words, what that time is of, and the paused and
// may-be-out-of-date states. A pattern: Perron's Text over plain elements, never Base UI (CR-14).
// Spec: docs/patterns/source-line.md.
import { Fragment } from 'react'
import type { ComponentPropsWithRef, CSSProperties, Ref } from 'react'
import { Text } from '../../components/Text/Text.tsx'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import { classes, given } from '../../internal/nodes.ts'
import { interpolate } from '../../internal/strings.ts'
import './SourceLine.css'

/** One source of a panel's data, as SourceLine's `sources` takes it. */
export interface SourceLineSource {
  /**
   * Optional. The source's name, as its terms ask it to be named, such as `'Rejseplanen'`. Left
   * out, the source shows its phrase alone: for a second source of the same provider, which reads
   * as the named one's before it, or for one whose `label` names the data itself, such as
   * "Timetable and positions {time}"
   */
  name?: string
  /**
   * Optional. The time of the data the panel shows from this source, 24-hour `HH:MM:SS`, such as
   * `'08:14:05'`, or `HH:MM`, in Copenhagen's time, or a date where the data is of a day, such as
   * `'12 October'`. Shown as it is given, and given again when the data changes; the line never
   * counts up from it (CR-3). Left out only for a `label` with no `{time}`, such as "times from the
   * timetable"; a phrase with `{time}` and no time fills it with "—"
   */
  time?: string
  /**
   * Optional. What this source's time is of, in the app's own words, as a template whose `{time}`
   * is filled with `time`, such as `'position {time}'`, `'timetable of {time}'`, or `'times from
   * the timetable'` with no time. Overrides "updated {time}" and `sourceUpdatedLabel` for this
   * source; when `outOfDate` is set the line adds "may be out of date" after it (CR-15)
   */
  label?: string
  /**
   * Optional. The machine-readable form of `time`, for the `<time>` element's `dateTime`, when
   * `time` is not one, such as `'2026-10-12'` for `'12 October'`. Left out, `time` as it is given
   */
  dateTime?: string
  /**
   * Optional, `false` when left out. The app judges this source's data may be out of date, such as
   * when its last refresh failed or its time is past the app's limit; the line says "updated
   * 08:09:40, may be out of date" for it, or its `label` then "may be out of date", and never
   * judges it from the time (CR-6)
   */
  outOfDate?: boolean
}

export interface SourceLineProps extends Omit<ComponentPropsWithRef<'p'>, 'children' | 'color'> {
  /**
   * Where the panel's data comes from, one source or two, each with its own name and the time of
   * its data, and what that time is of when the app words it, in the order the line shows them.
   * Required. Each source keeps its own time: the line never joins two into one "last updated"
   * (CR-4).
   */
  sources: readonly [SourceLineSource] | readonly [SourceLineSource, SourceLineSource]
  /**
   * The panel takes no updates for now: the line starts with "Paused", and each time stays the time
   * of the data the panel shows (CR-5).
   * @default false
   */
  paused?: boolean
  /**
   * Overrides "updated {time}", the phrase that gives each source's time; `{time}` is filled with
   * the source's `time`
   * @default The locale's
   */
  sourceUpdatedLabel?: string
  /**
   * Overrides "Paused", the word that starts a paused line
   * @default The locale's
   */
  sourcePausedLabel?: string
  /**
   * Overrides "updated {time}, may be out of date", the phrase that gives the time of a source
   * whose `outOfDate` is set; `{time}` is filled with the source's `time`
   * @default The locale's
   */
  sourceOutOfDateLabel?: string
  /**
   * Overrides "{label}, may be out of date", the phrase that gives the time of a source with its
   * own `label` whose `outOfDate` is set; `{label}` is filled with that label, its `{time}` filled
   * with the source's `time`
   * @default The locale's
   */
  sourceLabelOutOfDateLabel?: string
  /** Joined after `pn-Text pn-SourceLine` on the root */
  className?: string
  /** Reaches the root */
  style?: CSSProperties
  /** Reaches the root element */
  ref?: Ref<HTMLParagraphElement>
  /** Props for each inner part, merged with the part's own, which win: the caller's class follows the part's own. Each key reaches every copy of its part */
  slotProps?: {
    /** Props for the `paused` part, the word "Paused" */
    paused?: ComponentPropsWithRef<'span'>
    /** Props for every `source` part, each source */
    source?: ComponentPropsWithRef<'span'>
    /** Props for every `name` part, each source's name */
    name?: ComponentPropsWithRef<'span'>
    /** Props for every `separator` part, each "·" */
    separator?: ComponentPropsWithRef<'span'>
    /** Props for every `time` part, each source's phrase and time */
    time?: ComponentPropsWithRef<'time'>
  }
}

/** U+00B7, the mark between a source's name and its time, after "Paused", and between sources. */
const SEPARATOR = '·'

/** U+00A0, before each "·", so a wrapped line never starts with one (CR-1). */
const NO_BREAK_SPACE = '\u00A0'

/** U+2014, the dash content design writes for unknown, filling `{time}` while no time is given. */
const UNKNOWN_TIME = '\u2014'

/** The line's owned phrases, as `useOwnedStrings` gives them with the overrides laid over them. */
type Phrases = Record<'sourceUpdated' | 'sourceOutOfDate' | 'sourceLabelOutOfDate', string>

/**
 * A source's phrase, with its time in it: its own `label`, or the owned "updated {time}", and each
 * one's out-of-date form when the app judges it so (CR-2, CR-6, CR-15). Every piece is filled by
 * `interpolate`, never joined in code, so the phrase stays one text run.
 */
function phraseOf(source: SourceLineSource, strings: Phrases) {
  const time = given(source.time) ? source.time : UNKNOWN_TIME
  if (!given(source.label))
    return interpolate(source.outOfDate ? strings.sourceOutOfDate : strings.sourceUpdated, { time })
  const label = interpolate(source.label!, { time })
  return source.outOfDate ? interpolate(strings.sourceLabelOutOfDate, { label }) : label
}

/**
 * One caption line that names where a panel's data comes from and the time of that data, each
 * source with its own time: "Rejseplanen · updated 08:14:05", or in the app's own words of what
 * each time is of, "Rejseplanen · position 08:14:05 · times 08:14:20". Put one on every panel that
 * shows a source's data.
 */
export function SourceLine({
  sources,
  paused = false,
  sourceUpdatedLabel,
  sourcePausedLabel,
  sourceOutOfDateLabel,
  sourceLabelOutOfDateLabel,
  slotProps,
  className,
  ref,
  ...rest
}: SourceLineProps) {
  // CR-7: the line's word and three phrases, with this instance's overrides laid over them
  const strings = useOwnedStrings({
    sourceUpdated: sourceUpdatedLabel,
    sourcePaused: sourcePausedLabel,
    sourceOutOfDate: sourceOutOfDateLabel,
    sourceLabelOutOfDate: sourceLabelOutOfDateLabel,
  })
  const {
    paused: pausedProps,
    source: sourceProps,
    name: nameProps,
    separator: separatorProps,
    time: timeProps,
  } = slotProps ?? {}

  // CR-1: a "·" with a no-break space before it and a space after it, so the line wraps after a
  // "·" and never starts a line with one
  const separator = (
    <>
      {NO_BREAK_SPACE}
      <span
        {...separatorProps}
        className={classes('pn-SourceLine-separator', separatorProps?.className)}
      >
        {SEPARATOR}
      </span>{' '}
    </>
  )

  return (
    // CR-10: the rest props first, then the root's own role, colour, element, ref, state and
    // class, so its own win; Text joins its pn-Text first, so the class reads
    // "pn-Text pn-SourceLine <caller's>"
    <Text
      {...rest}
      variant="caption"
      emphasis="secondary"
      render={<p />}
      ref={ref}
      data-paused={paused ? '' : undefined}
      className={classes('pn-SourceLine', className)}
    >
      {/* CR-5: "Paused" starts a paused line, then a separator */}
      {paused && (
        <>
          <span
            {...pausedProps}
            className={classes('pn-SourceLine-paused', pausedProps?.className)}
          >
            {strings.sourcePaused}
          </span>
          {separator}
        </>
      )}
      {/* CR-1, CR-4: each source in the caller's order, each with its own name, phrase and time,
          never joined under one "updated" */}
      {sources.map((source, index) => (
        // the sources have no id of their own, and their order is the caller's
        <Fragment key={index}>
          {index > 0 && separator}
          {/* CR-2, CR-11: the slot's props, then the source's own class and state over them */}
          <span
            {...sourceProps}
            className={classes('pn-SourceLine-source', sourceProps?.className)}
            data-out-of-date={source.outOfDate ? '' : undefined}
          >
            {/* CR-2: the name and a separator, when the source has a name */}
            {given(source.name) && (
              <>
                <span
                  {...nameProps}
                  className={classes('pn-SourceLine-name', nameProps?.className)}
                >
                  {source.name}
                </span>
                {separator}
              </>
            )}
            {/* CR-2, CR-3, CR-6, CR-15: the time in one phrase, filled by interpolate, never an owned
                word joined to the caller's time; the caller's time as it is, with no timer, clock
                or formatting of its own */}
            <time
              {...timeProps}
              className={classes('pn-SourceLine-time', timeProps?.className)}
              dateTime={source.dateTime || source.time || undefined}
            >
              {phraseOf(source, strings)}
            </time>
          </span>
        </Fragment>
      ))}
    </Text>
  )
}
