// The data behind a component's docs page, `<Name>.mdx`: its props table in MUI's layout, from the
// argTypes Storybook reads out of the component's docgen, and the notice a deprecated entry's page
// opens with. The sections of its spec the page shows are scripts/lib/spec-reader.ts's
// `specProse`. Kept apart from the blocks that draw them, so a node test can run them.
import type { ArgTypes } from '@storybook/react-vite'
import { deprecationNotice, specPage, type Entry } from '../../scripts/lib/entry.ts'

type InputType = ArgTypes[string]

/** One row of the props table: MUI's columns, and whether a caller must give the prop. */
export interface PropRow {
  name: string
  required: boolean
  type: string
  default: string
  description: string
}

/**
 * A type as the table shows it: on one line, with no trailing comma before a closing paren, and
 * with a Base UI namespace by its public name, `BaseTooltip.Trigger.Props` as `Tooltip.Trigger.Props`,
 * since a component imports Base UI's `Tooltip` as `BaseTooltip` when its own name is `Tooltip`.
 */
const oneLine = (s: string) =>
  s
    .replace(/\s+/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/,?\s+\)/g, ')')
    .replace(/\bBase([A-Z]\w*)\./g, '$1.')
    .trim()

/** A prop's type as written in the props type, where docgen kept the text. */
function typeOf(arg: InputType) {
  const type = arg.type as { raw?: string; name?: string; value?: unknown } | undefined
  if (type?.raw) return oneLine(type.raw)
  if (type?.name === 'other' && typeof type.value === 'string') return type.value
  return oneLine(arg.table?.type?.summary ?? type?.name ?? '')
}

/** One row per key of `slotProps`, or the prop whole when docgen could not see its keys. */
function slotRows(arg: InputType, row: PropRow): PropRow[] {
  const type = arg.type as {
    name?: string
    value?: Record<string, { raw?: string; value?: string; name?: string }>
  }
  if (type?.name !== 'object' || !type.value) return [row]
  return Object.entries(type.value).map(([key, part]) => ({
    name: `slotProps.${key}`,
    required: false,
    // `raw` keeps a generic's arguments, `Omit<Dialog.Close.Props, 'children'>`, which `name` drops
    type: oneLine(part.raw ?? part.value ?? part.name ?? ''),
    default: '',
    description: `Props for the \`${key}\` part.`,
  }))
}

/**
 * The props table: each prop the component's props type declares, in its order, then its slots,
 * one row per `slotProps` key. An argType docgen did not give (one inferred from a story's args) or
 * that hides itself from the table is left out.
 */
export function propRows(argTypes: ArgTypes): PropRow[] {
  const props: PropRow[] = []
  const slots: PropRow[] = []
  for (const [name, arg] of Object.entries(argTypes)) {
    if (!arg.table?.type || arg.table.disable) continue
    const row: PropRow = {
      name,
      required: Boolean((arg.type as { required?: boolean } | undefined)?.required),
      type: typeOf(arg),
      default: arg.table.defaultValue?.summary ?? '',
      description: arg.description ?? '',
    }
    if (name === 'slotProps') slots.push(...slotRows(arg, row))
    else props.push(row)
  }
  return [...props, ...slots]
}

/**
 * The notice above the intro of the docs page whose spec is at `path`: a deprecated entry's
 * successor, as markdown linked to the successor's spec, or undefined for any other entry.
 */
export function pageNotice(registry: Entry[], path: string) {
  const entry = registry.find((e) => specPage(e) === path)
  return entry && deprecationNotice(entry)
}
