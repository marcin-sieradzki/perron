// Accordion: a stack of headed sections, each opening and closing its own content under its
// heading, on Base UI's Accordion. Its item lives here too: Base UI's item, header, trigger and
// panel read the root's context, so they can't be built or shown apart (docs/components/accordion.md,
// Anatomy). Base UI gives the toggling, the single-open behaviour, the ARIA, the ids and the
// hiding of closed panels; nothing here adds a key handler (CR-1).
import { Accordion as BaseAccordion } from '@base-ui/react/accordion'
import { mergeProps } from '@base-ui/react/merge-props'
import type { CSSProperties, ReactNode, Ref } from 'react'
import { classes, withClass } from '../../internal/nodes.ts'
import { Chevron } from '../../parts/Chevron/Chevron.tsx'
import './Accordion.css'

/**
 * What each of the two inherits from its Base UI part: every prop but `own`, the ones it declares
 * itself or leaves out, and React's `className`, `style`, `children` and `ref`, which it declares as
 * React's.
 */
type Inherited<P, own extends PropertyKey = never> = Omit<
  P,
  own | 'className' | 'style' | 'children' | 'ref'
>

export interface AccordionProps extends Inherited<
  BaseAccordion.Root.Props<string>,
  'value' | 'defaultValue' | 'onValueChange' | 'orientation' | 'loopFocus' | 'onChange'
> {
  /** The `value`s of the open items, when the caller controls them. `[]` opens none. */
  value?: string[]
  /**
   * The `value`s of the items open at first, when Accordion keeps them itself. Left out, every item
   * starts closed.
   * @default []
   */
  defaultValue?: string[]
  /**
   * Called when an item opens or closes, with the `value`s of the items open after it: by a press,
   * Enter or Space on a trigger (`details.reason` `'trigger-press'`), or by the browser's find in
   * page with `hiddenUntilFound` (`'none'`). `event` is `details.event`.
   */
  onChange?: (event: Event, value: string[], details: BaseAccordion.Root.ChangeEventDetails) => void
  /** The `AccordionItem`s, in reading order. */
  children?: ReactNode
  /** Reaches the root. Merged after `pn-Accordion`. */
  className?: string
  /** Reaches the root. */
  style?: CSSProperties
  /** Reaches the root, the `<div>` that holds the items. */
  ref?: Ref<HTMLDivElement>
}

/**
 * A stack of headed sections, each opening and closing its own content under its heading, such as
 * the questions on a help panel. Holds `AccordionItem`s.
 */
export function Accordion({
  value,
  defaultValue,
  onChange,
  className,
  ref,
  ...rest
}: AccordionProps) {
  return (
    <BaseAccordion.Root<string>
      {...rest}
      ref={ref}
      value={value}
      // no destructuring default: Base UI's own empty list holds when it is left out (CR-4)
      defaultValue={defaultValue}
      onValueChange={
        onChange &&
        ((next: string[], details: BaseAccordion.Root.ChangeEventDetails) =>
          onChange(details.event, next, details))
      }
      className={classes('pn-Accordion', className)}
    />
  )
}

export interface AccordionItemProps extends Inherited<
  BaseAccordion.Item.Props,
  'value' | 'onOpenChange' | 'title'
> {
  /**
   * Required. The heading's words, in sentence case, such as "What the dot shapes mean": shown in
   * the trigger, and its accessible name and the panel's. Phrasing content only: it renders in a
   * `<button>`.
   */
  title: ReactNode
  /**
   * The value that names this item in Accordion's `value`, `defaultValue` and `onChange`. Left out,
   * Base UI generates one, and the item can't be opened at first or controlled.
   * @default A generated id
   */
  value?: string
  /** The panel's content, shown while the item is open. */
  children?: ReactNode
  /** Reaches the root, the item's `<div>`. Merged after `pn-AccordionItem`. */
  className?: string
  /** Reaches the root, the item's `<div>`. */
  style?: CSSProperties
  /** Reaches the root, the item's `<div>`. */
  ref?: Ref<HTMLDivElement>
  /** Props for each inner part, merged with the part's own, which win. */
  slotProps?: {
    /** Props for the `header` part, the heading, such as `render: <h2 />` for another heading level. */
    header?: BaseAccordion.Header.Props
    /** Props for the `trigger` part, the button that opens and closes the panel. */
    trigger?: BaseAccordion.Trigger.Props
    /** Props for the `panel` part, such as `keepMounted` for one panel. */
    panel?: BaseAccordion.Panel.Props
  }
}

/**
 * One section of an `Accordion`: a heading whose button opens and closes the panel under it, which
 * holds `children`.
 */
export function AccordionItem({
  title,
  value,
  children,
  slotProps,
  className,
  ref,
  ...rest
}: AccordionItemProps) {
  const { header, trigger, panel } = slotProps ?? {}
  // CR-5: each part's slot props merged under its own, which win, by mergeProps; the class is set
  // after the merge, since a caller's may be a function of the part's state (withClass)
  const button = (
    <BaseAccordion.Trigger
      {...mergeProps<typeof BaseAccordion.Trigger>(trigger, {
        children: (
          <>
            <span className="pn-AccordionItem-title">{title}</span>
            <span className="pn-AccordionItem-chevron" aria-hidden="true">
              <Chevron />
            </span>
          </>
        ),
      })}
      className={withClass('pn-AccordionItem-trigger', trigger?.className)}
    />
  )
  return (
    <BaseAccordion.Item
      {...rest}
      ref={ref}
      value={value}
      className={classes('pn-AccordionItem', className)}
    >
      <BaseAccordion.Header
        {...mergeProps<typeof BaseAccordion.Header>(header, { children: button })}
        className={withClass('pn-AccordionItem-header', header?.className)}
      />
      <BaseAccordion.Panel
        {...mergeProps<typeof BaseAccordion.Panel>(panel, { children })}
        className={withClass('pn-AccordionItem-panel', panel?.className)}
      />
    </BaseAccordion.Item>
  )
}
