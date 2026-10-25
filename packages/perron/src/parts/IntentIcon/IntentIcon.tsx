// The IntentIcon shared part: the icon of a status intent, drawn once for every message that shows
// one, Alert's and Toast's, and for SeverityLabel's service notice. Each drawing is its file in
// packages/perron/icons/, inlined unchanged but for width and height. The part sets no colour and
// no size: it draws in currentColor at the --perron-icon-size the element around it sets. Internal:
// composed by components, never registered or exported. Its class and the info-circle and
// exclamation-circle icons live only in this folder (docs/components/README.md, "Shared parts").
import { cloneElement } from 'react'
import type { ReactElement } from 'react'
import { classes } from '../../internal/nodes.ts'

/** The intents a message takes; `neutral` has no icon. */
export type IntentIconColor = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

export interface IntentIconProps {
  /** The intent whose icon to draw: nothing for `neutral`. */
  color: IntentIconColor
  /**
   * A class joined after the part's own, for the component that places the icon, such as
   * SeverityLabel's `pn-SeverityLabel-icon`
   */
  className?: string
}

const SVG = {
  className: 'perron-icon pn-IntentIcon',
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 14 14',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.6',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: 'false',
} as const

const ICONS: Record<Exclude<IntentIconColor, 'neutral'>, ReactElement<{ className?: string }>> = {
  // icons/check-circle.svg
  success: (
    <svg {...SVG}>
      <circle cx="7" cy="7" r="5.6" />
      <path d="M4.4 7.2l1.8 1.8 3.4-3.6" />
    </svg>
  ),
  // icons/warning.svg
  warning: (
    <svg {...SVG}>
      <path d="M7 1.8 12.8 12H1.2Z" />
      <path d="M7 5.6v3" />
      <circle cx="7" cy="10.2" r=".3" fill="currentColor" />
    </svg>
  ),
  // icons/exclamation-circle.svg
  danger: (
    <svg {...SVG}>
      <circle cx="7" cy="7" r="5.6" />
      <path d="M7 4v3.4" />
      <circle cx="7" cy="9.9" r=".9" fill="currentColor" stroke="none" />
    </svg>
  ),
  // icons/info-circle.svg
  info: (
    <svg {...SVG}>
      <circle cx="7" cy="7" r="5.6" />
      <path d="M7 6.6v3.4" />
      <circle cx="7" cy="4.1" r=".9" fill="currentColor" stroke="none" />
    </svg>
  ),
}

/** The intent's icon, hidden from screen readers, or nothing for `neutral`. */
export function IntentIcon({ color, className }: IntentIconProps) {
  if (color === 'neutral') return null
  const icon = ICONS[color]
  return className ? cloneElement(icon, { className: classes(SVG.className, className) }) : icon
}
