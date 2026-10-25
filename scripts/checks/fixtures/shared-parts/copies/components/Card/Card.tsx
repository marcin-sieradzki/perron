// Copies two shared helpers under new names, one with its parameters renamed and its body in
// parentheses; declares one by an alias the table lists; and declares a function that only looks
// alike, with another body, which is not a copy.
const join = (own: string, theirs: string | undefined) => (theirs ? `${own} ${theirs}` : own)

/** What the ear hears. */
function spoken(node: Element): string {
  // a comment changes nothing
  const clone = node.cloneNode(true) as Element
  for (const h of clone.querySelectorAll('[aria-hidden="true"]')) h.remove()
  return clone.textContent!.replace(/\s+/g, ' ').trim()
}

const exposedText = (node: Node) => node.textContent ?? ''

const after = (own: string, caller: string | undefined) => (caller ? `${caller} ${own}` : own)

export function Card({ className }: { className?: string }) {
  return <div className={join('pn-Card', after('x', className))}>{spoken + exposedText.name}</div>
}
