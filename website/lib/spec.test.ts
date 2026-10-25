import { describe, expect, it } from 'vitest'
import { getReference } from '../../packages/mcp/src/reference.ts'
import { readApi, readComponentApi } from './api.ts'
import { entryByName, readEntries, type RegistryEntry } from './registry.ts'
import { readRepoFile, repoRoot } from './repo.ts'
import {
  PROSE_SECTIONS,
  agentCalls,
  cellProps,
  importLine,
  propRows,
  sizeSpecs,
  specIntro,
  specPropsTable,
  specSections,
  stateMatrix,
  stateStyles,
  storybookUrl,
  unionValues,
} from './spec.ts'

const BUTTON_SPEC = readRepoFile('docs/components/button.md')
const BUTTON_CSS = readRepoFile('packages/perron/src/components/Button/Button.css')
const BASE_CSS = readRepoFile('packages/perron/styles/base.css')
const css = (name: string, folder = 'components') =>
  readRepoFile(`packages/perron/src/${folder}/${name}/${name}.css`)

describe('propRows', () => {
  it("gives Button's props table api.json's props, row for row", () => {
    const api = readComponentApi('Button')!
    const rows = propRows(api, specPropsTable(BUTTON_SPEC, 'Button'))
    expect(rows.map((r) => r.name).sort()).toEqual(Object.keys(api.props).sort())
    for (const row of rows) expect(row.required).toBe(!api.props[row.name].optional)
  })

  it("orders Button's rows and writes their types as its spec does", () => {
    const rows = propRows(readComponentApi('Button')!, specPropsTable(BUTTON_SPEC, 'Button'))
    expect(rows.slice(0, 3).map((r) => r.name)).toEqual(['variant', 'color', 'size'])
    expect(rows[0]).toMatchObject({ type: "'solid' | 'outline'", default: "`'solid'`" })
    expect(rows.find((r) => r.name === 'startIcon')).toMatchObject({
      type: 'ReactNode',
      default: '',
    })
    expect(rows.find((r) => r.name === 'ref')?.description).toMatch(/Reaches the root/)
  })

  it('reads the table of a part when the spec has one per part', () => {
    const md = readRepoFile('docs/components/segmented-control.md')
    const names = specPropsTable(md, 'SegmentedControl').flatMap((r) => r.names)
    expect(names).toContain('defaultValue')
    expect(names).not.toContain('pressed')
  })

  it('builds a row for every prop of every released entry with a spec page', () => {
    const api = readApi()
    const entries = readEntries().filter((x) => x.hasSpec && api[x.name])
    const rowNames = (name: string, path: string) =>
      propRows(api[name], specPropsTable(readRepoFile(path), name))
        .map((r) => r.name)
        .sort()
    expect(Object.fromEntries(entries.map((e) => [e.name, rowNames(e.name, e.specPath)]))).toEqual(
      Object.fromEntries(entries.map((e) => [e.name, Object.keys(api[e.name].props).sort()])),
    )
  })
})

describe('the spec prose', () => {
  it("takes Button's intro up to its run notes, and the sections its docs page shows", () => {
    const intro = specIntro(BUTTON_SPEC)
    expect(intro.lead).toMatch(/^A button that runs one action/)
    expect(intro.lead).not.toMatch(/deferred/)
    const sections = specSections(BUTTON_SPEC, PROSE_SECTIONS)
    expect(sections.map((s) => s.heading)).toEqual([...PROSE_SECTIONS])
    expect(sections[0].markdown).toMatch(/^## Keyboard and ARIA/)
  })
})

describe('the matrix', () => {
  it("crosses Button's variants and colours, in its spec's order, by every state", () => {
    const api = readComponentApi('Button')!
    const spec = specPropsTable(BUTTON_SPEC, 'Button')
    expect(unionValues(api, 'variant', spec)).toEqual(['solid', 'outline'])
    const matrix = stateMatrix(api, spec, { forceable: true })!
    expect(matrix.rows.map((r) => r.label)).toEqual([
      'Solid · neutral',
      'Solid · brand',
      'Outline · neutral',
      'Outline · brand',
    ])
    expect(matrix.states).toEqual(['rest', 'hover', 'pressed', 'focus', 'disabled'])
    expect(cellProps(matrix.rows[1], 'hover')).toEqual({
      variant: 'solid',
      color: 'brand',
      'data-site-state': 'hover',
    })
    expect(cellProps(matrix.rows[0], 'disabled')).toMatchObject({ disabled: true })
  })

  it('shows rest and disabled only when the states cannot be forced', () => {
    const api = readComponentApi('Button')!
    const matrix = stateMatrix(api, [], { forceable: false })!
    expect(matrix.states).toEqual(['rest', 'disabled'])
  })
})

describe('stateStyles', () => {
  const styles = stateStyles(BUTTON_CSS, [BASE_CSS], 'pn-Button', '.spec-states')

  it("rewrites Button's hover, pressed and focus rules to the cell's attribute", () => {
    expect(styles.forceable).toBe(true)
    expect(styles.styled).toBe(true)
    expect(styles.css).not.toMatch(/:hover|:active|:focus-visible/)
    expect(styles.css).toContain(
      `.spec-states .pn-Button[data-variant='solid'][data-color='neutral'][data-site-state="hover"]:not([data-disabled])`,
    )
    expect(styles.css).toMatch(
      /\[data-site-state="pressed"\][^{]*\{\s*background-color: var\(--perron-color-surface-inverse-pressed\)/,
    )
    expect(styles.css).toMatch(/\.spec-states \[data-site-state="focus"\] \{\s*outline:/)
  })

  it('leaves hover out of its (hover: hover) query and drops the forced-colours reset', () => {
    expect(styles.css).not.toMatch(/@media/)
    expect(styles.css).not.toMatch(/GrayText/)
  })

  it("can't force a state set only on a component's inner parts", () => {
    const tabs = stateStyles(css('Tabs'), [BASE_CSS], 'pn-Tabs', '.s')
    expect(tabs).toMatchObject({ forceable: false, styled: true })
    const tag = stateStyles(css('Tag'), [BASE_CSS], 'pn-Tag', '.s')
    expect(tag).toMatchObject({ forceable: false, styled: false })
  })
})

describe('sizeSpecs', () => {
  it("gives each of Button's sizes the token its stylesheet sets", () => {
    expect(sizeSpecs(BUTTON_CSS, 'Button', ['small', 'medium'], 'medium')).toEqual([
      { value: 'small', token: 'size.button-sm', measure: '30 px' },
      { value: 'medium', token: 'size.button', measure: '36 px' },
    ])
  })
})

describe('the install strip and links', () => {
  it('imports a component from the package and a pattern from /patterns', () => {
    expect(importLine(entryByName('Button')!)).toBe("import { Button } from '@mylder/perron'")
    expect(importLine(entryByName('DetailPanel')!)).toBe(
      "import { DetailPanel } from '@mylder/perron/patterns'",
    )
  })

  it('asks get_reference for each Base UI component it builds on, as the server answers', () => {
    expect(agentCalls(entryByName('Button')!)).toEqual([
      'get_reference({ library: "base-ui", component: "Button" })',
    ])
    expect(agentCalls(entryByName('DetailPanel')!)).toEqual([
      'search_docs({ query: "DetailPanel" })',
    ])
    const asked = (e: RegistryEntry) =>
      agentCalls(e).flatMap((c) => /component: "(\w+)"/.exec(c)?.[1] ?? [])
    const answered = (e: RegistryEntry) =>
      [...new Set(e.baseUiParts.map((p) => p.split('.')[0]))].filter(
        (c) => !('error' in getReference(repoRoot(), 'base-ui', c)),
      )
    const by = (f: (e: RegistryEntry) => string[]) =>
      Object.fromEntries(readEntries().map((e) => [e.name, f(e)]))
    expect(by(asked)).toEqual(by(answered))
  })

  it("links to the entry's docs page in the published Storybook", () => {
    expect(storybookUrl(entryByName('Button')!)).toBe(
      'https://marcin-sieradzki.github.io/perron/storybook/?path=/docs/components-button--docs',
    )
  })
})
