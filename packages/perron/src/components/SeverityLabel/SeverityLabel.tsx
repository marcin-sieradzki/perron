// SeverityLabel: the kind of a disruption on a line, as its icon and its name in its colour, such
// as a warning triangle and "Delays". Spec: docs/components/severity-label.md.
import type { ReactElement, Ref } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import type { OwnedStringKey } from '../../locale/index.ts'
import './SeverityLabel.css'

/** The kinds of disruption, named as the `color.transit.severity.*` tokens. */
export type SeverityLabelSeverity = 'delay' | 'data' | 'diversion' | 'planned'

/** What SeverityLabel's root writes as data attributes: `data-severity`. */
export interface SeverityLabelState extends Record<string, unknown> {
  severity: SeverityLabelSeverity
}

export interface SeverityLabelProps extends Omit<
  useRender.ComponentProps<'span', SeverityLabelState>,
  'children' | 'ref'
> {
  /**
   * The kind of disruption: `delay` for vehicles running late, `diversion` for a changed route,
   * `planned` for planned works, `data` for a problem with the real-time data feed.
   */
  severity: SeverityLabelSeverity
  /**
   * Overrides "Delays", the name shown for `severity='delay'`.
   *
   * @default The locale's
   */
  delaysLabel?: string
  /**
   * Overrides "Diversions", the name shown for `severity='diversion'`.
   *
   * @default The locale's
   */
  diversionsLabel?: string
  /**
   * Overrides "Planned works", the name shown for `severity='planned'`.
   *
   * @default The locale's
   */
  plannedWorksLabel?: string
  /**
   * Overrides "Data feed problems", the name shown for `severity='data'`.
   *
   * @default The locale's
   */
  dataFeedProblemsLabel?: string
  /** Reaches the root element. */
  ref?: Ref<HTMLSpanElement>
}

const ICON = {
  className: 'perron-icon pn-SeverityLabel-icon',
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 14 14',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: 'false',
} as const

// CR-3: each icon is its file in packages/perron/icons/, inlined unchanged but for width and height.
// CR-1: one icon, one word per kind.
const KINDS: Record<SeverityLabelSeverity, { icon: ReactElement; word: OwnedStringKey }> = {
  // icons/warning.svg
  delay: {
    word: 'delays',
    icon: (
      <svg {...ICON} strokeWidth="1.6">
        <path d="M7 1.8 12.8 12H1.2Z" />
        <path d="M7 5.6v3" />
        <circle cx="7" cy="10.2" r=".3" fill="currentColor" />
      </svg>
    ),
  },
  // icons/diversion.svg
  diversion: {
    word: 'diversions',
    icon: (
      <svg {...ICON} strokeWidth="1.6">
        <path d="M2 12V7.5a3 3 0 0 1 3-3h6.5" />
        <path d="M9.2 2.2 11.5 4.5 9.2 6.8" />
      </svg>
    ),
  },
  // icons/calendar.svg
  planned: {
    word: 'plannedWorks',
    icon: (
      <svg {...ICON} strokeWidth="1.5">
        <rect x="1.8" y="2.8" width="10.4" height="9.4" rx="1.4" />
        <path d="M1.8 6h10.4M4.8 1.6v2.2M9.2 1.6v2.2" />
      </svg>
    ),
  },
  // icons/signal-off.svg
  data: {
    word: 'dataFeedProblems',
    icon: (
      <svg {...ICON} strokeWidth="1.6">
        <path d="M2 5.2a7.2 7.2 0 0 1 10 0M4 7.6a4.4 4.4 0 0 1 6 0" />
        <circle cx="7" cy="10.6" r="1" fill="currentColor" stroke="none" />
        <path d="M1.8 1.8l10.4 10.4" />
      </svg>
    ),
  },
}

/**
 * The kind of a disruption on a line, as its icon and its name in its colour, heading a disruption
 * card or a row in a list of disruptions.
 */
export function SeverityLabel({
  severity,
  render,
  ref,
  delaysLabel,
  diversionsLabel,
  plannedWorksLabel,
  dataFeedProblemsLabel,
  ...rest
}: SeverityLabelProps) {
  // CR-5: the owned strings, with this instance's *Label props laid over them
  const strings = useOwnedStrings({
    delays: delaysLabel,
    diversions: diversionsLabel,
    plannedWorks: plannedWorksLabel,
    dataFeedProblems: dataFeedProblemsLabel,
  })
  const { icon, word } = KINDS[severity]
  // CR-2: useRender writes data-severity from the state, and passes the state to a render function.
  // CR-6: SeverityLabel's own props win over the caller's, data-severity among them, since
  // useRender lets props overwrite the attributes it writes from the state.
  const own = {
    className: 'pn-SeverityLabel',
    'data-severity': severity,
    children: (
      <>
        {icon}
        <span className="pn-SeverityLabel-label">{strings[word]}</span>
      </>
    ),
  }
  return useRender({
    defaultTagName: 'span',
    render,
    ref,
    state: { severity },
    props: mergeProps<'span'>(rest, own),
  })
}
