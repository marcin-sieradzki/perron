// Inherits `render` from Base UI without declaring it again, as the contract asks; its spec gives
// `label` and the `slotProps` key a row, but `render` none, and a row for a `tone` it has no member for.
import { useRender } from '@base-ui/react/use-render'

export interface NoteProps extends useRender.ComponentProps<'div'> {
  /** The note's words. */
  label: string
  /** Props for each inner part. */
  slotProps?: { icon?: useRender.ComponentProps<'span'> }
}

export function Note({ label, render, slotProps, ...rest }: NoteProps) {
  return useRender({ defaultTagName: 'div', render, props: { ...rest, children: label } })
}
