// Copies a shared helper inline, as the callback of a map, which is a copy all the same.
export const spokenAll = (nodes: Element[]) =>
  nodes.map((node) => {
    const clone = node.cloneNode(true) as Element
    for (const h of clone.querySelectorAll('[aria-hidden="true"]')) h.remove()
    return clone.textContent!.replace(/\s+/g, ' ').trim()
  })
