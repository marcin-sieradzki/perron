import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  EXAMPLES,
  callTool,
  connect,
  connectPerron,
  excerpt,
  inputsOf,
  loadTools,
  parseSetup,
  readSetup,
  readSources,
  readTools,
  segments,
  showCall,
} from './mcp.ts'
import { readRepoFile } from './repo.ts'

describe('loadTools', () => {
  it('lists every tool the server registers, in its order', async () => {
    const client = await connectPerron()
    const { tools } = await client.listTools()
    const loaded = await loadTools()
    expect(loaded.map((t) => t.name)).toEqual(tools.map((t) => t.name))
    expect(loaded.length).toBeGreaterThan(0)
  })

  it('shows each answer exactly as the server gives it for the call shown', async () => {
    const client = await connectPerron()
    for (const tool of await loadTools()) {
      if (!tool.example) continue
      const again = await callTool(client, tool.name, tool.example.args)
      expect(tool.example).toEqual(again)
      expect(tool.example.shown).toBe(showCall(tool.name, tool.example.args))
    }
  })

  it('gives every example a tool, and every example an answer that is not an error', async () => {
    const loaded = await loadTools()
    for (const name of Object.keys(EXAMPLES)) {
      const tool = loaded.find((t) => t.name === name)
      expect(tool, `EXAMPLES names ${name}, which the server doesn't register`).toBeDefined()
      expect(tool?.example?.isError, `${name}: ${tool?.example?.text}`).toBe(false)
      expect(tool?.example?.text.length).toBeGreaterThan(0)
    }
  })

  it("reads each tool's name, title, description and inputs from the server", async () => {
    const reference = (await loadTools()).find((t) => t.name === 'get_reference')
    expect(reference?.title).toBeTruthy()
    expect(reference?.description).toMatch(/Base UI/)
    expect(reference?.inputs.find((i) => i.name === 'library')).toEqual({
      name: 'library',
      type: '"base-ui" | "mui"',
      required: true,
    })
  })
})

describe('readTools', () => {
  it('shows a new tool with its schema and no example', async () => {
    const server = new McpServer({ name: 'test', version: '0' })
    server.registerTool(
      'count_lines',
      { description: 'Counts lines.', inputSchema: { text: z.string().describe('The text') } },
      ({ text }) => ({ content: [{ type: 'text', text: String(text.split('\n').length) }] }),
    )
    server.registerTool('echo', { inputSchema: { word: z.string() } }, ({ word }) => ({
      content: [{ type: 'text', text: word }],
    }))
    const tools = await readTools(await connect(server), { echo: { word: 'Nørreport' } })
    expect(tools[0]).toMatchObject({
      name: 'count_lines',
      description: 'Counts lines.',
      inputs: [{ name: 'text', type: 'string', required: true, description: 'The text' }],
      schema: { type: 'object', required: ['text'] },
    })
    expect(tools[0].example).toBeUndefined()
    expect(tools[1].example).toEqual({
      args: { word: 'Nørreport' },
      shown: 'echo({ word: "Nørreport" })',
      text: 'Nørreport',
      isError: false,
    })
  })
})

describe('inputsOf', () => {
  it('writes each type in words, with its range or its choices', () => {
    expect(
      inputsOf({
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 10 },
          from: { type: 'number', minimum: 0 },
          library: { type: 'string', enum: ['base-ui', 'mui'] },
          anything: {},
        },
      }).map((i) => i.type),
    ).toEqual(['integer, 1 to 10', 'number, at least 0', '"base-ui" | "mui"', 'any'])
  })
})

describe('showCall', () => {
  it('writes the input as an object literal', () => {
    expect(showCall('search_docs', { query: 'reduced motion', limit: 1 })).toBe(
      'search_docs({ query: "reduced motion", limit: 1 })',
    )
    expect(showCall('ping', {})).toBe('ping()')
  })
})

describe('excerpt', () => {
  it('keeps a short answer whole', () => {
    expect(excerpt('a\nb', 5)).toEqual({ text: 'a\nb', cutLines: 0, cutChars: 0 })
  })

  it('keeps whole lines from the top and counts what it leaves out', () => {
    const text = ['one', 'two', 'three', 'four'].join('\n')
    const cut = excerpt(text, 2)
    expect(cut).toEqual({ text: 'one\ntwo', cutLines: 2, cutChars: '\nthree\nfour'.length })
    expect(text.startsWith(cut.text)).toBe(true)
    expect(cut.text.length + cut.cutChars).toBe(text.length)
  })

  it('stops at a line break before the character limit', () => {
    const cut = excerpt('aaaa\nbbbb\ncccc', 10, 7)
    expect(cut.text).toBe('aaaa')
    expect(cut.cutLines).toBe(2)
  })

  it('splits a single long line at the character limit', () => {
    const cut = excerpt('x'.repeat(30), 10, 10)
    expect(cut).toEqual({ text: 'x'.repeat(10), cutLines: 1, cutChars: 20 })
  })
})

describe('segments', () => {
  it('splits markdown into prose, each run ended by its code', () => {
    const md = 'Install it.\n\n```sh\nnpm i x\n```\n\nThen:\n\n~~~json\n{ "a": 1 }\n~~~\n\nDone.'
    expect(segments(md)).toEqual([
      { prose: 'Install it.', code: { lang: 'sh', text: 'npm i x' } },
      { prose: 'Then:', code: { lang: 'json', text: '{ "a": 1 }' } },
      { prose: 'Done.' },
    ])
  })
})

describe('readSetup', () => {
  it("reads the command and the .mcp.json entry from the server's readme", () => {
    const setup = readSetup()
    expect(setup.intro).toMatch(/^The Perron MCP server/)
    expect(setup.steps.map((s) => s.code?.lang)).toEqual(['sh', 'json'])
    expect(setup.steps[0].code?.text).toBe('npx @mylder/perron-mcp')
    expect(JSON.parse(setup.steps[1].code?.text ?? '')).toHaveProperty('mcpServers.perron')
    expect(setup.notes).toMatch(/@mylder\/perron/)
    expect(setup.toolsIntro).toMatch(/`dir`/)
  })

  it('throws for a readme with no Tools section', () => {
    expect(() => parseSetup('# x\n\nA server.\n\n```sh\nnpx x\n```\n')).toThrow('"Tools"')
  })

  it('keeps every line of the readme it shows', () => {
    const readme = readRepoFile('packages/mcp/README.md')
    const setup = readSetup()
    for (const piece of [setup.intro, setup.notes, ...setup.steps.map((s) => s.code?.text ?? '')])
      expect(readme).toContain(piece)
  })
})

describe('readSources', () => {
  it('names the data and each library the server reads, at their installed versions', async () => {
    const [data, ...libraries] = await readSources()
    expect(data.files).toEqual(expect.arrayContaining(['tokens.json', 'docs.json']))
    expect(data.version).toMatch(/^\d+\.\d+\.\d+/)
    expect(libraries.map((l) => l.name)).toEqual(['@base-ui/react', '@mui/material'])
    for (const l of libraries) expect(l.version).toMatch(/^\d+\.\d+\.\d+/)
  })
})
