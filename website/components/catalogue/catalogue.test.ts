// The components index's groups against the real registry.
import { describe, expect, it } from 'vitest'
import { byCategory, entriesOf, routedEntries } from '../../lib/registry.ts'
import { catalogueGroups, inCatalogueOrder } from './catalogue.ts'

describe('catalogueGroups', () => {
  const groups = catalogueGroups()
  const components = entriesOf('component')

  it("puts the categories in Components.dc.html's order", () => {
    const mockup = ['Actions', 'Transit', 'Inputs', 'Display', 'Overlays', 'Layout', 'Map']
    const known = groups.map((g) => g.category).filter((c) => mockup.includes(c))
    expect(known).toEqual(mockup.filter((c) => known.includes(c)))
  })

  it('lists every stable component once, in its category, and no other as stable', () => {
    const stable = groups.flatMap((g) => g.stable)
    expect(stable.map((e) => e.name).sort()).toEqual(
      components
        .filter((e) => e.status === 'stable')
        .map((e) => e.name)
        .sort(),
    )
    for (const g of groups) for (const e of g.stable) expect(e.category).toBe(g.category)
  })

  it('names each designing component as in design, never as stable', () => {
    const designing = groups.flatMap((g) => g.designing.map((e) => e.name)).sort()
    expect(designing).toEqual(
      components
        .filter((e) => e.status === 'designing')
        .map((e) => e.name)
        .sort(),
    )
  })

  it('gives each group a unique anchor', () => {
    const ids = groups.map((g) => g.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/)
  })
})

describe('inCatalogueOrder', () => {
  it("orders a spec page's list by category as the index does", () => {
    const index = catalogueGroups().map((g) => g.category)
    const aside = inCatalogueOrder(byCategory(routedEntries('component'))).map((g) => g.category)
    const shared = aside.filter((c) => index.includes(c))
    expect(shared.length).toBeGreaterThan(1)
    expect(shared).toEqual(index.filter((c) => shared.includes(c)))
  })
})
