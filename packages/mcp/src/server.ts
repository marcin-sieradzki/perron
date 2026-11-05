// The Perron MCP server: tokens, docs and components from the data @mylder/perron ships, and the API reference
// of the Base UI and MUI versions installed in the project. The data comes from the project's own
// @mylder/perron when it has one, so the answers match what the app ships, else from the server's.
import { existsSync, readFileSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  findComponent,
  listComponents,
  listed,
  nearestNames,
  type ComponentRecord,
} from './components.ts'
import { searchDocs, type DocPage } from './docs.ts'
import { getReference, LIBRARIES, type Library } from './reference.ts'
import { packageDir } from './resolve.ts'
import { listTokens, type TokenEntry } from './tokens.ts'

const require = createRequire(import.meta.url)
const read = new Map<string, { mtime: number; value: unknown }>()
/** The project's data file `name`, read again whenever it changes, so a rebuilt token shows. */
function data<T>(name: string, cwd: string): T {
  const project = packageDir('@mylder/perron', cwd)
  const own = project && join(project, 'data', `${name}.json`)
  const file = own && existsSync(own) ? own : require.resolve(`@mylder/perron/data/${name}.json`)
  const mtime = statSync(file).mtimeMs
  const cached = read.get(file)
  if (cached?.mtime === mtime) return cached.value as T
  const value = JSON.parse(readFileSync(file, 'utf8')) as T
  read.set(file, { mtime, value })
  return value
}

/** The input every tool takes: the project to read, for an agent working in another checkout. */
const dirInput = z
  .string()
  .optional()
  .describe(
    "The project folder to read from, as an absolute path, such as the git worktree you work in; the server's own project by default",
  )
const version = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  .version as string

const text = (t: string) => ({ content: [{ type: 'text' as const, text: t }] })
const error = (t: string) => ({ ...text(t), isError: true })

export interface Options {
  /** Where the project's node_modules are found from */
  cwd?: string
}

export function createServer({ cwd = process.cwd() }: Options = {}) {
  // read once now, so a project without the data fails at start rather than at the first call
  data<TokenEntry[]>('tokens', cwd)
  data<DocPage[]>('docs', cwd)
  data<ComponentRecord[]>('components', cwd)
  const server = new McpServer({ name: 'perron', version })

  server.registerTool(
    'list_tokens',
    {
      title: 'List Perron tokens',
      description:
        "Perron's design tokens: name, type, CSS custom property, value in each theme (light, dark), the token it aliases, reduced-motion overrides and what it is for. Filter by words in the name, CSS property or description, such as `surface warning`, and by type, such as `color`; with no filter it lists the names only.",
      inputSchema: {
        query: z
          .string()
          .optional()
          .describe('Words that must all appear in the name or description'),
        type: z
          .string()
          .optional()
          .describe('A DTCG type: color, dimension, duration, typography…'),
        dir: dirInput,
      },
      annotations: { readOnlyHint: true },
    },
    ({ query, type, dir }) => {
      const found = listTokens(data<TokenEntry[]>('tokens', dir ?? cwd), query, type)
      // Unfiltered, the whole set is names only: the values of 245 tokens would flood the context.
      if (!query && !type)
        return text(
          `${found.length} tokens. Filter by words or type for their values.\n\n${found.map((t) => `${t.name} (${t.type})`).join('\n')}`,
        )
      if (!found.length)
        return error(
          `No token matches${query ? ` "${query}"` : ''}${type ? ` of type ${type}` : ''}.`,
        )
      return text(found.map((t) => JSON.stringify(t)).join('\n'))
    },
  )

  server.registerTool(
    'search_docs',
    {
      title: 'Search Perron docs',
      description:
        "Search Perron's foundation pages (colour, type, space, icons, motion, data states, the map…), content design (the words Mylder shows), the glossary, and the component contract and spec template. Returns the best matching sections in full.",
      inputSchema: {
        query: z.string().describe('What to look for, such as `reduced motion` or `delay wording`'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(10)
          .optional()
          .describe('Sections to return, 3 by default'),
        dir: dirInput,
      },
      annotations: { readOnlyHint: true },
    },
    ({ query, limit, dir }) => {
      const hits = searchDocs(data<DocPage[]>('docs', dir ?? cwd), query, limit)
      if (!hits.length) return error(`No section matches "${query}".`)
      return text(hits.map((h) => `From ${h.page} (${h.path}):\n\n${h.text}`).join('\n\n---\n\n'))
    },
  )

  server.registerTool(
    'list_components',
    {
      title: 'List Perron components',
      description:
        "Perron's components and patterns, one JSON line each: name, layer, category, status, its successor when deprecated, and what it is in one sentence. Filter by words, such as `a yes or no setting`, which puts the entries that hold the most of them first, and by layer and category, such as `Inputs`. Then ask `get_component` for the one to use.",
      inputSchema: {
        query: z
          .string()
          .optional()
          .describe('Words to look for in the name, the category, the summary and when to use it'),
        layer: z.enum(['component', 'pattern']).optional(),
        category: z
          .string()
          .optional()
          .describe('A category, such as Actions, Inputs or Overlays for a component'),
        dir: dirInput,
      },
      annotations: { readOnlyHint: true },
    },
    ({ query, layer, category, dir }) => {
      const records = data<ComponentRecord[]>('components', dir ?? cwd)
      const found = listComponents(records, query, layer, category)
      if (!found.length)
        return error(
          `No ${layer ?? 'component or pattern'}${category ? ` in ${category}` : ''} matches${query ? ` "${query}"` : ''}.`,
        )
      return text(found.map((r) => JSON.stringify(listed(r))).join('\n'))
    },
  )

  server.registerTool(
    'get_component',
    {
      title: 'Get a Perron component',
      description:
        "Everything a caller needs to use a Perron component or pattern, as JSON: what it is, its import line, when to use it and which entries to use instead, its props with their types, defaults, descriptions and deprecations, the rules of its Do and don't, each with an id such as `DD-2`, a level (`must`, or `should`, which a reason may break) and what checks it (`types`, the compiler, or `review`, nothing but you), the mistakes agents have made with it, and its docs page.",
      inputSchema: {
        name: z.string().describe('The component or pattern, such as `Button` or `DepartureRow`'),
        dir: dirInput,
      },
      annotations: { readOnlyHint: true },
    },
    ({ name, dir }) => {
      const records = data<ComponentRecord[]>('components', dir ?? cwd)
      const record = findComponent(records, name)
      if (!record)
        return error(
          `No component or pattern is named "${name}". The nearest: ${nearestNames(records, name).join(', ')}.`,
        )
      return text(JSON.stringify(record, null, 2))
    },
  )

  server.registerTool(
    'get_reference',
    {
      title: 'Get a Base UI or MUI API reference',
      description:
        'The API reference of a Base UI or MUI component, from the docs bundled in the version installed in this project: props, data attributes, state and types. Name a part, such as `Positioner` for Base UI or `NativeSelect` for MUI, to get only that part.',
      inputSchema: {
        library: z.enum(Object.keys(LIBRARIES) as [Library, ...Library[]]),
        component: z.string().describe('The component, such as `Select` or `TextField`'),
        part: z.string().optional().describe('One part, such as `Positioner`'),
        dir: dirInput,
      },
      annotations: { readOnlyHint: true },
    },
    ({ library, component, part, dir }) => {
      const result = getReference(dir ?? cwd, library, component, part)
      return 'error' in result ? error(result.error) : text(result.text)
    },
  )

  return server
}
