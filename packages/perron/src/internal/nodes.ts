// Helpers the components and patterns share, written once here (docs/components/README.md, "Shared
// helpers"). Internal: no barrel exports them, and a pattern may import this file, which reads no
// Base UI.
import type { ReactNode } from 'react'

/**
 * Whether a node renders something. `null`, `undefined`, a boolean, `''` and an array of only such
 * values render nothing, so a part given one is left out.
 */
export const given = (node: ReactNode): boolean =>
  Array.isArray(node) ? node.some(given) : node != null && typeof node !== 'boolean' && node !== ''

/**
 * Whether a value says something: what `given` says renders nothing, and a number that is not
 * finite, say nothing; `0` and `'0'` are values. A value that says nothing shows `UnknownValue`.
 */
export const known = (node: ReactNode): boolean =>
  Array.isArray(node)
    ? node.some(known)
    : given(node) && (typeof node !== 'number' || Number.isFinite(node))

/** A part's own class first, then the caller's: joined, never replaced. */
export const classes = (own: string, caller: string | undefined) =>
  caller ? `${own} ${caller}` : own

/** Base UI's `className`, as a part takes it: a string, or a function of the part's state. */
export type ClassName<State> = string | ((state: State) => string | undefined) | undefined

/**
 * A part's own class first, then the caller's, whether the caller's is a string or Base UI's
 * function of the part's state, which it calls first. `mergeProps` joins strings only, and a
 * pattern can't import it, so a part's class is set after the merge with this.
 */
export function withClass<State>(own: string, theirs: ClassName<State>): ClassName<State> {
  if (typeof theirs === 'function') return (state) => classes(own, theirs(state))
  return classes(own, theirs)
}
