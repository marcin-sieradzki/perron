// The Chevron shared part: the `chevron-down` icon at the end of a control that opens something
// under it, Select's box and Accordion's trigger. It is the file in packages/perron/icons/,
// inlined unchanged but for width, height and xmlns. The part sets no colour, size or turn: it draws in
// currentColor at the --perron-icon-size the element around it sets, and that element, such as
// `Select.Icon` or Accordion's chevron span, turns it if it turns. Internal: composed by
// components, never registered or exported. Its class and the chevron-down icon live only in this
// folder (docs/components/README.md, "Shared parts").

/** The `chevron-down` icon, pointing down, hidden from screen readers. */
export function Chevron() {
  return (
    // icons/chevron-down.svg
    <svg
      className="perron-icon pn-Chevron"
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m4 6 4 4 4-4" />
    </svg>
  )
}
