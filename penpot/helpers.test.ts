import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  codeMapProblems,
  readBackProblems,
  tokenNames,
  type ReadBack,
} from '../scripts/checks/penpot.ts'

const here = dirname(fileURLToPath(import.meta.url))
const tokens = tokenNames()

type Fake = Record<string, unknown>
interface Helpers {
  bind(shape: Fake, property: string, tokenName: string): { name: string }
  sha256(bytes: Uint8Array): string
  readBack(container: Fake): Promise<ReadBack>
}

/** Runs helpers.js the way execute_code does, against a fake `penpot` that knows Perron's tokens. */
function install(): Helpers {
  const storage = {}
  const penpot = { currentFile: { id: 'file' }, currentPage: { name: 'Components/Chip' } }
  const penpotUtils = { findTokenByName: (name: string) => (tokens.has(name) ? { name } : null) }
  const source = readFileSync(join(here, 'helpers.js'), 'utf8')
  new Function('penpot', 'penpotUtils', 'storage', source)(penpot, penpotUtils, storage)
  return storage as Helpers
}

/** A shape that records the tokens bound to it, as Penpot's `applyToken` does. */
function shape(props: Fake = {}) {
  const s: Fake & { tokens: Record<string, string> } = {
    type: 'rect',
    id: 'id',
    width: 10,
    height: 10,
    fills: [],
    strokes: [],
    tokens: {},
    ...props,
  }
  s.applyToken = (token: { name: string }, properties: string[]) => {
    for (const p of properties) s.tokens[p] = token.name
  }
  return s
}

describe('bind', () => {
  it('binds a token to a property', () => {
    const s = shape()
    install().bind(s, 'fill', 'color.text.primary')
    expect(s.tokens).toEqual({ fill: 'color.text.primary' })
  })

  it('binds padding, radius and gap on every side', () => {
    const s = shape()
    const { bind } = install()
    bind(s, 'padding', 'space.200')
    bind(s, 'radius', 'radius.md')
    bind(s, 'gap', 'space.100')
    expect(Object.keys(s.tokens)).toHaveLength(10)
    expect(s.tokens.paddingLeft).toBe('space.200')
    expect(s.tokens.borderRadiusBottomRight).toBe('radius.md')
    expect(s.tokens.columnGap).toBe('space.100')
  })

  it('throws on a token that does not exist', () => {
    expect(() => install().bind(shape(), 'fill', 'color.text.nope')).toThrow(
      /No token named color\.text\.nope/,
    )
  })
})

describe('sha256', () => {
  it.each(['', 'abc', 'x'.repeat(1000)])('matches node:crypto for %#', (text) => {
    const bytes = new TextEncoder().encode(text)
    expect(install().sha256(bytes)).toBe(createHash('sha256').update(bytes).digest('hex'))
  })
})

describe('readBack', () => {
  /** A Chip with one `selected` property: a flex board holding a label. */
  function chip(selected: string, fill: string) {
    const main = shape({
      type: 'board',
      name: 'Chip',
      flex: {
        dir: 'row',
        wrap: 'nowrap',
        alignItems: 'center',
        justifyContent: 'start',
        rowGap: 0,
        columnGap: 0,
        topPadding: 4,
        rightPadding: 8,
        bottomPadding: 4,
        leftPadding: 8,
        horizontalSizing: 'auto',
        verticalSizing: 'auto',
      },
      fills: [{ fillColor: '#ffffff' }],
      borderRadiusTopLeft: 4,
      borderRadiusTopRight: 4,
      borderRadiusBottomRight: 4,
      borderRadiusBottomLeft: 4,
      // Like Penpot's, each SVG export carries a fresh render id
      export: async ({ type }: { type: string }) =>
        new TextEncoder().encode(`${type} ${selected} <g id="strokes-${crypto.randomUUID()}">`),
    })
    const label = shape({
      type: 'text',
      name: 'label',
      characters: 'Chip',
      fills: [{ fillColor: '#12181B', fillOpacity: 0.05 }],
      parent: main,
      layoutChild: { horizontalSizing: 'auto', verticalSizing: 'auto', absolute: false },
    })
    main.children = [label]
    const { bind } = install()
    bind(main, 'fill', fill)
    bind(main, 'padding', 'space.100')
    bind(main, 'radius', 'radius.sm')
    bind(label, 'fill', 'color.text.primary')
    return { id: `c-${selected}`, variantProps: { selected }, mainInstance: () => main }
  }

  const container = {
    id: 'container',
    name: 'Chip',
    isVariantContainer: () => true,
    variants: {
      properties: ['selected'],
      variantComponents: () => [
        chip('false', 'color.surface.default'),
        chip('true', 'color.surface.selected'),
      ],
    },
  }

  it('hashes an unchanged SVG the same on every export', async () => {
    const [a, b] = [await install().readBack(container), await install().readBack(container)]
    expect(a.variants[0].exports.svg).toBe(b.variants[0].exports.svg)
    expect(a.variants[0].exports.svg).not.toBe(a.variants[1].exports.svg)
  })

  it('writes the format the penpot check reads', async () => {
    const design = await install().readBack(container)
    expect(design).toMatchObject({
      component: 'Chip',
      page: 'Components/Chip',
      fileId: 'file',
      containerId: 'container',
      properties: { selected: ['false', 'true'] },
    })
    const [first] = design.variants
    expect(first.componentId).toBe('c-false')
    expect(first.exports.png).toMatch(/^[0-9a-f]{64}$/)
    expect(first.root).toMatchObject({
      name: 'root',
      layout: { type: 'flex', padding: [4, 8, 4, 8] },
      radius: [4, 4, 4, 4],
      fills: ['#ffffff'],
    })
    expect(first.root.children?.[0]).toMatchObject({
      name: 'label',
      text: 'Chip',
      fills: ['#12181b0d'],
      size: { horizontal: 'auto', vertical: 'auto' },
    })
  })

  it('reads back a design drawn with bind that passes the check', async () => {
    const design = await install().readBack(container)
    const map = {
      component: 'Chip',
      properties: { selected: { prop: 'selected', values: { false: false, true: true } } },
      layers: { root: 'root', label: 'label' },
    }
    expect(readBackProblems('chip.json', design, tokens)).toEqual([])
    expect(codeMapProblems('chip.code-map.json', design, map)).toEqual([])
  })
})
