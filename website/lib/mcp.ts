// The Agents page's data, from the MCP server itself: at build time the site creates the server
// from packages/mcp/src/server.ts, connects a client through the SDK's in-memory transport, lists
// the tools and calls each one with its example input. Only the examples are written here, so a
// new tool shows on the page without a site change, with its schema and no example yet.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { packageDir } from '../../packages/mcp/src/resolve.ts'
import type { TokenEntry } from '../../packages/mcp/src/tokens.ts'
import { sections, stripTitle } from './markdown.ts'
import { once, readRepoFile, repoRoot } from './repo.ts'

/** The MCP server's readme, which the setup comes from. */
export const MCP_README = 'packages/mcp/README.md'

/**
 * One example input per tool, by tool name: the call the page makes and shows. A tool with none
 * is shown with its schema; a call that stops working fails the unit test.
 */
export const EXAMPLES: Record<string, Record<string, unknown>> = {
  list_tokens: { query: 'surface warning' },
  search_docs: { query: 'reduced motion', limit: 1 },
  get_reference: { library: 'base-ui', component: 'Select', part: 'Positioner' },
}

/** A JSON Schema, as far as the page reads one. */
export interface Schema {
  type?: string
  description?: string
  enum?: unknown[]
  minimum?: number
  maximum?: number
  properties?: Record<string, Schema>
  required?: string[]
}

export interface ToolInput {
  name: string
  /** The type in words, such as `string`, `integer, 1 to 10` or `"base-ui" | "mui"` */
  type: string
  required: boolean
  description?: string
}

export interface ToolCall {
  /** The input the call was made with */
  args: Record<string, unknown>
  /** The call as an agent would write it: `list_tokens({ query: "surface warning" })` */
  shown: string
  /** The server's answer: the text of its content, joined, exactly as it came */
  text: string
  /** Whether the server answered with an error */
  isError: boolean
}

export interface Tool {
  name: string
  title?: string
  description: string
  inputs: ToolInput[]
  /** The input schema as the server lists it */
  schema: Schema
  /** The example call and its answer, or undefined for a tool with no example yet */
  example?: ToolCall
}

/** A client connected to `server` through a linked pair of in-memory transports. */
export async function connect(server: McpServer): Promise<Client> {
  const [serverSide, clientSide] = InMemoryTransport.createLinkedPair()
  await server.connect(serverSide)
  const client = new Client({ name: 'perron-website', version: '0' })
  await client.connect(clientSide)
  return client
}

/** A schema's type in words. */
function typeOf(s: Schema): string {
  if (s.enum) return s.enum.map((v) => JSON.stringify(v)).join(' | ')
  const range =
    s.minimum !== undefined && s.maximum !== undefined
      ? `, ${s.minimum} to ${s.maximum}`
      : s.minimum !== undefined
        ? `, at least ${s.minimum}`
        : s.maximum !== undefined
          ? `, at most ${s.maximum}`
          : ''
  return `${s.type ?? 'any'}${range}`
}

/** A tool's inputs from its schema, in the schema's order. */
export function inputsOf(schema: Schema): ToolInput[] {
  const required = new Set(schema.required ?? [])
  return Object.entries(schema.properties ?? {}).map(([name, s]) => ({
    name,
    type: typeOf(s),
    required: required.has(name),
    ...(s.description ? { description: s.description } : {}),
  }))
}

/** A call as an agent would write it, its input as an object literal. */
export function showCall(name: string, args: Record<string, unknown>) {
  const fields = Object.entries(args).map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
  return `${name}(${fields.length ? `{ ${fields.join(', ')} }` : ''})`
}

/** Calls a tool and returns its answer's text, every text part joined, as the server sent it. */
export async function callTool(
  client: Client,
  name: string,
  args: Record<string, unknown>,
): Promise<ToolCall> {
  const result = await client.callTool({ name, arguments: args })
  const content = (result.content ?? []) as { type: string; text?: string }[]
  const text = content
    .filter((c) => c.type === 'text')
    .map((c) => c.text ?? '')
    .join('\n\n')
  return { args, shown: showCall(name, args), text, isError: Boolean(result.isError) }
}

/** Every tool the client's server lists, each called with its example, in the server's order. */
export async function readTools(client: Client, examples = EXAMPLES): Promise<Tool[]> {
  const { tools } = await client.listTools()
  return Promise.all(
    tools.map(async (t) => {
      const schema = t.inputSchema as Schema
      const args = Object.hasOwn(examples, t.name) ? examples[t.name] : undefined
      return {
        name: t.name,
        ...(t.title ? { title: t.title } : {}),
        description: t.description ?? '',
        inputs: inputsOf(schema),
        schema,
        ...(args ? { example: await callTool(client, t.name, args) } : {}),
      }
    }),
  )
}

/**
 * A module of the MCP server's source, loaded by Node as it is rather than bundled: the server
 * reads its own package.json through `import.meta.url`, which a bundle would point elsewhere, and
 * its readers list folders by paths the bundler would trace the whole repo for.
 */
const serverSource = <T>(file: string): Promise<T> =>
  import(
    /* turbopackIgnore: true */ /* webpackIgnore: true */ /* @vite-ignore */
    pathToFileURL(join(repoRoot(), 'packages/mcp/src', file)).href
  )

/** The Perron server, reading the repo's own data, with a client connected to it. */
export async function connectPerron() {
  const { createServer } =
    await serverSource<typeof import('../../packages/mcp/src/server.ts')>('server.ts')
  return connect(createServer({ cwd: repoRoot() }))
}

/** The Perron server's tools and their example calls, read once per build. */
export const loadTools = once(async () => readTools(await connectPerron()))

export interface Excerpt {
  /** The start of the answer the page shows, whole lines from the top */
  text: string
  /** Lines left out, 0 when the answer is shown whole */
  cutLines: number
  /** Characters left out */
  cutChars: number
}

/**
 * The first `maxLines` lines of an answer, fewer if they pass `maxChars` characters, cut at a line
 * break where there is one, and what was left out. The answer itself is never changed.
 */
export function excerpt(text: string, maxLines = 16, maxChars = 1600): Excerpt {
  const lines = text.split('\n')
  let kept = lines.slice(0, maxLines).join('\n')
  if (kept.length > maxChars) {
    const at = kept.lastIndexOf('\n', maxChars)
    kept = kept.slice(0, at > 0 ? at : maxChars)
  }
  if (kept.length >= text.length) return { text, cutLines: 0, cutChars: 0 }
  const rest = text.slice(kept.length)
  return {
    text: kept,
    // the rest starts with the break after the last kept line, unless a line was split
    cutLines: rest.split('\n').length - (rest.startsWith('\n') ? 1 : 0),
    cutChars: rest.length,
  }
}

/** A token as `list_tokens` answers it, one JSON object a line. */
export type AnswerToken = Pick<TokenEntry, 'name' | 'type' | 'cssVar' | 'values'>

/**
 * The tokens of an answer whose every line is a token as `list_tokens` writes it, so the page can
 * set them as a table; undefined for any other answer.
 */
export function answerTokens(text: string): AnswerToken[] | undefined {
  const lines = text.split('\n').filter((l) => l.trim())
  if (!lines.length) return undefined
  const tokens: AnswerToken[] = []
  for (const line of lines) {
    let t: Partial<TokenEntry>
    try {
      t = JSON.parse(line) as Partial<TokenEntry>
    } catch {
      return undefined
    }
    if (!t.name || !t.type || !t.cssVar || !t.values) return undefined
    tokens.push({ name: t.name, type: t.type, cssVar: t.cssVar, values: t.values })
  }
  return tokens
}

/** A fence's opening or closing line: its run of backticks or tildes, then any info string. */
const FENCE = /^\s{0,3}(`{3,}|~{3,})(.*)$/

/**
 * A markdown answer made fit to render inside a tool's card: character references decoded (a
 * line break, which would end a table row, as a space), headings set below the card's own, and
 * relative links reduced to their words, since they point inside a package's docs. A fenced code
 * block is code, so its lines keep their `#` and their brackets.
 */
export function answerMarkdown(text: string) {
  let fence = ''
  return text
    .replace(/&#x([0-9a-f]+);|&#(\d+);/gi, (_, hex: string, dec: string) => {
      const c = String.fromCodePoint(hex ? Number.parseInt(hex, 16) : Number(dec))
      return /[\n\r]/.test(c) ? ' ' : c
    })
    .split('\n')
    .map((line) => {
      const m = FENCE.exec(line)
      if (!fence && m) fence = m[1]
      else if (fence && m && m[1][0] === fence[0] && m[1].length >= fence.length && !m[2].trim())
        fence = ''
      else if (!fence)
        return line.replace(/^#{1,6} /, '#### ').replace(/\[([^\]]+)\]\((?!https?:)[^)]*\)/g, '$1')
      return line
    })
    .join('\n')
}

export interface Segment {
  /** The prose before the code, as markdown; empty when the code follows another block of code */
  prose: string
  /** The fenced code block that ends the segment, absent for prose after the last one */
  code?: { lang: string; text: string }
}

/**
 * The markdown as runs of prose, each ended by a fenced code block, with any prose after the last
 * fence as a segment of its own: a readme's steps, each with its command.
 */
export function segments(markdown: string): Segment[] {
  const out: Segment[] = []
  let prose: string[] = []
  let code: string[] | undefined
  let fence = ''
  let lang = ''
  for (const line of markdown.split('\n')) {
    const m = /^\s*(`{3,}|~{3,})\s*([\w-]*)/.exec(line)
    if (!code && m) {
      ;[fence, lang] = [m[1], m[2]]
      code = []
    } else if (code && m && m[1].startsWith(fence) && !m[2]) {
      out.push({ prose: prose.join('\n').trim(), code: { lang, text: code.join('\n') } })
      prose = []
      code = undefined
    } else if (code) code.push(line)
    else prose.push(line)
  }
  const rest = prose.join('\n').trim()
  if (rest) out.push({ prose: rest })
  return out
}

/** The part of a readme above its first `##` heading, without its title. */
export function aboveFirstSection(markdown: string) {
  const first = sections(markdown).find((s) => s.level >= 2)
  const top = first ? markdown.slice(0, markdown.indexOf(first.text)) : markdown
  return stripTitle(top)
}

/** The body of the section headed `heading`, without its heading line, or an error. */
export function sectionText(markdown: string, heading: string, path: string) {
  const s = sections(markdown).find((x) => x.heading === heading)
  if (!s) throw new Error(`${path} has no "${heading}" section`)
  return s.text.replace(/^#{1,6} .*\n?/, '').trim()
}

export interface Setup {
  /** The readme's first paragraph: what the server is */
  intro: string
  /** The steps after it, each with its command or config */
  steps: Segment[]
  /** The prose after the last command */
  notes: string
  /** The paragraph under the readme's Tools heading */
  toolsIntro: string
}

/** The setup from the MCP server's readme, the part above its first `##` heading. */
export function parseSetup(readme: string): Setup {
  const [first, ...rest] = segments(aboveFirstSection(readme))
  const [intro, ...lead] = first.prose.split(/\n\s*\n/)
  const steps = [{ prose: lead.join('\n\n'), code: first.code }, ...rest].filter((s) => s.code)
  const last = rest.at(-1)
  const toolsIntro = sectionText(readme, 'Tools', MCP_README).split(/\n\s*\n/)[0]
  return {
    intro: intro.trim(),
    steps,
    notes: last && !last.code ? last.prose : '',
    toolsIntro,
  }
}

/** The MCP server's setup, from its readme. */
export const readSetup = once(() => parseSetup(readRepoFile(MCP_README)))

/** The command that runs the server, as its readme's first shell step writes it. */
export function serverCommand(setup = readSetup()) {
  const command = setup.steps.find((s) => s.code?.lang === 'sh')?.code?.text.trim()
  if (!command) throw new Error(`${MCP_README} has no shell command in its setup`)
  return command
}

export interface Source {
  /** Where the server reads, from the project's folder */
  path: string
  /** The package it belongs to */
  name: string
  /** The installed version, or undefined when the repo doesn't install the package */
  version?: string
  /** The files read there, for a folder of data; empty for a library's folder of docs */
  files: string[]
}

/** An installed package's folder and version, from the repo's node_modules. */
function installed(name: string) {
  const dir = packageDir(name, repoRoot())
  if (!dir) return { version: undefined }
  const { version } = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as {
    version: string
  }
  return { dir, version }
}

/**
 * Where the answers come from: the data `@mylder/perron` ships, which the server reads at start,
 * and the docs bundled in each library, from the server's own table of libraries.
 */
export async function readSources(): Promise<Source[]> {
  const { LIBRARIES } =
    await serverSource<typeof import('../../packages/mcp/src/reference.ts')>('reference.ts')
  const perron = installed('@mylder/perron')
  const data = perron.dir ? join(perron.dir, 'data') : undefined
  return [
    {
      path: 'node_modules/@mylder/perron/data/',
      name: '@mylder/perron',
      version: perron.version,
      files: data && existsSync(data) ? readdirSync(data).filter((f) => f.endsWith('.json')) : [],
    },
    ...Object.values(LIBRARIES).map((l) => ({
      path: `node_modules/${l.package}/${l.dir}/`,
      name: l.package,
      version: installed(l.package).version,
      files: [],
    })),
  ]
}
