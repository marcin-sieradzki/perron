// DisruptionCard: one disruption on Copenhagen's network as a raised card: its kind, the lines it
// touches, a short title and a plain sentence. A pattern: it composes Surface, SeverityLabel,
// LineBadge and Text, and imports nothing from Base UI. Spec: docs/patterns/disruption-card.md.
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
import './DisruptionCard.css'

/** One line a disruption touches: the line whose colours its badge takes, and its short name. */
export interface DisruptionCardLine {
  /** The line whose colours the badge takes, as LineBadge's `line` */
  line: LineBadgeProps['line']
  /** The line's short name as riders know it: "M2", "5C" */
  name: string
}

export interface DisruptionCardProps extends Omit<SurfaceProps, 'variant' | 'children' | 'title'> {
  /**
   * The kind of disruption, shown by the SeverityLabel in the card's header: `delay` for vehicles
   * running late, `diversion` for a changed route, `planned` for planned works, `data` for a
   * problem with the real-time data feed.
   */
  severity: SeverityLabelSeverity
  /**
   * The lines the disruption touches, in the order to show them, each as a LineBadge: `line` gives
   * its colours and `name` the short name riders know, "M2", "5C". Leave it out, or pass an empty
   * array, for a disruption across the network, such as a data feed problem.
   */
  lines?: readonly DisruptionCardLine[]
  /**
   * What is happening, in a few words: "Signal fault at Kongens Nytorv". Required. Replaces the
   * HTML `title` attribute.
   */
  title: ReactNode
  /**
   * The sentence under the title: where, why and for how long, and how sure we are. "M2 and M3
   * trains between Kongens Nytorv and Christianshavn run slower than planned."
   */
  children?: ReactNode
  /**
   * Overrides "Affected lines", the name screen readers hear for the list of line badges.
   *
   * @default The locale's
   */
  affectedLinesLabel?: string
  /**
   * Props for each inner part, merged with the part's own, which win: the caller's class follows
   * the part's own
   */
  slotProps?: {
    /** Props for the `header` part */
    header?: ComponentPropsWithRef<'div'>
    /**
     * Props for the `severity` part, the SeverityLabel: its `delaysLabel`, `diversionsLabel`,
     * `plannedWorksLabel` and `dataFeedProblemsLabel` override the kind's name
     */
    severity?: Omit<SeverityLabelProps, 'severity'>
    /** Props for the `lines` part, the list of line badges */
    lines?: ComponentPropsWithRef<'ul'>
    /** Props for the `title` part. Its `render` makes the title a heading: `render: <h3 />` */
    title?: Omit<TextProps, 'variant' | 'children'>
    /** Props for the `description` part */
    description?: Omit<TextProps, 'variant' | 'children'>
  }
}

/** The elements the parts render as by default (CR-4, CR-5), made once. */
const LIST_ITEM = <li />
const PARAGRAPH = <p />
const BLOCK = <div />

/** `pn-DisruptionCard-<part>`, then the caller's class (CR-6). */
const classes = (own: string, caller: string | undefined) => (caller ? `${own} ${caller}` : own)

/**
 * A node that renders something. `null`, `undefined`, a boolean, `''` and an array of only such
 * values render nothing, so the description is left out (CR-5).
 */
const given = (node: ReactNode): boolean =>
  Array.isArray(node) ? node.some(given) : node != null && typeof node !== 'boolean' && node !== ''

/**
 * One disruption on Copenhagen's network as a raised card: its kind, the lines it touches, a short
 * title and a plain sentence on what is happening.
 */
export function DisruptionCard({
  severity,
  lines,
  title,
  children,
  affectedLinesLabel,
  slotProps,
  className,
  ...rest
}: DisruptionCardProps) {
  // CR-7: the one owned string, with this instance's label laid over it
  const strings = useOwnedStrings({ affectedLines: affectedLinesLabel })
  const header = slotProps?.header
  const label = slotProps?.severity
  const list = slotProps?.lines
  const heading = slotProps?.title
  const description = slotProps?.description

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
        {/* CR-4: no list for no lines, so no empty list is announced */}
        {lines?.length ? (
          <ul
            {...list}
            className={classes('pn-DisruptionCard-lines', list?.className)}
            aria-label={strings.affectedLines}
          >
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
    </Surface>
  )
}
