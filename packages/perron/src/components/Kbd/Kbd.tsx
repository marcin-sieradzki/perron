// Kbd: one key of the keyboard, such as "Esc", "+" or "←", inside help text (docs/components/kbd.md).
// No Base UI component: a native <kbd> rendered through useRender, so the contract's render prop
// works, with no role, ARIA or data attribute of its own (CR-1) and no behaviour (CR-2).
import type { ReactNode } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import './Kbd.css'

export interface KbdProps extends Omit<useRender.ComponentProps<'kbd'>, 'children'> {
  /**
   * One key, as the keyboard prints it or the platform names it: "Esc", "Enter", "+", "−", "←".
   * Required: a key with no name says nothing. A combination is one Kbd per key (CR-5).
   */
  children: ReactNode
}

/** Kbd's own props: its class, and nothing else (CR-1). */
const OWN = { className: 'pn-Kbd' }

/** Shows one key of the keyboard, such as Esc, + or ←, inside help text. */
export function Kbd({ render, ref, ...rest }: KbdProps) {
  return useRender({
    defaultTagName: 'kbd',
    render,
    ref,
    // the caller's props first; mergeProps puts the rightmost class first, so pn-Kbd leads the
    // caller's (CR-1)
    props: mergeProps<'kbd'>(rest, OWN),
  })
}
