// An overlay: it takes open and defaultOpen. Its onOpen names Details, a type kept to this file.
type Details = { reason: string }

export interface PopupProps {
  /** Whether the popup is shown. */
  open?: boolean
  /** Whether the popup is shown at first. */
  defaultOpen?: boolean
  /** Called when the popup asks to open. */
  onOpen?: (details: Details) => void
}

export function Popup({ open, defaultOpen }: PopupProps) {
  return <div hidden={!(open ?? defaultOpen)} />
}
