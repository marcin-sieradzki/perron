// How the library fills an owned string's placeholders, written once here (docs/components/README.md,
// "Shared helpers"). Internal: no barrel exports it, and a pattern may import this file, which reads
// no Base UI.
import { Fragment, createElement } from 'react'
import type { ReactNode } from 'react'

/** A `{name}` placeholder in an owned string, its name captured. */
const PLACEHOLDER = /\{(\w+)\}/

/**
 * An owned string with each `{name}` placeholder replaced by the value of that name, so each locale
 * puts the caller's words where its own grammar needs them: `interpolate('From {time}', { time:
 * '08:03' })` is "From 08:03". With every value a string or a number it returns a string; with an
 * element among them, an array of the template's words and the values, in order. A placeholder with
 * no value renders nothing.
 */
export function interpolate(
  template: string,
  values: Readonly<Record<string, ReactNode>>,
): ReactNode {
  // split with a capture group alternates the template's words (even) and placeholder names (odd)
  const parts = template
    .split(PLACEHOLDER)
    .map((part, index) => (index % 2 ? (values[part] ?? null) : part))
  if (parts.every((part) => typeof part === 'string' || typeof part === 'number' || part === null))
    return parts.join('')
  return parts.map((part, index) =>
    index % 2 ? createElement(Fragment, { key: index }, part) : part,
  )
}
