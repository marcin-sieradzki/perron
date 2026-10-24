interface UnexportedProps {
  /** Not exported */
  label?: string
}

export const Unexported = (props: UnexportedProps) => props.label
