import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { API, apiFiles, canonical, propsApi } from './api.ts'

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

describe('canonical', () => {
  it('sorts every union inside a type, so the order the program met its members never shows', () => {
    expect(
      canonical(
        '(event: MouseEvent | Event | FocusEvent, snapPoint: SnapPoint | null, details: D) => void',
      ),
    ).toBe(
      '(event: Event | FocusEvent | MouseEvent, snapPoint: SnapPoint | null, details: D) => void',
    )
    expect(canonical("Omit<P, 'title' | 'action'>")).toBe("Omit<P, 'action' | 'title'>")
    expect(canonical('{ a?: "y" | "x" | undefined; }')).toBe('{ a?: "x" | "y" | undefined; }')
    expect(canonical('MouseEvent<HTMLButtonElement, MouseEvent>')).toBe(
      'MouseEvent<HTMLButtonElement, MouseEvent>',
    )
  })

  it('keeps text that is not a type as it is', () => {
    expect(canonical('a | (')).toBe('a | (')
  })
})
