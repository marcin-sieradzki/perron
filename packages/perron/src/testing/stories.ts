// Helpers the stories share, written once here (docs/components/README.md, "Shared helpers").
import type { CSSProperties, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, screen, waitFor } from 'storybook/test'

/**
 * The style of one typography role with its `-tracking` twin, for a story's own text, with no
 * margin, so a `<p>` or a heading sits where the layout puts it.
 */
export const typography = (role: string): CSSProperties => ({
  font: `var(--perron-typography-${role})`,
  letterSpacing: `var(--perron-typography-${role}-tracking)`,
  margin: 0,
})

/**
 * What a screen reader reads of `element`: its text outside `aria-hidden`, its white space
 * collapsed. For a part with no role and no name of its own, where the accessibility tree adds
 * nothing to its text.
 */
export function heard(element: Element) {
  const copy = element.cloneNode(true) as Element
  for (const hidden of copy.querySelectorAll('[aria-hidden="true"]')) hidden.remove()
  return copy.textContent!.replace(/\s+/g, ' ').trim()
}

/**
 * A colour custom property, such as `--perron-color-text-secondary`, as it renders: the computed
 * `color` of a probe that reads it, to compare with an element's computed colour.
 */
export function colour(property: string) {
  const probe = document.createElement('span')
  probe.style.color = `var(${property})`
  document.body.append(probe)
  const rendered = getComputedStyle(probe).color
  probe.remove()
  return rendered
}

/**
 * Renders `ui` apart from the story, into a host appended to `parent`, runs `test` on the host,
 * and unmounts and removes the host after, whether `test` passes or throws.
 */
export async function mounted<T>(
  parent: HTMLElement,
  ui: ReactNode,
  test: (host: HTMLElement) => Promise<T>,
): Promise<T> {
  const host = document.createElement('div')
  parent.append(host)
  const root = createRoot(host)
  root.render(ui)
  try {
    return await test(host)
  } finally {
    root.unmount()
    host.remove()
  }
}

/** Resolves once no dialog is open. */
export const closed = () => waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

/** The element with `data-testid` `id`, once it has rendered. */
export const byTestId = (id: string) =>
  waitFor(() => {
    const found = document.querySelector(`[data-testid="${id}"]`)
    expect(found).not.toBeNull()
    return found as HTMLElement
  })
