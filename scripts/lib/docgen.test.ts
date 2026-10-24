import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { componentDocs } from './docgen.ts'

/** A file that isn't on disk, in the repo, so its imports resolve as a component's do. */
const FILE = join(import.meta.dirname, '../../packages/perron/src/components/Tag/Tag.tsx')

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
    expect(Object.keys(doc.props ?? {})).toEqual(['label', 'variant', 'render'])
    expect(doc.props?.variant.defaultValue).toEqual({ value: "'quiet'", computed: false })
  })

  it("adds the members its props type inherits from Base UI, with Base UI's JSDoc, not React's", () => {
    const src = `
import { Button as BaseButton } from '@base-ui/react/button'

export interface PressProps extends Omit<BaseButton.Props, 'className'> {
  /** Classes for the root. */
  className?: string
}

export function Press({ className, ...rest }: PressProps) {
  return <BaseButton {...rest} className={className} />
}
`
    const [doc] = componentDocs(src, FILE)
    expect(Object.keys(doc.props ?? {})).toEqual([
      'className',
      'style',
      'focusableWhenDisabled',
      'nativeButton',
      'render',
    ])
    expect(doc.props?.nativeButton).toMatchObject({
      required: false,
      tsType: { name: 'boolean' },
      defaultValue: { value: 'true', computed: false },
    })
    expect(doc.props?.nativeButton.description).toMatch(/^Whether the component renders a native/)
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
