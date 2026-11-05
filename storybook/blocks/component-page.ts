// The data behind a component's docs page, `<Name>.mdx`: its props table in MUI's layout, from the
// argTypes Storybook reads out of the component's docgen, the sections of its spec the page shows,
// and the notice a deprecated entry's page opens with. Kept apart from the blocks that draw them,
// so a node test can run them.
import type { ArgTypes } from '@storybook/react-vite'
import { deprecationNotice, specPage, type Entry } from '../../scripts/lib/entry.ts'
import { sectionMarkdown, splitSections, WHEN_TO_USE } from '../../scripts/lib/usage.ts'

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
 * The line in a spec's intro that starts its run notes: how the spec was made (ADR 0010, the
 * sources, what the prototype gave), for the maintainer. The docs page's intro stops above it.
 */
export const RUN_NOTES = '<!-- run notes -->'

/**
 * A spec's `##` sections by heading, each with its heading, and its intro: the text between `#` and
 * the first `##`, up to its run notes, then its When to use, heading and all, when it has one.
 */
function introAndSections(markdown: string) {
  const { head, sections: all } = splitSections(markdown)
  const sections = new Map(all.map((s) => [s.heading, sectionMarkdown(s).trim()] as const))
  const intro = [
    head
      .map((l) => l.text)
      .join('\n')
      .replace(/^# .*$/m, '')
      .split(RUN_NOTES)[0]
      .trim(),
    sections.get(WHEN_TO_USE),
  ]
    .filter(Boolean)
    .join('\n\n')
  return { intro, sections }
}

/**
 * Prose from a spec for the docs page: `'intro'` gives what the component is for, above the run
 * notes, and its When to use; a list of headings gives those sections, each with its `##`
 * heading, in the order asked.
 */
export function specProse(markdown: string, which: 'intro' | string[]) {
  const { intro, sections } = introAndSections(markdown)
  if (which === 'intro') return intro
  return which
    .map((heading) => {
      const section = sections.get(heading)
      if (!section) throw new Error(`The spec has no "## ${heading}" section`)
      return section
    })
    .join('\n\n')
}

/**
 * The notice above the intro of the docs page whose spec is at `path`: a deprecated entry's
 * successor, as markdown linked to the successor's spec, or undefined for any other entry.
 */
export function pageNotice(registry: Entry[], path: string) {
  const entry = registry.find((e) => specPage(e) === path)
  return entry && deprecationNotice(entry)
}
