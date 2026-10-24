// Ends in useRender(...), as most of Perron's components do: the docgen reads its props.
import { useRender } from '@base-ui/react/use-render'

export interface TagProps extends useRender.ComponentProps<'span'> {
  /** The tag's words. */
  label: string
}

export function Tag({ label, render, ...rest }: TagProps) {
  return useRender({ defaultTagName: 'span', render, props: { ...rest, children: label } })
}
