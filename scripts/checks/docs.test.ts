import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import docs from './docs.ts'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => join(here, 'fixtures/docs', name)

describe('docs', () => {
  it('passes a spec page from building on and a docs page from stable on', () => {
    // a stable Button with both, a building DepartureRow with its spec alone, a designing Dialog
    expect(docs.run(fixture('complete'))).toEqual([])
  })

  it('names a building entry without its spec page, and a stable one without its docs page', () => {
    expect(docs.run(fixture('missing'))).toEqual([
      {
        file: 'docs/components/date-picker.md',
        message: 'DatePicker is building and has no spec page; copy docs/components/TEMPLATE.md',
      },
      {
        file: 'packages/perron/src/components/Button/Button.mdx',
        message: 'Button is stable and has no docs page; the component-docs skill writes it',
      },
    ])
  })

  it("names a building entry whose code the docs page's docgen reads no props from", () => {
    // Tag returns useRender(...) and is read; Blank takes no props
    expect(docs.run(fixture('docgen'))).toEqual([
      {
        file: 'packages/perron/src/components/Blank/Blank.tsx',
        message:
          "Blank's docs page would show no props: its docgen finds no exported function component Blank taking BlankProps",
      },
    ])
  })

  it('passes on the repo', () => {
    expect(docs.run(join(here, '../..'))).toEqual([])
  })
})
