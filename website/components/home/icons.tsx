// The one icon the home page needs that the package doesn't have, drawn as docs/foundations/icons.md
// asks: the 16 px grid, 1.6 px round strokes, currentColor, sized by .perron-icon and hidden from
// screen readers (it sits in a labelled button).

/** Copy: one sheet over another. */
export function CopyIcon() {
  return (
    <svg
      className="perron-icon"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
    >
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.6" />
      <path d="M10.5 5.5V4.1c0-.9-.7-1.6-1.6-1.6H4.1c-.9 0-1.6.7-1.6 1.6v4.8c0 .9.7 1.6 1.6 1.6h1.4" />
    </svg>
  )
}
