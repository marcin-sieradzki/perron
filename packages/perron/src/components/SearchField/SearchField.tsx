// SearchField: the field that finds a line or a stop. A labelled text input with the search icon,
// a clear button while it holds words, and a list of suggestions under it that narrows as the
// person types, on Base UI's Field and Autocomplete. Base UI does the filtering, the keys, the
// highlight and the placement (CR-1); the spec is docs/components/search-field.md.
import { Autocomplete } from '@base-ui/react/autocomplete'
import { Field } from '@base-ui/react/field'
import { mergeProps } from '@base-ui/react/merge-props'
import { useId } from 'react'
import type { MouseEvent, ReactNode, Ref } from 'react'
import { given, withClass } from '../../internal/nodes.ts'
import { CloseButton } from '../../parts/CloseButton/CloseButton.tsx'
import { VisuallyHidden } from '../../parts/VisuallyHidden/VisuallyHidden.tsx'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import './SearchField.css'

type ChangeDetails = Autocomplete.Root.ChangeEventDetails
type OpenDetails = Autocomplete.Root.OpenChangeEventDetails

/** One suggestion in the list: a line or a stop. */
export interface SearchFieldItem {
  /** Identifies the item and keys its row, so two stops with the same name stay apart. */
  value: string
  /** The words the row shows and the box takes when the item is chosen, such as "Nørreport St.". */
  label: string
  /** A second line under the label that tells two rows apart, such as "Metro, S-tog and bus". */
  description?: ReactNode
  /** A mark before the text, such as a StationIcon or a LineBadge, which carries its own words. */
  startIcon?: ReactNode
}

export interface SearchFieldProps extends Omit<
  Field.Root.Props,
  | 'children'
  | 'ref'
  | 'invalid'
  | 'validate'
  | 'validationMode'
  | 'validationDebounceTime'
  | 'actionsRef'
  | 'dirty'
  | 'touched'
  | 'onChange'
  | 'defaultValue'
> {
  /**
   * Required. The field's name, in sentence case, such as "Search lines and stops": shown above
   * the box, and the input's accessible name.
   */
  label: ReactNode
  /**
   * Whether the label is heard but not seen. Use it where the icon and the placeholder make the
   * field's purpose plain, as in the top bar.
   * @default false
   */
  // perron-allow(props): MUI's name for a field with no visible label, a boolean, not an owned string's override (spec, Props)
  hiddenLabel?: boolean
  /**
   * Words shown in the empty box, such as "Line or stop, such as 5C". They vanish as the person
   * types, so they never replace the label.
   */
  placeholder?: string
  /**
   * Required. The suggestions: each with a `value` that identifies it, the `label` shown and
   * filled into the box when it is chosen, and an optional `description` and `startIcon`.
   */
  items: ReadonlyArray<SearchFieldItem>
  /**
   * Whether an item matches the typed words. Left out, an item matches when its label contains
   * them, ignoring case and accents. `null` shows `items` as given, for suggestions the caller has
   * already matched, such as from a server.
   */
  filter?: ((item: SearchFieldItem, query: string) => boolean) | null
  /** The words in the box, when the caller controls them. */
  value?: string
  /**
   * The words in the box at first, when SearchField keeps them itself. Left out, the box starts
   * empty.
   */
  defaultValue?: string
  /**
   * Called when the words change: by typing (`details.reason` `'input-change'`), by a chosen item
   * filling them (`'item-press'`), by the clear button (`'clear-press'`), or by Esc with the list
   * closed (`'escape-key'`). `event` is `details.event`.
   */
  onChange?: (event: Event, value: string, details: ChangeDetails) => void
  /** Whether the list of suggestions is shown, when the caller controls it. */
  open?: boolean
  /**
   * Whether the list is shown at first, when `open` is not set.
   * @default false
   */
  defaultOpen?: boolean
  /**
   * Called when the list asks to open: as the person types (`details.reason` `'input-change'`) or
   * presses an arrow key (`'list-navigation'`).
   */
  onOpen?: (event: Event, details: OpenDetails) => void
  /**
   * Called when the list asks to close: `reason` is `'escape-key'`, `'outside-press'`,
   * `'focus-out'`, `'item-press'`, `'input-clear'`, `'close-press'`, or `'none'` for Enter with no
   * row highlighted; `details.cancel()` keeps it open.
   */
  onClose?: (
    event: Event,
    reason: Autocomplete.Root.ChangeEventReason,
    details: OpenDetails,
  ) => void
  /**
   * Called when the person chooses a suggestion, with a press or with Enter on the highlighted
   * row, with the item itself.
   */
  onItemSelect?: (event: MouseEvent<HTMLDivElement>, item: SearchFieldItem) => void
  /** Reaches the root, the `Field.Root` `<div>`. */
  ref?: Ref<HTMLDivElement>
  /**
   * Overrides "Clear", the clear button's name.
   * @default The locale's
   */
  clearLabel?: string
  /**
   * Overrides "No matches", the message the list shows and announces when no suggestion matches.
   * @default The locale's
   */
  noMatchesLabel?: string
  /** Props for each inner part, merged with the part's own, which win. */
  slotProps?: {
    /** Props for the `label` part. */
    label?: Field.Label.Props
    /** Props for the `inputGroup` part, the field's box. */
    inputGroup?: Autocomplete.InputGroup.Props
    /** Props for the `input` part, such as `autoFocus`. */
    input?: Autocomplete.Input.Props
    /** Props for the `clear` part, all but `disabled`: the clear button is never disabled. */
    clear?: Omit<Autocomplete.Clear.Props, 'disabled'>
    /** Props for the `portal` part, such as its `container`. */
    portal?: Autocomplete.Portal.Props
    /** Props for the `positioner` part, such as `side` or `collisionPadding`. */
    positioner?: Autocomplete.Positioner.Props
    /** Props for the `popup` part, the list's glass panel. */
    popup?: Autocomplete.Popup.Props
    /** Props for the `empty` part, the message shown when nothing matches. */
    empty?: Autocomplete.Empty.Props
    /** Props for the `list` part, the listbox. */
    list?: Autocomplete.List.Props
    /** Props for every `item` part, each suggestion's row. Its `onClick` runs after `onItemSelect`. */
    item?: Autocomplete.Item.Props
  }
}

/** `search` from packages/perron/icons/, hidden from screen readers: the label names the field (CR-7). */
const SEARCH_ICON = (
  <svg
    className="perron-icon pn-SearchField-icon"
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="7" cy="7" r="4.6" />
    <path d="m10.5 10.5 3.2 3.2" />
  </svg>
)

/** A text field that finds a line or a stop, with suggestions that narrow as the person types. */
export function SearchField({
  label,
  hiddenLabel = false,
  placeholder,
  items,
  filter,
  value,
  defaultValue,
  onChange,
  open,
  defaultOpen = false,
  onOpen,
  onClose,
  onItemSelect,
  clearLabel,
  noMatchesLabel,
  slotProps,
  className,
  ref,
  ...rest
}: SearchFieldProps) {
  const strings = useOwnedStrings({ clear: clearLabel, noMatches: noMatchesLabel })
  // CR-6: one id names the input, through Base UI, and the list, through Perron
  const labelId = useId()

  // CR-4: Base UI's handlers become MUI's, here, and neither reaches the caller
  const handleValueChange = (next: string, details: ChangeDetails) =>
    onChange?.(details.event, next, details)
  const handleOpenChange = (next: boolean, details: OpenDetails) => {
    if (next) onOpen?.(details.event, details)
    else onClose?.(details.event, details.reason, details)
  }

  return (
    <Field.Root {...rest} ref={ref} className={withClass('pn-SearchField', className)}>
      <Field.Label
        {...mergeProps<typeof Field.Label>(slotProps?.label, {
          id: labelId,
          // CR-6: a hidden label stays the field's name, in a span the eye never sees
          ...(hiddenLabel ? { render: <VisuallyHidden />, nativeLabel: false } : {}),
        })}
        className={withClass('pn-SearchField-label', slotProps?.label?.className)}
      >
        {label}
      </Field.Label>
      <Autocomplete.Root
        items={items}
        filter={filter}
        value={value}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={handleOpenChange}
      >
        <Autocomplete.InputGroup
          {...mergeProps<typeof Autocomplete.InputGroup>(slotProps?.inputGroup, undefined)}
          className={withClass('pn-SearchField-inputGroup', slotProps?.inputGroup?.className)}
        >
          {SEARCH_ICON}
          <Autocomplete.Input
            {...mergeProps<typeof Autocomplete.Input>(slotProps?.input, {
              placeholder,
              // CR-8: a phone labels its Enter key as a search; slotProps.input replaces it
              enterKeyHint: slotProps?.input?.enterKeyHint ?? 'search',
            })}
            className={withClass('pn-SearchField-input', slotProps?.input?.className)}
          />
          {rest.disabled ? null : (
            // CR-7: the CloseButton part, left out while the field is disabled
            <Autocomplete.Clear
              {...mergeProps<typeof Autocomplete.Clear>(slotProps?.clear, {
                render: <CloseButton label={strings.clear} />,
              })}
              className={withClass('pn-SearchField-clear', slotProps?.clear?.className)}
            />
          )}
        </Autocomplete.InputGroup>
        <Autocomplete.Portal
          {...mergeProps<typeof Autocomplete.Portal>(slotProps?.portal, undefined)}
          className={withClass('pn-SearchField-portal', slotProps?.portal?.className)}
        >
          <Autocomplete.Positioner
            {...mergeProps<typeof Autocomplete.Positioner>(slotProps?.positioner, undefined)}
            className={withClass('pn-SearchField-positioner', slotProps?.positioner?.className)}
          >
            <Autocomplete.Popup
              {...mergeProps<typeof Autocomplete.Popup>(slotProps?.popup, undefined)}
              className={withClass('pn-SearchField-popup', slotProps?.popup?.className)}
            >
              {/* CR-14: always rendered, a live region Base UI fills only while nothing matches */}
              <Autocomplete.Empty
                {...mergeProps<typeof Autocomplete.Empty>(slotProps?.empty, undefined)}
                className={withClass('pn-SearchField-empty', slotProps?.empty?.className)}
              >
                {strings.noMatches}
              </Autocomplete.Empty>
              <Autocomplete.List
                {...mergeProps<typeof Autocomplete.List>(slotProps?.list, {
                  'aria-labelledby': labelId,
                })}
                className={withClass('pn-SearchField-list', slotProps?.list?.className)}
              >
                {(item: SearchFieldItem) => (
                  <Autocomplete.Item
                    key={item.value}
                    // CR-5: SearchField's own props last, so onItemSelect runs first, then the
                    // caller's onClick, which can't cancel it
                    {...mergeProps<typeof Autocomplete.Item>(slotProps?.item, {
                      value: item,
                      onClick: (event) => onItemSelect?.(event, item),
                    })}
                    className={withClass('pn-SearchField-item', slotProps?.item?.className)}
                  >
                    {given(item.startIcon) ? (
                      <span className="pn-SearchField-startIcon">{item.startIcon}</span>
                    ) : null}
                    <span className="pn-SearchField-text">
                      <span className="pn-SearchField-itemLabel">{item.label}</span>
                      {given(item.description) ? (
                        <span className="pn-SearchField-description">{item.description}</span>
                      ) : null}
                    </span>
                  </Autocomplete.Item>
                )}
              </Autocomplete.List>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>
    </Field.Root>
  )
}
