'use client'
// NormalService: the good news about a line, as a tick in a circle and "Running normally" in the
// success colour, where the line's disruptions would be listed. Spec:
// docs/components/normal-service.md.
import type { Ref } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import './NormalService.css'

export interface NormalServiceProps extends Omit<
  useRender.ComponentProps<'span'>,
  'children' | 'ref'
> {
  /**
   * Overrides "Running normally", the words shown and read.
   *
   * @default The locale's
   */
  runningNormallyLabel?: string
  /** Reaches the root element. */
  ref?: Ref<HTMLSpanElement>
}

/**
 * The good news about a line, as a tick in a circle and "Running normally" in the success colour,
 * shown where a line's disruptions would be listed when it has none.
 */
export function NormalService({ render, ref, runningNormallyLabel, ...rest }: NormalServiceProps) {
  // CR-4: the owned string, with this instance's runningNormallyLabel laid over it
  const strings = useOwnedStrings({ runningNormally: runningNormallyLabel })
  // CR-6: NormalService's own props win over the caller's; runningNormallyLabel is out of rest
  const own = {
    className: 'pn-NormalService',
    children: (
      <>
        {/* CR-2: icons/check-circle.svg, inlined unchanged but for width and height */}
        <svg
          className="perron-icon pn-NormalService-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          focusable="false"
        >
          <circle cx="7" cy="7" r="5.6" />
          <path d="M4.4 7.2l1.8 1.8 3.4-3.6" />
        </svg>
        <span className="pn-NormalService-label">{strings.runningNormally}</span>
      </>
    ),
  }
  return useRender({
    defaultTagName: 'span',
    render,
    ref,
    props: mergeProps<'span'>(rest, own),
  })
}
