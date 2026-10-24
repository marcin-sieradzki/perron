import type { ChangeEventHandler } from 'react'

/** A text field passes React's own change event. */
export interface NativeTextProps {
  /** Called on every keystroke */
  onChange?: ChangeEventHandler<HTMLInputElement>
}
