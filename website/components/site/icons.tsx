// Icons only the site's own controls need, drawn as docs/foundations/icons.md asks: the 16 px grid,
// 1.6 px round strokes, currentColor, sized by .perron-icon and hidden from screen readers (each
// sits in a labelled control). The package's icons come from PackageIcon, never from here.
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

/** The dark theme. */
export function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M13.2 9.6A5.6 5.6 0 0 1 6.4 2.8a5.6 5.6 0 1 0 6.8 6.8Z" />
    </svg>
  )
}

/** The light theme. */
export function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="8" cy="8" r="2.8" />
      <path d="M8 1.6v1.2M8 13.2v1.2M1.6 8h1.2M13.2 8h1.2M3.5 3.5l.85.85M11.65 11.65l.85.85M3.5 12.5l.85-.85M11.65 4.35l.85-.85" />
    </svg>
  )
}

/** The phone menu. */
export function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3 5h10M3 8h10M3 11h10" />
    </svg>
  )
}
