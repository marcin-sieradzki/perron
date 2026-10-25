// How the library writes a number, written once here (docs/components/README.md, "Shared helpers").
// Internal: no barrel exports it, and a pattern may import this file, which reads no Base UI.

/**
 * A count in digits grouped in threes from the right by a no-break space (U+00A0), the same in
 * every locale: "1 260", "412", "0". A fraction, if any, follows its point as it is.
 */
export function grouped(count: number) {
  const [whole, fraction] = String(count).split('.')
  const digits = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0')
  return fraction === undefined ? digits : `${digits}.${fraction}`
}
