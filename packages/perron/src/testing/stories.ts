// Helpers the stories share, written once here (docs/components/README.md, "Shared helpers").
import type { CSSProperties, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'

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

/** The value a token renders as here, read from a probe that sets it on `property`. */
export function rendered(token: string, property = 'color') {
  const probe = document.createElement('div')
  probe.style.setProperty(property, `var(--perron-${token})`)
  document.body.append(probe)
  const value = getComputedStyle(probe).getPropertyValue(property)
  probe.remove()
  return value
}

/**
 * What the `(hover: hover)` rules set `property` to when `element` is hovered, as written. A
 * synthetic pointer doesn't reach `:hover`, so this reads the rule the real pointer would apply.
 */
export function onHover(element: Element, property: string) {
  let value = ''
  for (const sheet of Array.from(document.styleSheets))
    for (const rule of Array.from(sheet.cssRules))
      if (rule instanceof CSSMediaRule && rule.conditionText.includes('hover: hover'))
        for (const inner of Array.from(rule.cssRules))
          if (
            inner instanceof CSSStyleRule &&
            inner.selectorText.includes(':hover') &&
            element.matches(inner.selectorText.replaceAll(':hover', ''))
          )
            value = inner.style.getPropertyValue(property) || value
  return value
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
