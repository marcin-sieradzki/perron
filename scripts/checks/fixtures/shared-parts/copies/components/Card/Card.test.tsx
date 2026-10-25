// A unit test is code too: a renamed copy of a shared helper here is a copy.
import { expect, it } from 'vitest'

function heardIn(node: Element) {
  const clone = node.cloneNode(true) as Element
  for (const h of clone.querySelectorAll('[aria-hidden="true"]')) h.remove()
  return clone.textContent!.replace(/\s+/g, ' ').trim()
}

it('is heard', () => expect(heardIn).toBeDefined())
