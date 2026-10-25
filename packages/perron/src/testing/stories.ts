// Helpers the stories share, written once here (docs/components/README.md, "Shared helpers").
import type { CSSProperties } from 'react'

/**
 * The style of one typography role with its `-tracking` twin, for a story's own text, with no
 * margin, so a `<p>` or a heading sits where the layout puts it.
 */
export const typography = (role: string): CSSProperties => ({
  font: `var(--perron-typography-${role})`,
  letterSpacing: `var(--perron-typography-${role}-tracking)`,
  margin: 0,
})
