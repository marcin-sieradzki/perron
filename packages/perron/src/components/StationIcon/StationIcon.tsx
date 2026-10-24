// StationIcon: a round marker that stands for a stop beside its name, in the colour of the line
// that serves it. Decorative, so always hidden from assistive technology (docs/components/station-icon.md).
import type { ComponentPropsWithRef, CSSProperties, Ref } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import './StationIcon.css'

export interface StationIconProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /**
   * `outlined` is a ring around the surface colour, for any stop; `filled` is a solid dot in the
   * line's colour, for the one stop that matters most, such as the vehicle's next stop.
   */
  variant?: 'outlined' | 'filled'
  /**
   * The line or mode whose colour the marker takes: a metro or S-tog line by its id, or `bus` or
   * `regional` for every line of that mode. Left out, the marker is neutral, for a station several
   * lines serve. Named and typed exactly as LineBadge's line prop: whichever of the two is built
   * second takes the other's name and type.
   */
  line?: 'm1' | 'm2' | 'm3' | 'm4' | 'a' | 'b' | 'c' | 'e' | 'f' | 'h' | 'bus' | 'regional'
  /**
   * The marker's diameter: `small` beside caption and label text, as on a stop timeline; `medium`
   * inside controls and rows; `large` beside a panel title. The three sizes are the three icon
   * sizes, so the marker matches an icon beside the same text.
   */
  size?: 'small' | 'medium' | 'large'
  /** Swaps the root `<span>` for another element, keeping its class, data attributes and `aria-hidden` */
  render?: useRender.RenderProp
  /** Merged after `pn-StationIcon` on the root */
  className?: string
  /** Reaches the root */
  style?: CSSProperties
  /** Reaches the root */
  ref?: Ref<HTMLSpanElement>
}

/** A stop's marker beside its name, in its line's colour. Decorative: name the stop and the line in words beside it. */
export function StationIcon({
  variant = 'outlined',
  line,
  size = 'medium',
  render,
  ref,
  ...rest
}: StationIconProps) {
  // with no line, data-line stays off and the neutral colour applies (CR-2)
  const own = {
    className: 'pn-StationIcon',
    'aria-hidden': true,
    'data-variant': variant,
    'data-size': size,
    'data-line': line,
  }
  return useRender({
    defaultTagName: 'span',
    render,
    ref,
    // the caller's props first, so the class, data attributes and aria-hidden are Perron's (CR-3)
    props: mergeProps<'span'>(rest, own),
  })
}
