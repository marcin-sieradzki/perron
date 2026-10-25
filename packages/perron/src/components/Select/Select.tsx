// Select: the field that picks one value from a short, fixed list. A labelled box showing the
// chosen option, or a placeholder, that opens a list of options under it, on the Field component
// and Base UI's Select. Base UI does the opening, the keys, the highlight, the typed letters, the
// placement and the hidden input; nothing here adds a key or pointer handler (CR-1). The spec is
// docs/components/select.md.
import type { Field as BaseField } from '@base-ui/react/field'
import { mergeProps } from '@base-ui/react/merge-props'
import { Select as BaseSelect } from '@base-ui/react/select'
import { useId, useMemo } from 'react'
import { withClass } from '../../internal/nodes.ts'
import { SelectedMark } from '../../parts/SelectedMark/SelectedMark.tsx'
import { Field } from '../Field/Field.tsx'
import type { FieldProps } from '../Field/Field.tsx'
import './Select.css'

/** One option of a Select. */
export interface SelectItem {
  /** Identifies the option, and is the value a form submits. */
  value: string
  /** The option's words, in its row and in the box once chosen. */
  label: string
  /** Whether the option is shown but can't be chosen. */
  disabled?: boolean
}

/** A group of a Select's options, under its own label. */
export interface SelectGroup {
  /** The group's name, shown above its options. */
  label: string
  /** The group's options, in order. */
  items: ReadonlyArray<SelectItem>
}

export interface SelectProps extends Omit<
  FieldProps,
  'children' | 'slotProps' | 'onChange' | 'defaultValue'
> {
  /**
   * Required. The options, in order: each with a `value` that identifies it and the `label` shown
   * in its row and in the box once chosen, and `disabled` for one that can't be chosen; or groups,
   * each with a `label` and its own `items`.
   */
  items: ReadonlyArray<SelectItem> | ReadonlyArray<SelectGroup>
  /**
   * Words shown in the box while no option is chosen, such as "Choose a transport mode". They never
   * replace the label.
   */
  placeholder?: string
  /** The chosen option's `value`, or `null` for none, when the caller controls it. */
  value?: string | null
  /**
   * The option chosen at first, when Select keeps the value itself. Left out, nothing is chosen.
   */
  defaultValue?: string | null
  /**
   * Called when the chosen option changes: by a press or Enter on a row (`details.reason`
   * `'item-press'`), or by letters typed on the closed box (`'none'`). `event` is `details.event`.
   */
  onChange?: (
    event: Event,
    value: string | null,
    details: BaseSelect.Root.ChangeEventDetails,
  ) => void
  /** Whether the list of options is shown, when the caller controls it. */
  open?: boolean
  /**
   * Whether the list is shown at first, when `open` is not set.
   * @default false
   */
  defaultOpen?: boolean
  /**
   * Called when the list asks to open: by a press of the box, Enter or Space (`details.reason`
   * `'trigger-press'`), or an arrow key (`'list-navigation'`).
   */
  onOpen?: (event: Event, details: BaseSelect.Root.OpenChangeEventDetails) => void
  /**
   * Called when the list asks to close: `reason` is `'item-press'`, `'escape-key'`,
   * `'outside-press'`, `'trigger-press'` or `'focus-out'`; `details.cancel()` keeps it open.
   */
  onClose?: (
    event: Event,
    reason: BaseSelect.Root.ChangeEventReason,
    details: BaseSelect.Root.OpenChangeEventDetails,
  ) => void
  /**
   * Whether an option must be chosen before the form is submitted. Use it or `optional`, never
   * both.
   * @default false
   */
  required?: boolean
  /**
   * Whether the chosen option is shown but can't be changed. The list still opens, so the person
   * can see the options.
   * @default false
   */
  readOnly?: boolean
  /** Props for each inner part, merged with the part's own, which win. */
  slotProps?: {
    /** Props for the `label` part. */
    label?: BaseField.Label.Props
    /** Props for the `description` part. */
    description?: BaseField.Description.Props
    /**
     * Props for the `error` part, such as `match`, to show a message of the caller's own for one
     * failing check only, as `match="valueMissing"`.
     */
    error?: BaseField.Error.Props
    /** Props for the `trigger` part, the field's box. */
    trigger?: BaseSelect.Trigger.Props
    /** Props for the `value` part, the chosen option's words in the box. */
    value?: BaseSelect.Value.Props
    /** Props for the `icon` part, the chevron at the end of the box. */
    icon?: BaseSelect.Icon.Props
    /** Props for the `portal` part, such as its `container`. */
    portal?: BaseSelect.Portal.Props
    /**
     * Props for the `positioner` part, such as `side` or `collisionPadding`, all but
     * `alignItemWithTrigger`: the list always opens under the box.
     */
    positioner?: Omit<BaseSelect.Positioner.Props, 'alignItemWithTrigger'>
    /** Props for the `popup` part, the list's glass panel. */
    popup?: BaseSelect.Popup.Props
    /** Props for the `list` part, the listbox. */
    list?: BaseSelect.List.Props
    /** Props for every `group` part. */
    group?: BaseSelect.Group.Props
    /** Props for every `groupLabel` part. */
    groupLabel?: BaseSelect.GroupLabel.Props
    /** Props for every `separator` part, the hairline between two groups. */
    separator?: BaseSelect.Separator.Props
    /** Props for every `item` part, each option's row. */
    item?: BaseSelect.Item.Props
    /** Props for every `itemText` part, each option's words. */
    itemText?: BaseSelect.ItemText.Props
    /** Props for the `itemIndicator` part, the tick beside the chosen option. */
    itemIndicator?: BaseSelect.ItemIndicator.Props
  }
}

/** Whether `items` holds groups rather than options: a group has `items` of its own. */
const isGroups = (
  items: ReadonlyArray<SelectItem> | ReadonlyArray<SelectGroup>,
): items is ReadonlyArray<SelectGroup> => items.length > 0 && 'items' in items[0]

/** `chevron-down` from packages/perron/icons/, hidden from screen readers by `Select.Icon` (CR-7). */
const CHEVRON = (
  <svg
    className="perron-icon"
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m4 6 4 4 4-4" />
  </svg>
)

/** The field that picks one value from a short, fixed list, such as a transport mode. */
export function Select({
  items,
  placeholder,
  value,
  defaultValue,
  onChange,
  open,
  defaultOpen = false,
  onOpen,
  onClose,
  required = false,
  readOnly = false,
  slotProps,
  className,
  ...rest
}: SelectProps) {
  // CR-6: one id names the trigger, through Base UI, and the list, through Perron
  const ownLabelId = useId()
  const labelId = slotProps?.label?.id ?? ownLabelId

  // CR-4: the options flattened, groups and all, so the value shows the chosen option's label
  const flat = useMemo(
    () =>
      (isGroups(items) ? items.flatMap((group) => group.items) : items).map((item) => ({
        value: item.value,
        label: item.label,
      })),
    [items],
  )

  // CR-4: Base UI's handlers become MUI's, here, and neither reaches the caller
  const handleValueChange = (next: string | null, details: BaseSelect.Root.ChangeEventDetails) =>
    onChange?.(details.event, next, details)
  const handleOpenChange = (next: boolean, details: BaseSelect.Root.OpenChangeEventDetails) => {
    if (next) onOpen?.(details.event, details)
    else onClose?.(details.event, details.reason, details)
  }

  /** One option's row: its words, then the tick while it is the chosen one (CR-2, CR-13). */
  const row = (item: SelectItem) => (
    <BaseSelect.Item
      key={item.value}
      {...mergeProps<typeof BaseSelect.Item>(slotProps?.item, {
        value: item.value,
        label: item.label,
        disabled: item.disabled,
      })}
      className={withClass('pn-Select-item', slotProps?.item?.className)}
    >
      <BaseSelect.ItemText
        {...mergeProps<typeof BaseSelect.ItemText>(slotProps?.itemText, undefined)}
        className={withClass('pn-Select-itemText', slotProps?.itemText?.className)}
      >
        {item.label}
      </BaseSelect.ItemText>
      <BaseSelect.ItemIndicator
        {...mergeProps<typeof BaseSelect.ItemIndicator>(slotProps?.itemIndicator, {
          render: <SelectedMark />,
        })}
        className={withClass('pn-Select-itemIndicator', slotProps?.itemIndicator?.className)}
      />
    </BaseSelect.Item>
  )

  return (
    <Field
      {...rest}
      className={withClass('pn-Select', className)}
      slotProps={{
        // CR-5: Select's own label props under the caller's, so a caller's id or render wins
        // (mergeProps types the ref as an HTMLElement's, where Field's slot takes a <label>'s)
        label: mergeProps<typeof BaseField.Label>(
          { id: ownLabelId, render: <div />, nativeLabel: false },
          slotProps?.label,
        ) as BaseField.Label.Props,
        description: slotProps?.description,
        error: slotProps?.error,
      }}
    >
      <BaseSelect.Root<string>
        items={flat}
        // CR-3: the name reaches the hidden input whether or not the field's context does
        {...(rest.name !== undefined && { name: rest.name })}
        // CR-4: a key the caller leaves out is left out, so the value stays uncontrolled
        {...(value !== undefined && { value })}
        {...(defaultValue !== undefined && { defaultValue })}
        {...(open !== undefined && { open })}
        defaultOpen={defaultOpen}
        required={required}
        readOnly={readOnly}
        onValueChange={handleValueChange}
        onOpenChange={handleOpenChange}
      >
        <BaseSelect.Trigger
          {...mergeProps<typeof BaseSelect.Trigger>(slotProps?.trigger, undefined)}
          className={withClass('pn-Select-trigger', slotProps?.trigger?.className)}
        >
          <BaseSelect.Value
            {...mergeProps<typeof BaseSelect.Value>(slotProps?.value, { placeholder })}
            className={withClass('pn-Select-value', slotProps?.value?.className)}
          />
          <BaseSelect.Icon
            {...mergeProps<typeof BaseSelect.Icon>(slotProps?.icon, { children: CHEVRON })}
            className={withClass('pn-Select-icon', slotProps?.icon?.className)}
          />
        </BaseSelect.Trigger>
        <BaseSelect.Portal
          {...mergeProps<typeof BaseSelect.Portal>(slotProps?.portal, undefined)}
          className={withClass('pn-Select-portal', slotProps?.portal?.className)}
        >
          <BaseSelect.Positioner
            // CR-8: Select's own, last, so the list always opens under the box
            {...mergeProps<typeof BaseSelect.Positioner>(slotProps?.positioner, {
              alignItemWithTrigger: false,
            })}
            className={withClass('pn-Select-positioner', slotProps?.positioner?.className)}
          >
            <BaseSelect.Popup
              {...mergeProps<typeof BaseSelect.Popup>(slotProps?.popup, undefined)}
              className={withClass('pn-Select-popup', slotProps?.popup?.className)}
            >
              <BaseSelect.List
                {...mergeProps<typeof BaseSelect.List>(slotProps?.list, {
                  'aria-labelledby': labelId,
                })}
                className={withClass('pn-Select-list', slotProps?.list?.className)}
              >
                {isGroups(items)
                  ? items.flatMap((group, index) => [
                      // a hairline before each group but the first (CR-2)
                      index > 0 ? (
                        <BaseSelect.Separator
                          key={`separator-${group.label}`}
                          {...mergeProps<typeof BaseSelect.Separator>(
                            slotProps?.separator,
                            undefined,
                          )}
                          className={withClass(
                            'pn-Select-separator',
                            slotProps?.separator?.className,
                          )}
                        />
                      ) : null,
                      <BaseSelect.Group
                        key={group.label}
                        {...mergeProps<typeof BaseSelect.Group>(slotProps?.group, undefined)}
                        className={withClass('pn-Select-group', slotProps?.group?.className)}
                      >
                        <BaseSelect.GroupLabel
                          {...mergeProps<typeof BaseSelect.GroupLabel>(
                            slotProps?.groupLabel,
                            undefined,
                          )}
                          className={withClass(
                            'pn-Select-groupLabel',
                            slotProps?.groupLabel?.className,
                          )}
                        >
                          {group.label}
                        </BaseSelect.GroupLabel>
                        {group.items.map(row)}
                      </BaseSelect.Group>,
                    ])
                  : items.map(row)}
              </BaseSelect.List>
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </Field>
  )
}
