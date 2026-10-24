import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import check, { propsProblems, readPropRules } from './props.ts'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '../..')
const fixture = (name: string) => `scripts/checks/fixtures/props/${name}.tsx`

const FAILING: [string, RegExp, number][] = [
  ['Variant', /variant is a union of string literals/, 1],
  ['Color', /color takes only the intents.*'primary'/, 1],
  ['Size', /size takes only small, medium, large.*'sm'/, 1],
  ['BooleanPrefix', /(isOpen|hasIcon|shouldWrap) is a boolean with is, has or should/, 3],
  ['Banned', /(sx|as|leftIcon) is not a prop of any component/, 3],
  ['Inherited', /(onValueChange|onOpenChange) is not a prop of any component/, 2],
  ['Events', /(onChange|onOpen|onClose) is (onChange|onOpen|onClose)\(/, 3],
  [
    'Types',
    /(disabled|open) is a boolean|startIcon is a ReactNode|(name|closeLabel) is a string/,
    5,
  ],
  ['Undocumented', /(label|hint) has no JSDoc comment/, 2],
  ['Render', /render is Base UI's: inherit it/, 1],
  ['Parts', /isActive is a boolean with is, has or should/, 1],
  ['Unexported', /exports no UnexportedProps/, 1],
]

describe('props', () => {
  it("reads the intents, sizes and other libraries' names from the contract's tables", () => {
    const rules = readPropRules(readFileSync(join(root, 'docs/components/README.md'), 'utf8'))
    expect(rules.intents).toEqual(['neutral', 'brand', 'success', 'warning', 'danger', 'info'])
    expect(rules.sizes).toEqual(['small', 'medium', 'large'])
    expect(rules.banned).toEqual({
      sx: 'className, the data attributes and the tokens',
      classes: 'className, the data attributes and the tokens',
      styled: 'className, the data attributes and the tokens',
      component: 'render',
      as: 'render',
      theme: 'the tokens, which carry both themes',
      state: "CSS states: pseudo-classes and Base UI's data attributes",
      onValueChange: 'onChange(event, value, details)',
      onOpenChange: 'onOpen(event, details) and onClose(event, reason, details)',
      leftIcon: 'startIcon',
      rightIcon: 'endIcon',
    })
  })

  // One program for every fixture, as the real run builds one for every component.
  const problems = propsProblems(
    root,
    [...FAILING.map(([name]) => name), 'Passes', 'NativeText', 'Allowed'].map(fixture),
  )
  const of = (name: string) => problems.filter((p) => p.file === fixture(name))

  it.each(FAILING)('fails %s', (name, message, count) => {
    expect(of(name)).toHaveLength(count)
    for (const p of of(name)) {
      expect(p.message).toMatch(message)
      expect(p.line).toBeGreaterThan(0)
    }
  })

  it('passes props written to the vocabulary', () => {
    expect(of('Passes')).toEqual([])
    expect(of('NativeText')).toEqual([])
  })

  it('takes a perron-allow exemption', () => {
    expect(of('Allowed')).toEqual([])
  })

  it('passes the real tree', async () => {
    expect(await check.run(root)).toEqual([])
  })
})
