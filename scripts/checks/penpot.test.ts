import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import check, { designProblems, tokenNames } from './penpot.ts'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '../..')
/** The problems of one fixture folder, read as if it were `penpot/`. */
const lint = (fixture: string) => designProblems(root, `scripts/checks/fixtures/penpot/${fixture}`)

describe('penpot', () => {
  it('passes a design whose values are all bound and mapped', () => {
    expect(lint('passes')).toEqual([])
  })

  it('passes a scratch component drawn in Penpot with penpot/helpers.js and read back', () => {
    expect(lint('scratch')).toEqual([])
  })

  it('fails an unbound fill', () => {
    const problems = lint('unbound-fill')
    expect(problems).toHaveLength(1)
    expect(problems[0].message).toMatch(
      /variant=solid, State=default › root › label .*unbound fill/,
    )
  })

  it('fails an unbound stroke, radius, padding and gap', () => {
    const messages = lint('unbound-values').map((p) => p.message)
    expect(messages).toEqual([
      expect.stringMatching(/unbound stroke colour/),
      expect.stringMatching(/unbound stroke width/),
      expect.stringMatching(/unbound borderRadiusTopLeft/),
      expect.stringMatching(/unbound paddingLeft/),
      expect.stringMatching(/unbound columnGap/),
    ])
  })

  it('fails a token name that is not in tokens/', () => {
    const problems = lint('unknown-token')
    expect(problems).toHaveLength(1)
    expect(problems[0].message).toMatch(/color\.surface\.nope, which is not a token/)
  })

  it('fails a code map missing a variant value or a named layer', () => {
    const problems = lint('unmapped')
    expect(problems.map((p) => p.message)).toEqual([
      'maps nothing for State=hover',
      'maps no part for the layer label',
    ])
    expect(problems[0].file).toBe('scripts/checks/fixtures/penpot/unmapped/button.code-map.json')
  })

  it('fails interaction states mapped to a prop', () => {
    expect(lint('state-prop').map((p) => p.message)).toEqual([
      'maps State to the prop state; interaction states map to CSS states',
    ])
  })

  it("fails another component's code map", () => {
    expect(lint('other-component').map((p) => p.message)).toEqual([
      'maps Chip, but the design is Button',
    ])
  })

  it('fails a code map missing a property', () => {
    expect(lint('unmapped-property').map((p) => p.message)).toEqual([
      'maps no prop or state for the property State',
    ])
  })

  it('fails a design without a code map', () => {
    expect(lint('no-code-map')).toEqual([
      {
        file: 'scripts/checks/fixtures/penpot/no-code-map/button.code-map.json',
        message: 'Button has no code map',
      },
    ])
  })

  it('knows base and theme tokens', () => {
    const names = tokenNames()
    expect(names.has('space.200')).toBe(true)
    expect(names.has('color.text.primary')).toBe(true)
  })

  it('passes the real tree', async () => {
    expect(await check.run(root)).toEqual([])
  })
})
