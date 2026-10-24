// A pin with one prop, so its docgen finds it; its spec has no Props table to hold it to.
export interface PinProps {
  /** The pin's name. */
  label: string
}

export function Pin({ label }: PinProps) {
  return <span>{label}</span>
}
