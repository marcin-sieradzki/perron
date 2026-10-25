// The CheckboxIndicator shared part: a checkbox's box, with its tick or its dash. A component renders
// it through its Base UI indicator's `render` (`Checkbox.Indicator`, later
// `Menu.CheckboxItemIndicator`), which passes the indicator's class, ref and state attributes in as
// props; the part's CSS reads its states from those attributes, so it takes no state props but
// `mark`. Internal: composed by components, never registered or exported. Its class and the tick
// and dash icons live only in this folder (docs/components/README.md, "Shared parts").
import type { ComponentProps } from 'react'
import { classes } from '../../internal/nodes.ts'
import './CheckboxIndicator.css'

export interface CheckboxIndicatorProps extends Omit<ComponentProps<'span'>, 'children'> {
  /** The mark inside the box: `tick` while ticked, `dash` while indeterminate, none while unticked. */
  mark?: 'tick' | 'dash'
}

/** A `size.checkbox` box, empty, ticked or dashed, drawn in the colours of the state Base UI marks it with. */
export function CheckboxIndicator({ mark, className, ...rest }: CheckboxIndicatorProps) {
  return (
    <span {...rest} className={classes('pn-CheckboxIndicator', className)}>
      {/* icons/tick.svg and icons/dash.svg, inlined, unchanged but for width and height (CR-5) */}
      {mark === 'tick' && (
        <svg
          className="perron-icon pn-CheckboxIndicator-mark"
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
      )}
      {mark === 'dash' && (
        <svg
          className="perron-icon pn-CheckboxIndicator-mark"
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3.5 7h7" />
        </svg>
      )}
    </span>
  )
}
