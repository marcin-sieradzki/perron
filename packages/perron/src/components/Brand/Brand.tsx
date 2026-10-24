// Brand: the Mylder mark beside the wordmark "mylder", drawn inline so its colours come from the
// tokens and follow the theme. Spec: docs/components/brand.md.
import type { CSSProperties, Ref } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { VisuallyHidden } from '../../parts/VisuallyHidden/VisuallyHidden.tsx'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import './Brand.css'

export interface BrandProps extends Omit<useRender.ComponentProps<'span'>, 'children' | 'ref'> {
  /**
   * `full` sets the mark beside the wordmark, as the brand appears by default; `mark` shows the
   * mark alone, for where space is tight, with the brand name read to screen readers.
   * @default 'full'
   */
  variant?: 'full' | 'mark'
  /**
   * Overrides "Mylder"
   * @default The locale's
   */
  brandNameLabel?: string
  /** Merged after `pn-Brand` on the root */
  className?: string
  /** Reaches the root */
  style?: CSSProperties
  /** Reaches the root */
  ref?: Ref<HTMLSpanElement>
}

/**
 * The Mylder mark, a bus dot, an S-tog dot and an estimated ring, with no colours of its own: each
 * shape's fill or stroke comes from Brand.css, so the mark follows the theme. Its geometry is
 * packages/perron/logos/mylder-mark.svg's (CR-3), and it is hidden: the brand name beside it, seen
 * or hidden, is the one thing a screen reader hears (CR-4).
 */
const MARK = (
  <svg
    className="pn-Brand-mark"
    width="27"
    height="19"
    viewBox="0 0 27 19"
    aria-hidden="true"
    focusable="false"
  >
    <circle className="pn-Brand-bus" cx="5.5" cy="12.5" r="4.3" />
    <circle className="pn-Brand-sTog" cx="13.5" cy="5.5" r="4.3" />
    <circle className="pn-Brand-ring" cx="21.5" cy="12.5" r="3.6" strokeWidth="1.7" />
  </svg>
)

/** The Mylder brand for the brand slot of a top bar or a kiosk bar: the mark and the wordmark. */
export function Brand({ variant = 'full', brandNameLabel, render, ref, ...rest }: BrandProps) {
  const strings = useOwnedStrings({ brandName: brandNameLabel })

  // the mark, then the wordmark, or with the mark alone the name for screen readers only (CR-2)
  const children = (
    <>
      {MARK}
      {variant === 'full' ? (
        <span className="pn-Brand-wordmark">{strings.brandName}</span>
      ) : (
        <VisuallyHidden>{strings.brandName}</VisuallyHidden>
      )}
    </>
  )

  // the rest props first, so the class and data-variant win over them; useRender merges a render
  // element's own props after these, as Base UI does (CR-1)
  const own = { className: 'pn-Brand', 'data-variant': variant, children }
  return useRender({
    defaultTagName: 'span',
    render,
    ref,
    props: mergeProps<'span'>(rest, own),
  })
}
