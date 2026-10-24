import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { API, apiFiles, propsApi } from './api.ts'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = join(here, 'fixtures/api')

describe('apiFiles', () => {
  it('lists each stable or deprecated entry: the members its props type declares, and what it extends', () => {
    expect(JSON.parse(apiFiles(fixture)[API])).toEqual({
      Button: {
        extends: ["Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'>"],
        props: {
          disabled: { optional: true, type: ['boolean'] },
          label: { optional: false, type: ['string'] },
          onOpen: { optional: true, type: ['(event: Event) => void'] },
          size: { optional: true, type: ['"large"', '"medium"', '"small"'] },
          startIcon: { optional: true, type: ['ReactNode'] },
          variant: { optional: true, type: ['"contained"', '"outlined"'] },
        },
      },
      // an intersection, overriding a member it inherits
      Chip: {
        extends: ['HTMLAttributes<HTMLSpanElement>'],
        props: { color: { optional: true, type: ['"brand"', '"neutral"'] } },
      },
    })
  })
})

describe('propsApi', () => {
  it('needs the exported <Name>Props', () => {
    const file = 'packages/perron/src/components/Bare/Bare.tsx'
    expect(() => propsApi(fixture, [file])).toThrow(`${file} exports no BareProps`)
  })
})
