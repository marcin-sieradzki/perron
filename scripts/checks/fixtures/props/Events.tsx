export interface EventsProps {
  /** The value changed */
  onChange?: (value: string) => void
  /** It opened */
  onOpen?: (open: boolean) => void
  /** It closed */
  onClose?: () => void
}
