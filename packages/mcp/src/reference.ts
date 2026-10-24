// get_reference: the API reference section of a Base UI or MUI page, from the docs those packages
// bundle, so it describes the version installed in the project, not the latest one online.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { sections, type Section } from './markdown.ts'
import { packageDir } from './resolve.ts'

export const LIBRARIES = {
  'base-ui': {
    package: '@base-ui/react',
    dir: 'docs/react/components',
    file: (name: string) => `${name}.md`,
  },
  mui: {
    package: '@mui/material',
    dir: 'docs/material-ui',
    file: (name: string) => `react-${name}.md`,
  },
} as const

export type Library = keyof typeof LIBRARIES

/** `Select`, `TextField`, `OTPField` or `text-field` to the file name's form, `text-field`. */
const kebab = (s: string) =>
  s
    .trim()
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

/** The sections a page offers as parts, and those `part` picks: all of them when it is empty. */
interface Choice {
  parts: Section[]
  chosen: Section[]
}

/** Base UI: the `## API reference` section, or one part's `###` sections in it. */
function baseUi(all: Section[], part?: string): Choice {
  const api = all.find((s) => s.level === 2 && same(s.heading, 'API reference'))
  const parts = api ? sections(api.text).filter((s) => s.level === 3) : []
  if (!part) return { parts, chosen: api ? [api] : [] }
  const chosen = parts.filter((s) => same(s.heading, part) || same(s.heading.split('.')[0], part))
  return { parts, chosen }
}

/** MUI: every `# <Name> API` section, or the one named `part`. */
function mui(all: Section[], part?: string): Choice {
  const parts = all.filter((s) => s.level === 1 && / API$/.test(s.heading))
  return { parts, chosen: part ? parts.filter((s) => same(s.heading, `${part} API`)) : parts }
}

/** The reference text, or an error that says what exists instead. */
export function getReference(
  cwd: string,
  library: Library,
  component: string,
  part?: string,
): { text: string } | { error: string } {
  const lib = LIBRARIES[library]
  const root = packageDir(lib.package, cwd)
  if (!root)
    return { error: `${lib.package} is not installed in ${cwd}. Install it to read its docs.` }
  const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version as string
  const [name, inline] = component.split('.')
  const prefix = `${name.toLowerCase()}.`
  if (part?.toLowerCase().startsWith(prefix)) part = part.slice(prefix.length)
  part ||= inline
  const rel = `${lib.dir}/${lib.file(kebab(name))}`
  const file = join(root, rel)
  if (!existsSync(file)) {
    const pages = existsSync(join(root, lib.dir))
      ? readdirSync(join(root, lib.dir)).filter((f) => f.endsWith('.md'))
      : []
    return { error: `${lib.package} ${version} has no ${rel}. Its pages: ${pages.join(', ')}` }
  }
  const all = sections(readFileSync(file, 'utf8'))
  const { parts, chosen } = library === 'base-ui' ? baseUi(all, part) : mui(all, part)
  if (!chosen.length)
    return {
      error: `${rel} has no API reference${part ? ` for ${part}` : ''}. It has: ${parts.map((s) => s.heading).join(', ')}`,
    }
  // Tables pad every cell to the widest one; the padding is most of a page's size.
  const tight = chosen
    .map((s) => s.text)
    .join('\n\n')
    .replace(/^\|.*\|$/gm, (row) => row.replace(/ {2,}/g, ' ').replace(/-{4,}/g, '---'))
  return { text: `${lib.package} ${version}, ${rel}\n\n${tight}` }
}
