// Helpers the components and patterns share, written once here (docs/components/README.md, "Shared
// helpers"). Internal: no barrel exports them, and a pattern may import this file, which reads no
// Base UI.
import type { ReactNode, Ref, RefCallback } from 'react'

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

/**
 * Base UI's `className`: a string, or a function of the part's state. `mergeProps` joins strings
 * only, so a part whose caller may give a function sets its class after the merge, by `withClass`.
 */
export type ClassName<State> = string | ((state: State) => string | undefined) | undefined

/** The part's own class first, then the caller's, whether the caller's is a string or a function. */
export function withClass<State>(own: string, theirs: ClassName<State>): ClassName<State> {
  if (typeof theirs === 'function') return (state) => classes(own, theirs(state))
  return classes(own, theirs)
}

/**
 * Points a ref, a callback or an object, at `node`, and returns what undoes it when the node goes:
 * the callback's own cleanup where it returns one (React 19), else setting the ref to `null`.
 */
export function setRef<T>(ref: Ref<T> | undefined, node: T | null): () => void {
  if (typeof ref === 'function') {
    const cleanup = ref(node)
    return typeof cleanup === 'function' ? cleanup : () => ref(null)
  }
  if (ref) {
    ref.current = node
    return () => {
      ref.current = null
    }
  }
  return () => {}
}

/**
 * One callback ref that sets every ref in `refs` by `setRef` and undoes them all on detach, for a
 * part whose own ref joins the caller's, since `mergeProps` merges no refs.
 */
export function joinRefs<T>(...refs: ReadonlyArray<Ref<T> | undefined>): RefCallback<T> {
  return (node) => {
    const unsets = refs.map((ref) => setRef(ref, node))
    return () => {
      for (const unset of unsets) unset()
    }
  }
}
