// The home page's figures, every one read from the repo at build time: the package's version, the
// registry's counts, the tokens, the data states, the languages, the MCP server's tools and command,
// and the versions Perron is built on. Server-only, like the loaders in lib/; the tools and the
// command come through lib/mcp.ts, as the Agents and Get started pages read them.
import { dictionaries, type Locale } from '../../../packages/perron/src/locale/index.ts'
import { firstTable } from '../../lib/markdown.ts'
import { loadTools, serverCommand } from '../../lib/mcp.ts'
import { entryByName, statusCounts } from '../../lib/registry.ts'
import { once, PACKAGES, readPackage, readRepoFile, readRepoJson } from '../../lib/repo.ts'
import { tokenCount, tokensUnder } from '../../lib/tokens.ts'

/** The page that names the data states, and the table it opens with. */
export const DATA_STATES_PAGE = 'docs/foundations/data-states.md'

/** The token files' resolver: the spec version they are written to, and the themes. */
const RESOLVER = 'packages/perron/tokens/perron.resolver.json'

const LINE_TOKEN = /^color\.transit\.line\.([a-z0-9]+)$/

export interface DataState {
  /** The state's word, as the content-design table writes it: "Timetable only" */
  name: string
  /** What the state means, from the same row */
  means: string
}

/** The five data states, from the first table of the Data states page, in its order. */
export function readDataStates(markdown = readRepoFile(DATA_STATES_PAGE)): DataState[] {
  const { head, rows } = firstTable(markdown)
  if (!head.includes('State') || !head.includes('Means'))
    throw new Error(`${DATA_STATES_PAGE}'s first table has no State or Means`)
  return rows.map((r) => ({ name: r.State, means: r.Means }))
}

interface Resolver {
  version: string
  modifiers: { theme: { contexts: Record<string, unknown> } }
}

export interface HomeFigures {
  /** `@mylder/perron`'s version */
  version: string
  /** The command that runs the MCP server, as its readme writes it */
  mcpCommand: string
  /** Entries per layer and status */
  stable: { component: number; pattern: number }
  designing: { component: number; pattern: number }
  /** How many tokens Perron ships */
  tokens: number
  dataStates: DataState[]
  /** The locales Perron speaks, in its dictionaries' order */
  languages: Locale[]
  /** The tools the MCP server lists, by name, in its order */
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
export const readHomeFigures = once(async (): Promise<HomeFigures> => {
  const counts = statusCounts()
  const resolver = readRepoJson<Resolver>(RESOLVER)
  const perron = readRepoJson<{ dependencies: Record<string, string> }>(
    `${PACKAGES.perron}/package.json`,
  )
  const react = readRepoJson<{ version: string }>('node_modules/react/package.json')
  return {
    version: readPackage(PACKAGES.perron).version,
    mcpCommand: serverCommand(),
    stable: { component: counts.component.stable ?? 0, pattern: counts.pattern.stable ?? 0 },
    designing: {
      component: counts.component.designing ?? 0,
      pattern: counts.pattern.designing ?? 0,
    },
    tokens: tokenCount(),
    dataStates: readDataStates(),
    languages: Object.keys(dictionaries) as Locale[],
    tools: (await loadTools()).map((t) => t.name),
    lines: tokensUnder('color.transit.line.').flatMap((t) => LINE_TOKEN.exec(t.name)?.[1] ?? []),
    specVersion: resolver.version,
    themes: Object.keys(resolver.modifiers.theme.contexts),
    baseUi: perron.dependencies['@base-ui/react'],
    reactMajor: react.version.split('.')[0],
  }
})

/** A registry entry's page, by its name, or undefined when it has none. */
export const routeOf = (name: string) => entryByName(name)?.route ?? undefined
