// The copy button's two icons, drawn as docs/foundations/icons.md asks and as the site's own
// icons are: the 16 px grid, 1.6 px round strokes, currentColor, sized by .perron-icon and hidden
// from screen readers, since the button's label names it.
import type { SVGProps } from 'react'

const base: SVGProps<SVGSVGElement> = {
  className: 'perron-icon',
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
}

/** Copy: two sheets, one over the other. */
export function CopyIcon() {
  return (
    <svg {...base}>
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.6" />
      <path d="M10.5 5.5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5" />
    </svg>
  )
}

/** Copied: a tick. */
export function CopiedIcon() {
  return (
    <svg {...base}>
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  )
}
