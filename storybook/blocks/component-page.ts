// The data behind a component's docs page, `<Name>.mdx`: its props table in MUI's layout, from the
// argTypes Storybook reads out of the component's docgen, and the sections of its spec the page
// shows. Kept apart from the blocks that draw them, so a node test can run them.
import type { ArgTypes } from '@storybook/react-vite'

type InputType = ArgTypes[string]

/** One row of the props table: MUI's columns, and whether a caller must give the prop. */
export interface PropRow {
  name: string
  required: boolean
  type: string
  default: string
  description: string
}

const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim()

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
 * A spec's `##` sections by heading, and its intro: the text between `#` and the first `##`, up to
 * its run notes.
 */
function sectionsOf(markdown: string) {
  const [head, ...rest] = markdown.split(/^(?=## )/m)
  const intro = head
    .replace(/^# .*$/m, '')
    .split(RUN_NOTES)[0]
    .trim()
  const sections = new Map(rest.map((s) => [/^## (.+)$/m.exec(s)![1].trim(), s.trim()] as const))
  return { intro, sections }
}

/**
 * Prose from a spec for the docs page: `'intro'` gives what the component is for, above the run
 * notes, a list of
 * headings gives those sections, each with its `##` heading, in the order asked.
 */
export function specProse(markdown: string, which: 'intro' | string[]) {
  const { intro, sections } = sectionsOf(markdown)
  if (which === 'intro') return intro
  return which
    .map((heading) => {
      const section = sections.get(heading)
      if (!section) throw new Error(`The spec has no "## ${heading}" section`)
      return section
    })
    .join('\n\n')
}
