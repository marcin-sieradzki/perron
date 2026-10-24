import type { useRender } from '@base-ui/react/use-render'

export interface RenderProps extends Omit<useRender.ComponentProps<'span'>, 'render'> {
  /**
   * Swaps the root element.
   * @default <span />
   */
  render?: useRender.ComponentProps<'span'>['render']
}
