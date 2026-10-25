import { describe, expect, it } from 'vitest'
import { statusCounts } from '../../lib/registry.ts'
import { readTokenData } from '../../lib/tokens.ts'
import { readDataStates, readHomeFigures, readTools, routeOf } from './figures.ts'

describe('readHomeFigures', () => {
  const figures = readHomeFigures()

  it('counts the registry and the tokens', () => {
    expect(figures.stable.component).toBe(statusCounts().component.stable)
    expect(figures.stable.pattern).toBe(statusCounts().pattern.stable)
    expect(figures.tokens).toBe(readTokenData().length)
  })

  it('reads the five data states, in the Data states page order', () => {
    expect(figures.dataStates.map((s) => s.name)).toEqual([
      'Live',
      'Ageing',
      'Estimated',
      'Timetable only',
      'No signal',
    ])
    expect(figures.dataStates[0].means).toBe('A GPS report under a minute old')
  })

  it('reads the languages, the lines, the themes and the versions', () => {
    expect(figures.languages).toEqual(['en', 'da', 'sv', 'nb'])
    expect(figures.lines).toContain('m1')
    expect(figures.lines).not.toContain('bus')
    expect(figures.themes).toEqual(['light', 'dark'])
    expect(figures.specVersion).toMatch(/^\d{4}\.\d{2}$/)
    expect(figures.baseUi).toMatch(/^\d+\.\d+\.\d+$/)
    expect(figures.mcpCommand).toBe('npx -y @mylder/perron-mcp')
  })
})

describe('readTools', () => {
  it('lists the tools the MCP server registers', () => {
    expect(readTools()).toEqual(expect.arrayContaining(['list_tokens', 'get_reference']))
    expect(readTools("server.registerTool(\n    'one',\n  server.registerTool('two'")).toEqual([
      'one',
      'two',
    ])
  })
})

describe('readDataStates', () => {
  it('reads the State and Means columns of the first table', () => {
    const page =
      '# T\n\nIntro.\n\n| State | Shape | Means |\n| --- | --- | --- |\n| Live | Dot | New |\n\nMore.'
    expect(readDataStates(page)).toEqual([{ name: 'Live', means: 'New' }])
  })
})

describe('routeOf', () => {
  it('links an entry with a spec page, and nothing else', () => {
    expect(routeOf('LineBadge')).toBe('/components/line-badge')
    expect(routeOf('PerronProvider')).toBeUndefined()
  })
})
