'use client'
// SourceLine: one caption line naming where a panel's data comes from and the time of that data,
// each source with its own time, and the paused and may-be-out-of-date states. A pattern: Perron's
// Text over plain elements, never Base UI (CR-14). Spec: docs/patterns/source-line.md.
import { Fragment } from 'react'
import type { ComponentPropsWithRef, CSSProperties, Ref } from 'react'
import { Text } from '../../components/Text/Text.tsx'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import { classes } from '../../internal/nodes.ts'
import './SourceLine.css'

/** One source of a panel's data, as SourceLine's `sources` takes it. */
export interface SourceLineSource {
  /** Required. The source's name, as its terms ask it to be named, such as `'Rejseplanen'` */
  name: string
  /**
   * Required. The time of the data the panel shows from this source, 24-hour `HH:MM:SS`, such as
   * `'08:14:05'`, or `HH:MM`, in Copenhagen's time. Shown as it is given, and given again when the
   * data changes; the line never counts up from it (CR-3)
   */
  time: string
  /**
   * Optional, `false` when left out. The app judges this source's data may be out of date, such as
   * when its last refresh failed or its time is past the app's limit; the line adds "may be out of
   * date" after its time, and never judges it from the time (CR-6)
   */
  outOfDate?: boolean
}

export interface SourceLineProps extends Omit<ComponentPropsWithRef<'p'>, 'children' | 'color'> {
  /**
   * Where the panel's data comes from, one source or two, each with its own name and the time of
   * its data, in the order the line shows them. Required. Each source keeps its own time: the line
   * never joins two into one "last updated" (CR-4).
   */
  sources: readonly [SourceLineSource] | readonly [SourceLineSource, SourceLineSource]
  /**
   * The panel takes no updates for now: the line starts with "Paused", and each time stays the time
   * of the data the panel shows (CR-5).
   * @default false
   */
  paused?: boolean
  /**
   * Overrides "updated", the word before each source's time
   * @default The locale's
   */
  updatedLabel?: string
  /**
   * Overrides "Paused", the word that starts a paused line
   * @default The locale's
   */
  pausedLabel?: string
  /**
   * Overrides "may be out of date", the words after the time of a source whose `outOfDate` is set
   * @default The locale's
   */
  mayBeOutOfDateLabel?: string
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
    /** Props for every `updated` part, each "updated" */
    updated?: ComponentPropsWithRef<'span'>
    /** Props for every `time` part, each source's time */
    time?: ComponentPropsWithRef<'time'>
    /** Props for every `outOfDate` part, each "may be out of date" */
    outOfDate?: ComponentPropsWithRef<'span'>
  }
}

/** U+00B7, the mark between a source's name and "updated", after "Paused", and between sources. */
const SEPARATOR = '·'

/**
 * One caption line that names where a panel's data comes from and the time of that data, each
 * source with its own time: "Rejseplanen · updated 08:14:05". Put one on every panel that shows a
 * source's data.
 */
export function SourceLine({
  sources,
  paused = false,
  updatedLabel,
  pausedLabel,
  mayBeOutOfDateLabel,
  slotProps,
  className,
  ref,
  ...rest
}: SourceLineProps) {
  // CR-7: the line's three words, with this instance's overrides laid over them
  const strings = useOwnedStrings({
    updated: updatedLabel,
    paused: pausedLabel,
    mayBeOutOfDate: mayBeOutOfDateLabel,
  })
  const {
    paused: pausedProps,
    source: sourceProps,
    name: nameProps,
    separator: separatorProps,
    updated: updatedProps,
    time: timeProps,
    outOfDate: outOfDateProps,
  } = slotProps ?? {}

  // CR-1: a "·" with a space on each side outside it, so the line wraps at those spaces
  const separator = (
    <>
      {' '}
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
            {strings.paused}
          </span>
          {separator}
        </>
      )}
      {/* CR-1, CR-4: each source in the caller's order, each with its own name, word and time,
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
            <span {...nameProps} className={classes('pn-SourceLine-name', nameProps?.className)}>
              {source.name}
            </span>
            {separator}
            <span
              {...updatedProps}
              className={classes('pn-SourceLine-updated', updatedProps?.className)}
            >
              {strings.updated}
            </span>{' '}
            {/* CR-3: the caller's time as it is, with no timer, clock or formatting of its own */}
            <time
              {...timeProps}
              className={classes('pn-SourceLine-time', timeProps?.className)}
              dateTime={source.time}
            >
              {source.time}
            </time>
            {/* CR-6: the app's judgement, after its own source's time and a comma */}
            {source.outOfDate && (
              <>
                {', '}
                <span
                  {...outOfDateProps}
                  className={classes('pn-SourceLine-outOfDate', outOfDateProps?.className)}
                >
                  {strings.mayBeOutOfDate}
                </span>
              </>
            )}
          </span>
        </Fragment>
      ))}
    </Text>
  )
}
