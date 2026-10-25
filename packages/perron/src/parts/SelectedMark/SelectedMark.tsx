// The SelectedMark shared part: the tick beside a chosen option. A component renders it through its
// Base UI indicator's `render` (`Menu.RadioItemIndicator`, later `Select.ItemIndicator` and
// `Combobox.ItemIndicator`), which passes the indicator's class, ref and state attributes in as
// props. Internal: composed by components, never registered or exported. Its class and the tick
// icon live only in this folder and CheckboxIndicator's (docs/components/README.md, "Shared parts").
import type { ComponentProps } from 'react'
import { classes } from '../../internal/nodes.ts'
import './SelectedMark.css'

export type SelectedMarkProps = Omit<ComponentProps<'span'>, 'children'>

/** The `tick` icon at `icon.size.325`, in the colour of the row that holds it. */
export function SelectedMark({ className, ...rest }: SelectedMarkProps) {
  return (
    <span {...rest} className={classes('pn-SelectedMark', className)}>
      {/* icons/tick.svg, inlined, unchanged but for width and height */}
      <svg
        className="perron-icon"
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m3.2 7.3 2.6 2.6 5-5.6" />
      </svg>
    </span>
  )
}
