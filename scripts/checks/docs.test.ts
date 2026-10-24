import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import docs from './docs.ts'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => join(here, 'fixtures/docs', name)

describe('docs', () => {
  it('passes when every entry past designing has its docs page and spec page', () => {
    expect(docs.run(fixture('complete'))).toEqual([])
  })

  it('names each missing docs page and spec page', () => {
    expect(docs.run(fixture('missing'))).toEqual([
      {
        file: 'packages/perron/src/components/Button/Button.mdx',
        message: 'Button is stable and has no docs page; the component-docs skill writes it',
      },
      {
        file: 'docs/components/date-picker.md',
        message: 'DatePicker is building and has no spec page; copy docs/components/TEMPLATE.md',
      },
    ])
  })

  it('passes on the repo', () => {
    expect(docs.run(join(here, '../..'))).toEqual([])
  })
})
