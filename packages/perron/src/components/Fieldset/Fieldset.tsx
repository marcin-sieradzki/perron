// Fieldset: a named group of related controls, on Base UI's Fieldset. A native <fieldset> named by
// its legend, the caller's controls straight after it, and one switch that disables them all. Base
// UI names the group, disables it and shares the state with the fields and groups inside; nothing
// here adds ARIA or moves focus (CR-7). CheckboxGroup and RadioGroup give their Base UI group as
// `render` (CR-5). The spec is docs/components/fieldset.md.
import { Fieldset as BaseFieldset } from '@base-ui/react/fieldset'
import { mergeProps } from '@base-ui/react/merge-props'
import type { ReactNode, Ref } from 'react'
import { withClass } from '../../internal/nodes.ts'
import { VisuallyHidden } from '../../parts/VisuallyHidden/VisuallyHidden.tsx'
import './Fieldset.css'

export interface FieldsetProps extends Omit<
  BaseFieldset.Root.Props,
  'disabled' | 'children' | 'ref'
> {
  /**
   * Required. The group's name, in sentence case, a few words or a short question, such as "Show
   * on the map": shown above the controls, and the group's accessible name.
   */
  legend: ReactNode
  /**
   * Whether the legend is heard but not seen. Use it where a heading right above already names the
   * group for the eye, so the group keeps its name for the ear.
   * @default false
   */
  hiddenLegend?: boolean
  /**
   * Whether every control in the group ignores the pointer and the keys. Native controls leave the
   * tab order; Base UI's fields and groups inside take the disabled look; a fieldset round this
   * one disables it too.
   * @default false
   */
  disabled?: boolean
  /** The group's controls, in reading order, below the legend: checkboxes, radios, or fields. */
  children?: ReactNode
  /** The root element: the `<fieldset>`, or the element `render` gives. */
  ref?: Ref<HTMLElement>
  /** Props for each inner part, merged with the part's own, which win. */
  slotProps?: {
    /** Props for the `legend` part. Its `id` is the one the group's `aria-labelledby` points at. */
    legend?: BaseFieldset.Legend.Props
  }
}

/** The hidden legend's element: a span the eye never sees, still the group's name (CR-3). */
const HIDDEN_LEGEND = <VisuallyHidden />

/**
 * A named group of related controls, such as the modes shown on the map: its legend above, its
 * controls below, and one `disabled` for them all.
 */
export function Fieldset({
  legend,
  hiddenLegend = false,
  disabled = false,
  children,
  slotProps,
  className,
  ref,
  ...rest
}: FieldsetProps) {
  return (
    // CR-4: rest first, so Fieldset's own props win and none of its own reaches the <fieldset>
    <BaseFieldset.Root
      {...rest}
      ref={ref}
      disabled={disabled}
      className={withClass('pn-Fieldset', className)}
    >
      {/* CR-3, CR-4: always rendered; the caller's props under Fieldset's own, its id reaching
          Base UI, which points the root's aria-labelledby at it */}
      <BaseFieldset.Legend
        {...mergeProps<typeof BaseFieldset.Legend>(
          slotProps?.legend,
          hiddenLegend ? { render: HIDDEN_LEGEND } : undefined,
        )}
        className={withClass('pn-Fieldset-legend', slotProps?.legend?.className)}
      >
        {legend}
      </BaseFieldset.Legend>
      {/* CR-2: the controls are the root's own children, with no wrapper */}
      {children}
    </BaseFieldset.Root>
  )
}
