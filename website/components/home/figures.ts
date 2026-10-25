// The home page's figures, every one read from the repo at build time: the package's version, the
// registry's counts, the tokens, the data states, the languages, the MCP server's tools and the
// versions Perron is built on. Server-only, like the loaders in lib/.
import { dictionaries, type Locale } from '../../../packages/perron/src/locale/index.ts'
import { entryByName, statusCounts } from '../../lib/registry.ts'
import { once, PACKAGES, readPackage, readRepoFile, readRepoJson } from '../../lib/repo.ts'
import { tokenCount, tokensUnder } from '../../lib/tokens.ts'

/** The page that names the data states, and the table it opens with. */
export const DATA_STATES_PAGE = 'docs/foundations/data-states.md'

/** The MCP server, whose tools are the `registerTool` calls in this file. */
const MCP_SERVER = 'packages/mcp/src/server.ts'

/** The token files' resolver: the spec version they are written to, and the themes. */
const RESOLVER = 'packages/perron/tokens/perron.resolver.json'

const TOOL = /registerTool\(\s*'([a-z_]+)'/g
const LINE_TOKEN = /^color\.transit\.line\.([a-z0-9]+)$/

export interface DataState {
  /** The state's word, as the content-design table writes it: "Timetable only" */
  name: string
  /** What the state means, from the same row */
  means: string
}

/** The five data states, from the first table of the Data states page, in its order. */
export function readDataStates(markdown = readRepoFile(DATA_STATES_PAGE)): DataState[] {
  const lines = markdown.split('\n')
  const start = lines.findIndex((l) => l.startsWith('|'))
  if (start < 0) throw new Error(`${DATA_STATES_PAGE} has no table`)
  const end = lines.findIndex((l, i) => i > start && !l.startsWith('|'))
  const cells = (row: string) =>
    row
      .slice(1, -1)
      .split('|')
      .map((c) => c.trim())
  // the header row names the columns; the separator row under it holds only dashes
  const [head, , ...rows] = lines.slice(start, end < 0 ? undefined : end).map(cells)
  const name = head.indexOf('State')
  const means = head.indexOf('Means')
  if (name < 0 || means < 0) throw new Error(`${DATA_STATES_PAGE}'s table has no State or Means`)
  return rows.map((r) => ({ name: r[name], means: r[means] }))
}

/** The tools the MCP server registers, by name, in the order it registers them. */
export function readTools(source = readRepoFile(MCP_SERVER)): string[] {
  return [...source.matchAll(TOOL)].map((m) => m[1])
}

interface Resolver {
  version: string
  modifiers: { theme: { contexts: Record<string, unknown> } }
}

export interface HomeFigures {
  /** `@mylder/perron`'s version */
  version: string
  /** The MCP server's command, from its package name */
  mcpCommand: string
  /** Entries per layer and status */
  stable: { component: number; pattern: number }
  designing: { component: number; pattern: number }
  /** How many tokens Perron ships */
  tokens: number
  dataStates: DataState[]
  /** The locales Perron speaks, in its dictionaries' order */
  languages: Locale[]
  tools: string[]
  /** The metro and S-tog lines with a colour token of their own: `m1` to `h` */
  lines: string[]
  /** The DTCG format version the token files are written to */
  specVersion: string
  /** The themes the resolver picks between */
  themes: string[]
  /** The versions Perron is built on */
  baseUi: string
  reactMajor: string
}

/** Every figure the home page shows. */
export const readHomeFigures = once((): HomeFigures => {
  const counts = statusCounts()
  const resolver = readRepoJson<Resolver>(RESOLVER)
  const perron = readRepoJson<{ dependencies: Record<string, string> }>(
    `${PACKAGES.perron}/package.json`,
  )
  const react = readRepoJson<{ version: string }>('node_modules/react/package.json')
  return {
    version: readPackage(PACKAGES.perron).version,
    mcpCommand: `npx -y ${readPackage(PACKAGES.mcp).name}`,
    stable: { component: counts.component.stable ?? 0, pattern: counts.pattern.stable ?? 0 },
    designing: {
      component: counts.component.designing ?? 0,
      pattern: counts.pattern.designing ?? 0,
    },
    tokens: tokenCount(),
    dataStates: readDataStates(),
    languages: Object.keys(dictionaries) as Locale[],
    tools: readTools(),
    lines: tokensUnder('color.transit.line.').flatMap((t) => LINE_TOKEN.exec(t.name)?.[1] ?? []),
    specVersion: resolver.version,
    themes: Object.keys(resolver.modifiers.theme.contexts),
    baseUi: perron.dependencies['@base-ui/react'],
    reactMajor: react.version.split('.')[0],
  }
})

/** A registry entry's page, by its name, or undefined when it has none. */
export const routeOf = (name: string) => entryByName(name)?.route ?? undefined
