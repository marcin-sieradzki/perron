// The helpers' own file declares them.
export const classes = (own: string, caller: string | undefined) =>
  caller ? `${own} ${caller}` : own

export function heard(element: Element) {
  const copy = element.cloneNode(true) as Element
  for (const hidden of copy.querySelectorAll('[aria-hidden="true"]')) hidden.remove()
  return copy.textContent!.replace(/\s+/g, ' ').trim()
}
