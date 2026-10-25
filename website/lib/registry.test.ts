import { describe, expect, it } from 'vitest'
import {
  byCategory,
  entriesOf,
  entryByName,
  entryBySlug,
  readEntries,
  routedEntries,
  statusCounts,
} from './registry.ts'
import { readRepoJson } from './repo.ts'

describe('readEntries', () => {
  it('lists every registry entry, in its order', () => {
    const raw = readRepoJson<{ name: string }[]>('packages/perron/components.json')
    expect(readEntries().map((e) => e.name)).toEqual(raw.map((e) => e.name))
  })

  it('gives a stable component its slug, spec, route and description', () => {
    const button = entryByName('IconButton')!
    expect(button).toMatchObject({
      slug: 'icon-button',
      specPath: 'docs/components/icon-button.md',
      hasSpec: true,
      route: '/components/icon-button',
      built: true,
    })
    expect(button.description.length).toBeGreaterThan(20)
    expect(button.description).not.toMatch(/\n/)
  })

  it('routes a pattern under /patterns', () => {
    const pattern = entriesOf('pattern').find((e) => e.hasSpec)!
    expect(pattern.route).toBe(`/patterns/${pattern.slug}`)
    expect(entryBySlug('pattern', pattern.slug)).toEqual(pattern)
  })

  it('gives an entry without a spec page no route and no description', () => {
    for (const e of readEntries().filter((x) => !x.hasSpec)) {
      expect(e.route).toBeNull()
      expect(e.description).toBe('')
    }
    expect(routedEntries('component').every((e) => e.hasSpec)).toBe(true)
  })
})

describe('byCategory', () => {
  it('groups entries by category, keeping every entry once', () => {
    const groups = byCategory(entriesOf('component'))
    expect(groups.flatMap((g) => g.entries)).toHaveLength(entriesOf('component').length)
    expect(new Set(groups.map((g) => g.category)).size).toBe(groups.length)
  })
})

describe('statusCounts', () => {
  it('counts every entry once, by layer and status', () => {
    const counts = statusCounts()
    const total = Object.values(counts).flatMap((c) => Object.values(c))
    expect(total.reduce((a, b) => a + b, 0)).toBe(readEntries().length)
    expect(counts.component.stable).toBeGreaterThan(0)
  })
})
