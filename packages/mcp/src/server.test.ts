// The server through an MCP client, as an agent meets it: its tools, their answers from the data
// @mylder/perron ships, and the references of the Base UI and MUI versions the repo pins.
import { mkdtempSync, readdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { describe, expect, it } from 'vitest'
import { createServer, type Options } from './server.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..')

async function connect(options: Options = { cwd: root }) {
  const [a, b] = InMemoryTransport.createLinkedPair()
  await createServer(options).connect(a)
  const client = new Client({ name: 'test', version: '0' })
  await client.connect(b)
  return client
}

async function call(name: string, args: Record<string, unknown>, options?: Options) {
  const result = await (await connect(options)).callTool({ name, arguments: args })
  const [first] = result.content as { text: string }[]
  return { text: first.text, isError: Boolean(result.isError) }
}

/** Every Markdown file an agent reads in the repo, outside node_modules and the roadmap. */
function agentDocs(dir = root): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name)
    if (e.isDirectory())
      return ['node_modules', '.git', 'dist'].includes(e.name) ? [] : agentDocs(path)
    return e.name.endsWith('.md') && e.name !== 'ROADMAP.md' ? [path] : []
  })
}

describe('the Perron MCP server', () => {
  it('registers exactly the tools its readme documents', async () => {
    const { tools } = await (await connect()).listTools()
    const readme = readFileSync(join(root, 'packages/mcp/README.md'), 'utf8')
    const documented = [...readme.matchAll(/^### `(\w+)`/gm)].map((m) => m[1])
    expect(tools.map((t) => t.name).sort()).toEqual(documented.sort())
  })

  it('is the only source of the Perron tool names the docs mention', async () => {
    const { tools } = await (await connect()).listTools()
    const names = new Set(tools.map((t) => t.name))
    const mentioned = agentDocs().flatMap((f) =>
      [...readFileSync(f, 'utf8').matchAll(/`((?:list|search|get)_[a-z_]+)/g)].map((m) => m[1]),
    )
    expect(mentioned.length).toBeGreaterThan(0)
    expect(mentioned.filter((n) => !names.has(n))).toEqual([])
  })

  it('answers which token is the warning surface in dark', async () => {
    const { text } = await call('list_tokens', { query: 'surface warning' })
    const [token] = JSON.parse(text)
    expect(token).toMatchObject({
      name: 'color.surface.warning',
      cssVar: '--perron-color-surface-warning',
      values: { dark: { css: '#3F280A', alias: 'palette.orange.900' } },
    })
  })

  it('filters tokens by type, with their reduced-motion values', async () => {
    const found = JSON.parse((await call('list_tokens', { type: 'duration' })).text)
    expect(found.every((t: { type: string }) => t.type === 'duration')).toBe(true)
    expect(found).toContainEqual(
      expect.objectContaining({
        name: 'duration.sheet',
        overrides: { 'Reduced motion': '0.01ms' },
      }),
    )
  })

  it('says so when no token matches', async () => {
    expect(await call('list_tokens', { query: 'no such token' })).toMatchObject({ isError: true })
  })

  it('finds the rule in the docs', async () => {
    const { text } = await call('search_docs', { query: 'reduced motion', limit: 1 })
    expect(text).toMatch(/^From Motion \(docs\/foundations\/motion\.md\):\n\n## /)
  })

  it("answers what props Base UI's Select.Positioner takes, and only that", async () => {
    const { text } = await call('get_reference', {
      library: 'base-ui',
      component: 'Select',
      part: 'Positioner',
    })
    expect(text).toMatch(
      /^@base-ui\/react 1\.9\.0, docs\/react\/components\/select\.md\n\n### Positioner\n/,
    )
    expect(text).toContain('**Positioner Props:**')
    expect(text).toContain('### Positioner.State')
    expect(text).not.toMatch(/^### Popup$/m)
    expect(text).not.toContain('## Demo')
  })

  it('takes a part written into the component name', async () => {
    const dotted = await call('get_reference', {
      library: 'base-ui',
      component: 'Select.Positioner',
    })
    expect(dotted.text).toMatch(/\n\n### Positioner\n/)
  })

  it("gives MUI's API pages for a component, or the one part named", async () => {
    const all = await call('get_reference', { library: 'mui', component: 'Select' })
    expect(all.text).toMatch(/^@mui\/material 9\.5\.0, docs\/material-ui\/react-select\.md\n/)
    expect(all.text).toContain('# NativeSelect API')
    expect(all.text).toContain('# Select API')
    expect(all.text).not.toContain('## Grouping')
    const one = await call('get_reference', { library: 'mui', component: 'Select', part: 'Select' })
    expect(one.text).not.toContain('# NativeSelect API')
  })

  it('names the parts that exist when asked for one that does not', async () => {
    const { text, isError } = await call('get_reference', {
      library: 'base-ui',
      component: 'Select',
      part: 'Nope',
    })
    expect(isError).toBe(true)
    expect(text).toContain('Positioner')
  })

  it('says to install a library it cannot find', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'perron-mcp-'))
    const { text, isError } = await call(
      'get_reference',
      { library: 'mui', component: 'Select' },
      { cwd },
    )
    expect(isError).toBe(true)
    expect(text).toMatch(/@mui\/material is not installed/)
  })
})
