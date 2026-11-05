// A made-up Flag's type tests: DD-1 is cited in JSX, DD-2 only by a bare directive and from Pin's
// folder, DD-3 is a review rule, and DD-9 is no rule.
import { Flag } from './Flag.tsx'

export const loud = (
  <div>
    {/* @ts-expect-error DD-1: Flag has no loud tone */}
    <Flag tone="loud" />
  </div>
)

// @ts-expect-error: the size huge is not one of Flag's
export const huge = <Flag size="huge" />

// @ts-expect-error DD-3: a long label still type-checks
export const long = <Flag>A label far longer than any flag should carry</Flag>

// @ts-expect-error DD-9: no such rule
export const none = <Flag tone="none" />
