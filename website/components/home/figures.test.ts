import { beforeAll, describe, expect, it } from 'vitest'
import { loadTools, readSetup } from '../../lib/mcp.ts'
import { statusCounts } from '../../lib/registry.ts'
import { readTokenData } from '../../lib/tokens.ts'
import { readDataStates, readHomeFigures, routeOf, type HomeFigures } from './figures.ts'

describe('readHomeFigures', () => {
  let figures: HomeFigures
  beforeAll(async () => {
    figures = await readHomeFigures()
  })

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
    expect(figures.dataStates[0].means).toBe('A GPS report younger than the live threshold')
  })

  it('reads the languages, the lines, the themes and the versions', () => {
    expect(figures.languages).toEqual(['en', 'da', 'sv', 'nb'])
    expect(figures.lines).toContain('m1')
    expect(figures.lines).not.toContain('bus')
    expect(figures.themes).toEqual(['light', 'dark'])
    expect(figures.specVersion).toMatch(/^\d{4}\.\d{2}$/)
    expect(figures.baseUi).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it("takes the MCP server's tools and command from the server and its readme", async () => {
    expect(figures.tools).toEqual((await loadTools()).map((t) => t.name))
    expect(figures.tools).toEqual(expect.arrayContaining(['list_tokens', 'get_reference']))
    expect(figures.mcpCommand).toBe(readSetup().steps[0].code?.text)
  })
})

describe('readDataStates', () => {
  it('reads the State and Means columns of the first table', () => {
    const page =
      '# T\n\nIntro.\n\n| State | Shape | Means |\n| --- | --- | --- |\n| Live | Dot | New |\n\nMore.'
    expect(readDataStates(page)).toEqual([{ name: 'Live', means: 'New' }])
  })

  it('throws for a first table without State and Means', () => {
    expect(() => readDataStates('| A | B |\n| - | - |\n| 1 | 2 |')).toThrow('State or Means')
  })
})

describe('routeOf', () => {
  it('links an entry with a spec page, and nothing else', () => {
    expect(routeOf('LineBadge')).toBe('/components/line-badge')
    expect(routeOf('PerronProvider')).toBeUndefined()
  })
})
