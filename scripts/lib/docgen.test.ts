import { describe, expect, it } from 'vitest'
import { componentDocs } from './docgen.ts'

const FILE = '/repo/packages/perron/src/components/Tag/Tag.tsx'

/** A component in the contract's shape that ends in `useRender(...)`, as most of Perron's do. */
const TAG = `
import { useRender } from '@base-ui/react/use-render'

export interface TagProps extends useRender.ComponentProps<'span'> {
  /** The tag's words. */
  label: string
  /** How loud the tag is. */
  variant?: 'quiet' | 'loud'
}

/** A short label. */
export function Tag({ label, variant = 'quiet', render, ...rest }: TagProps) {
  return useRender({ defaultTagName: 'span', render, props: { ...rest, children: label } })
}
`

describe('componentDocs', () => {
  it('finds a component that returns useRender(...), with its own props', () => {
    const [doc] = componentDocs(TAG, FILE)
    expect(doc.actualName).toBe('Tag')
    expect(Object.keys(doc.props ?? {})).toEqual(['label', 'variant'])
    expect(doc.props?.variant.defaultValue).toEqual({ value: "'quiet'", computed: false })
  })

  it('finds a component that returns JSX, as react-docgen does', () => {
    const src = `export function Dot({ size }: { /** How big. */ size: number }) { return <span>{size}</span> }`
    expect(componentDocs(src, FILE).map((d) => [d.actualName, Object.keys(d.props ?? {})])).toEqual(
      [['Dot', ['size']]],
    )
  })

  it('finds nothing in a file without a component', () => {
    expect(componentDocs(`export const answer = 42`, FILE)).toEqual([])
  })
})
