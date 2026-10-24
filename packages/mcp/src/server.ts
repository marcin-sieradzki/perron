// The Perron MCP server: tokens and docs from the data @mylder/perron ships, and the API reference
// of the Base UI and MUI versions installed in the project.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { searchDocs, type DocPage } from './docs.ts'
import { getReference, LIBRARIES, type Library } from './reference.ts'
import { listTokens, type TokenEntry } from './tokens.ts'

const require = createRequire(import.meta.url)
const data = <T>(name: string): T =>
  JSON.parse(readFileSync(require.resolve(`@mylder/perron/data/${name}.json`), 'utf8'))
const version = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  .version as string

const text = (t: string) => ({ content: [{ type: 'text' as const, text: t }] })
const error = (t: string) => ({ ...text(t), isError: true })

export interface Options {
  /** Where the project's node_modules are found from, for get_reference */
  cwd?: string
}

export function createServer({ cwd = process.cwd() }: Options = {}) {
  const tokens = data<TokenEntry[]>('tokens')
  const pages = data<DocPage[]>('docs')
  const server = new McpServer({ name: 'perron', version })

  server.registerTool(
    'list_tokens',
    {
      title: 'List Perron tokens',
      description:
        "Perron's design tokens: name, type, CSS custom property, value in each theme (light, dark), the token it aliases, reduced-motion overrides and what it is for. Filter by words in the name or description, such as `surface warning`, and by type, such as `color`.",
      inputSchema: {
        query: z
          .string()
          .optional()
          .describe('Words that must all appear in the name or description'),
        type: z
          .string()
          .optional()
          .describe('A DTCG type: color, dimension, duration, typography…'),
      },
      annotations: { readOnlyHint: true },
    },
    ({ query, type }) => {
      const found = listTokens(tokens, query, type)
      if (!found.length)
        return error(
          `No token matches${query ? ` "${query}"` : ''}${type ? ` of type ${type}` : ''}.`,
        )
      return text(JSON.stringify(found, null, 1))
    },
  )

  server.registerTool(
    'search_docs',
    {
      title: 'Search Perron docs',
      description:
        "Search Perron's foundation pages (colour, type, space, icons, motion, data states, the map…), content design (the words Mylder shows) and the glossary. Returns the best matching sections in full.",
      inputSchema: {
        query: z.string().describe('What to look for, such as `reduced motion` or `delay wording`'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(10)
          .optional()
          .describe('Sections to return, 3 by default'),
      },
      annotations: { readOnlyHint: true },
    },
    ({ query, limit }) => {
      const hits = searchDocs(pages, query, limit)
      if (!hits.length) return error(`No section matches "${query}".`)
      return text(hits.map((h) => `From ${h.page} (${h.path}):\n\n${h.text}`).join('\n\n---\n\n'))
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
      },
      annotations: { readOnlyHint: true },
    },
    ({ library, component, part }) => {
      const result = getReference(cwd, library, component, part)
      return 'error' in result ? error(result.error) : text(result.text)
    },
  )

  return server
}
