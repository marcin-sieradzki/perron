// An overlay: it takes open and defaultOpen.
export interface PopupProps {
  /** Whether the popup is shown. */
  open?: boolean
  /** Whether the popup is shown at first. */
  defaultOpen?: boolean
}

export function Popup({ open, defaultOpen }: PopupProps) {
  return <div hidden={!(open ?? defaultOpen)} />
}
