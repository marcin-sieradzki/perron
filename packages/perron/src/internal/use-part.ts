// The one inner part of a component, rendered from its `slotProps` value (docs/components/README.md,
// "Shared helpers"). Internal, and for components: it reads Base UI, which a pattern never imports.
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'

/** The elements a part renders as by default. They all take HTMLElement's props. */
export type PartTag = 'div' | 'span' | 'p' | 'h2' | 'h3' | 'dt' | 'dd' | 'li'

/**
 * One inner part: its `slotProps` value merged with the part's own props, its own last, so its
 * class, data attributes, `id` and children stay while the caller's `className` joins and its
 * `render` swaps the element. An element given as `render` has its own props merged over all of
 * these by Base UI. With `enabled` false it renders nothing.
 */
export function usePart<Tag extends PartTag>(
  defaultTagName: Tag,
  slot: useRender.ComponentProps<Tag> | undefined,
  own: useRender.ElementProps<'div'> & { 'data-unknown'?: string },
  enabled = true,
) {
  const { render, ...props } = slot ?? {}
  // every PartTag takes HTMLElement's props, so one merge serves them all
  return useRender({
    defaultTagName,
    render,
    enabled,
    props: mergeProps<'div'>(props as useRender.ElementProps<'div'>, own),
  })
}
