// ScaleBar: the map's scale, a short bar on glass with the ground distance its length spans
// written above it, "300 m" or "2 km", which shortens and lengthens as the map zooms. A pattern:
// Perron's Surface and the VisuallyHidden part over plain elements, never Base UI (CR-1).
// Spec: docs/patterns/scale-bar.md.
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ComponentPropsWithRef, CSSProperties, Ref } from 'react'
import { Surface } from '../../components/Surface/Surface.tsx'
import { VisuallyHidden } from '../../parts/VisuallyHidden/VisuallyHidden.tsx'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import { classes, joinRefs } from '../../internal/nodes.ts'
import { figureOf, measurable, scaleFor } from './scale.ts'
import './ScaleBar.css'

export interface ScaleBarProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /**
   * The ground distance one CSS pixel spans at the map's centre, in metres, as the map gives it at
   * its current zoom and latitude. Required. ScaleBar picks a round distance from it and draws the
   * bar that long. A value that is not a positive finite number shows "—" and says "Unknown".
   */
  metersPerPixel: number
  /**
   * Overrides "Scale", heard before the distance
   * @default The locale's
   */
  scaleLabel?: string
  /**
   * Overrides "m", the unit after a distance under a kilometre
   * @default The locale's
   */
  metersUnitLabel?: string
  /**
   * Overrides "km", the unit after a distance of a kilometre or more
   * @default The locale's
   */
  kilometersUnitLabel?: string
  /**
   * Overrides "Unknown", heard in place of "—" when `metersPerPixel` gives no distance
   * @default The locale's
   */
  unknownLabel?: string
  /** Joined after `pn-ScaleBar` on the root */
  className?: string
  /** Reaches the root */
  style?: CSSProperties
  /** Reaches the root element */
  ref?: Ref<HTMLDivElement>
  /** Props for each inner part, merged with the part's own, which win: the caller's class follows the part's own */
  slotProps?: {
    /** Props for the `label` part, the distance */
    label?: ComponentPropsWithRef<'span'>
    /** Props for the `bar` part, the drawn bracket */
    bar?: ComponentPropsWithRef<'span'>
  }
}

/** U+2014, the dash content design writes for unknown. */
const DASH = '—'

/** U+00A0, the no-break space between a figure and its unit, so the two never wrap apart (CR-6). */
const NBSP = '\u00a0'

/**
 * The map's scale: a short bar on glass with the ground distance its length spans written above
 * it, picked from the map's resolution and rounded to 1, 2, 3 or 5 times a power of ten.
 */
export function ScaleBar({
  metersPerPixel,
  scaleLabel,
  metersUnitLabel,
  kilometersUnitLabel,
  unknownLabel,
  slotProps,
  className,
  ref,
  ...rest
}: ScaleBarProps) {
  const strings = useOwnedStrings({
    scale: scaleLabel,
    metersUnit: metersUnitLabel,
    kilometersUnit: kilometersUnitLabel,
    unknown: unknownLabel,
  })
  const { label: labelProps, bar: barProps } = slotProps ?? {}

  // CR-4: the bar's longest length is the root's content box, read once after the first layout;
  // until then, as in a server render, there is no length to draw
  const root = useRef<HTMLDivElement>(null)
  const rootRef = useMemo(() => joinRefs(root, ref), [ref])
  const [longest, setLongest] = useState<number>()
  useLayoutEffect(() => {
    if (root.current) setLongest(parseFloat(getComputedStyle(root.current).inlineSize))
  }, [])

  // CR-7: a resolution that is not a positive finite number gives no distance
  const unknown = !measurable(metersPerPixel)
  const scale = longest === undefined ? undefined : scaleFor(metersPerPixel, longest)
  const reading = scale && figureOf(scale.meters)

  return (
    // CR-2: Surface's glass, never set here; the rest props reach its div, and the class joins as
    // "pn-Surface pn-ScaleBar <caller's>". CR-8: nothing placed
    <Surface {...rest} ref={rootRef} variant="glass" className={classes('pn-ScaleBar', className)}>
      {/* CR-10: the caller's label props under the pattern's own class and words */}
      <span
        {...labelProps}
        className={classes('pn-ScaleBar-label', labelProps?.className)}
        dangerouslySetInnerHTML={undefined}
      >
        <VisuallyHidden>{strings.scale}</VisuallyHidden>{' '}
        {unknown ? (
          // CR-7: "—" for the eye, "Unknown" for the ear
          <>
            <span aria-hidden="true">{DASH}</span>
            <VisuallyHidden>{strings.unknown}</VisuallyHidden>
          </>
        ) : (
          // CR-6: the figure, a no-break space and the unit as separate text, never apart
          reading && (
            <>
              {reading.figure}
              {NBSP}
              {reading.unit === 'meters' ? strings.metersUnit : strings.kilometersUnit}
            </>
          )
        )}
      </span>
      {/* CR-5: the bar's length is the one inline style, the distance's share, over the caller's.
          CR-10: its children are the pattern's, none, so nothing a caller gives renders inside it */}
      {scale && (
        <span
          {...barProps}
          className={classes('pn-ScaleBar-bar', barProps?.className)}
          style={{ ...barProps?.style, inlineSize: `${scale.share * 100}%` }}
          aria-hidden="true"
          dangerouslySetInnerHTML={undefined}
        >
          {null}
        </span>
      )}
    </Surface>
  )
}
