import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { headingOf } from './pages.ts'
import { buildRegistry, parseRegistry, REGISTRY, registryFiles, specPage } from './registry.ts'
import { syncFiles } from './sync.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const read = (rel: string) => readFileSync(join(root, rel), 'utf8')

const button = {
  name: 'Button',
  layer: 'component',
  category: 'Actions',
  status: 'building',
  baseUiParts: ['Button'],
  penpotPath: 'Components/Button',
  dependsOn: [],
}
const row = {
  name: 'DepartureRow',
  layer: 'pattern',
  category: 'Departures',
  status: 'designing',
  baseUiParts: [],
  penpotPath: 'Patterns/DepartureRow',
  dependsOn: ['Button'],
}

describe('parseRegistry', () => {
  it('takes an empty registry and a valid one', () => {
    expect(parseRegistry([])).toEqual([])
    expect(parseRegistry([button, row])).toEqual([button, row])
  })

  it.each([
    ['a registry that is not a list', { Button: button }, 'must hold a list of entries'],
    ['an unknown field', [{ ...button, colour: 'red' }], 'Button has an unknown field "colour"'],
    [
      'a missing field',
      [{ ...button, penpotPath: undefined }],
      'Button is missing the field "penpotPath"',
    ],
    [
      'a name that is not PascalCase',
      [{ ...button, name: 'button' }],
      '"button" is not PascalCase',
    ],
    [
      'a bad layer',
      [{ ...button, layer: 'widget' }],
      'Button: layer is "widget", not one of component, pattern',
    ],
    [
      'a bad status',
      [{ ...button, status: 'done' }],
      'Button: status is "done", not one of designing, building, stable, deprecated',
    ],
    ['an empty category', [{ ...button, category: '' }], 'Button: category is empty'],
    [
      'a Base UI part that is not one',
      [{ ...button, baseUiParts: ['select-root'] }],
      'Button: "select-root" is not a Base UI part',
    ],
    [
      'a Penpot path outside its layer',
      [{ ...button, penpotPath: 'Patterns/Button' }],
      'Button: penpotPath must start with Components/',
    ],
    ['a duplicate name', [button, button], 'Button is listed twice'],
    [
      'a dependency on no entry',
      [{ ...button, dependsOn: ['Popover'] }],
      'Button depends on Popover, which the registry does not list',
    ],
    [
      'a cycle',
      [
        { ...button, dependsOn: ['Icon'] },
        { ...button, name: 'Icon', penpotPath: 'Components/Icon', dependsOn: ['Button'] },
      ],
      'dependency cycle: Button → Icon → Button',
    ],
    ['a self-dependency', [{ ...button, dependsOn: ['Button'] }], 'cycle: Button → Button'],
    [
      'a pattern with Base UI parts',
      [button, { ...row, baseUiParts: ['Button'] }],
      'DepartureRow is a pattern and lists Base UI parts (Button)',
    ],
    [
      'a component depending on a pattern',
      [
        { ...button, dependsOn: ['DepartureRow'] },
        { ...row, dependsOn: [] },
      ],
      'Button is a component and depends on the pattern DepartureRow',
    ],
  ])('fails on %s', (_, registry, message) => {
    expect(() => parseRegistry(registry)).toThrow(message)
  })

  it('names every problem at once', () => {
    expect(() => parseRegistry([{ ...button, status: 'done', category: '' }])).toThrow(
      /status is "done"[\s\S]*category is empty/,
    )
  })
})

describe('buildRegistry', () => {
  // Actions: Button (deprecated), IconButton (stable); Feedback: Alert (building);
  // Inputs: Select (designing); and the pattern DepartureRow (building)
  const fixture = parseRegistry(JSON.parse(read('scripts/lib/fixtures/registry/components.json')))
  const out = buildRegistry(fixture, read)

  it('exports each component past designing from the main barrel, after the fixed head', () => {
    const index = out['packages/perron/src/index.ts']
    expect(index).toMatch(/^\/\/ [\s\S]*npm run registry/)
    expect(index).toContain(
      "export { PerronProvider, useOwnedStrings } from './PerronProvider.tsx'\n",
    )
    expect(index).toContain(
      "export type { Locale, OwnedStringKey, OwnedStrings } from './locale/index.ts'\n",
    )
    expect(index.split('\n').filter((l) => l.startsWith('export *'))).toEqual([
      "export * from './components/Button/Button.tsx'",
      "export * from './components/IconButton/IconButton.tsx'",
      "export * from './components/Alert/Alert.tsx'",
    ])
  })

  it('exports each pattern past designing from the patterns barrel', () => {
    const patterns = out['packages/perron/src/patterns.ts']
    expect(patterns).toMatch(/^\/\/ [\s\S]*npm run registry/)
    expect(patterns.split('\n').filter((l) => l.startsWith('export'))).toEqual([
      "export * from './patterns/DepartureRow/DepartureRow.tsx'",
    ])
    const empty = buildRegistry([], read)['packages/perron/src/patterns.ts']
    expect(empty.split('\n').filter((l) => l.startsWith('export'))).toEqual(['export {}'])
  })

  it('points the package at both barrels, keeping every other export in place', () => {
    const pkg = JSON.parse(out['packages/perron/package.json'])
    const before = JSON.parse(read('packages/perron/package.json'))
    expect(pkg.exports['.']).toEqual({ types: './dist/index.d.ts', default: './dist/index.js' })
    expect(pkg.exports['./patterns']).toEqual({
      types: './dist/patterns.d.ts',
      default: './dist/patterns.js',
    })
    expect(Object.keys(pkg.exports)).toEqual([
      '.',
      './patterns',
      './perron.css',
      './tokens.css',
      './typography.css',
      './tokens.ts',
      './tokens/*.json',
      './icons/*',
      './logos/*',
      './data/*.json',
    ])
    expect({ ...pkg, exports: undefined }).toEqual({ ...before, exports: undefined })
  })

  // each group at 10 spaces, its titles at 12, as pages.test.ts reads them
  const sidebar = (preview: string) => {
    const order: Record<string, string[]> = {}
    let group = ''
    for (const [, indent, name] of preview.matchAll(/^( {10}| {12})'([^']+)',$/gm))
      if (indent.length === 10) order[(group = name)] = []
      else order[group].push(name)
    return order
  }
  const specPages = (pagesTs: string) => {
    const pages = [...pagesTs.matchAll(/^ {2}'(docs\/[^']+)',$/gm)].map((m) => m[1])
    return pages.slice(pages.indexOf('docs/components/TEMPLATE.md') + 1)
  }

  it('sorts the sidebar by category then name, after the contract pages', () => {
    const order = sidebar(out['.storybook/preview.ts'])
    expect(order.Components).toEqual(['Contract', 'Spec template', 'Button', 'IconButton', 'Alert'])
    expect(order.Patterns).toEqual(['DepartureRow'])
    expect(Object.keys(order).slice(-3)).toEqual(['Components', 'Patterns', 'Specs'])
  })

  it('writes no Patterns or Specs group while no entry is built', () => {
    const order = sidebar(buildRegistry([], read)['.storybook/preview.ts'])
    expect(Object.keys(order).at(-1)).toBe('Components')
  })

  it("titles each spec page apart from its entry's own docs, in the sidebar's Specs order", () => {
    // a spec's heading is its entry's PascalCase name, as TEMPLATE.md says
    const titles = specPages(out['scripts/lib/pages.ts']).map((path) => {
      const entry = fixture.find((e) => specPage(e) === path)!
      const { group, title } = headingOf(path, `# ${entry.name}\n`)
      expect(`${group}/${title}`).not.toBe(
        `${entry.layer === 'component' ? 'Components' : 'Patterns'}/${entry.name}`,
      )
      return `${group}/${title}`
    })
    expect(titles).toEqual([
      'Specs/Button',
      'Specs/IconButton',
      'Specs/Alert',
      'Specs/DepartureRow',
    ])
    expect(sidebar(out['.storybook/preview.ts']).Specs).toEqual(
      titles.map((t) => t.slice('Specs/'.length)),
    )
  })

  it('lists each spec page past designing in PAGES, after the contract pages', () => {
    expect(specPages(out['scripts/lib/pages.ts'])).toEqual([
      'docs/components/button.md',
      'docs/components/icon-button.md',
      'docs/components/alert.md',
      'docs/patterns/departure-row.md',
    ])
  })
})

describe('the drift check', () => {
  it('names each stale file once the registry changes, until the generator runs', () => {
    const copy = mkdtempSync(join(tmpdir(), 'perron-registry-'))
    try {
      for (const rel of [REGISTRY, ...Object.keys(registryFiles(root))])
        cpSync(join(root, rel), join(copy, rel))
      expect(syncFiles(copy, registryFiles(copy), true)).toEqual([])

      const entries = JSON.parse(readFileSync(join(copy, REGISTRY), 'utf8'))
      entries.push({
        name: 'Dummy',
        layer: 'component',
        category: 'Test',
        status: 'building',
        baseUiParts: [],
        penpotPath: 'Components/Dummy',
        dependsOn: [],
      })
      writeFileSync(join(copy, REGISTRY), JSON.stringify(entries))
      expect(syncFiles(copy, registryFiles(copy), true).sort()).toEqual([
        '.storybook/preview.ts',
        'packages/perron/src/index.ts',
        'scripts/lib/pages.ts',
      ])

      expect(syncFiles(copy, registryFiles(copy), false)).toHaveLength(3)
      expect(syncFiles(copy, registryFiles(copy), true)).toEqual([])
      expect(readFileSync(join(copy, 'packages/perron/src/index.ts'), 'utf8')).toContain(
        "export * from './components/Dummy/Dummy.tsx'",
      )
    } finally {
      rmSync(copy, { recursive: true, force: true })
    }
  })
})
