import { describe, expect, it } from 'vitest'
import { readApi, readComponentApi } from './api.ts'
import { readEntries } from './registry.ts'

describe('readApi', () => {
  it('holds the props of every stable entry', () => {
    const api = readApi()
    const stable = readEntries().filter((x) => x.status === 'stable')
    expect(stable.filter((e) => !api[e.name]).map((e) => e.name)).toEqual([])
  })

  it("gives Button's props with their types", () => {
    const button = readComponentApi('Button')!
    expect(button.props.variant).toEqual({ optional: true, type: ['"outline"', '"solid"'] })
  })

  it('gives nothing for an entry in design or a name the registry lacks', () => {
    const designing = readEntries().filter((x) => x.status === 'designing')
    expect(designing.filter((e) => readComponentApi(e.name)).map((e) => e.name)).toEqual([])
    expect(readComponentApi('NoSuchComponent')).toBeUndefined()
  })
})
