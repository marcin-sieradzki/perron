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
    expect(Object.keys(doc.props ?? {})).toEqual([
      'label',
      'variant',
      'ref',
      'className',
      'style',
      'render',
    ])
    // React's root props join the table with Perron's words, since React's types give none
    expect(doc.props?.ref).toMatchObject({
      tsType: { name: 'Ref<HTMLSpanElement>' },
      description: 'Reaches the root element.',
    })
    expect(doc.props?.className.description).toMatch(/^Joined after the component's own class/)
    expect(doc.props?.variant.defaultValue).toEqual({ value: "'quiet'", computed: false })
  })

  it("takes an own prop's default from its JSDoc's @default when it has no destructuring default", () => {
    const src = `
import { useRender } from '@base-ui/react/use-render'

export interface FlagProps extends Omit<useRender.ComponentProps<'span'>, 'render'> {
  /**
   * Swaps the root element.
   *
   * @default <span />
   */
  render?: useRender.ComponentProps<'span'>['render']
  /**
   * Overrides "Closed", the flag's word.
   *
   * @default The locale's
   */
  closedLabel?: string
  /**
   * How loud the flag is.
   *
   * @default 'loud'
   */
  variant?: 'quiet' | 'loud'
  /** The flag's own words, with no default. */
  label?: string
}

export function Flag({ render, closedLabel, variant = 'quiet', label, ...rest }: FlagProps) {
  return useRender({ defaultTagName: 'span', render, props: { ...rest, children: label ?? closedLabel ?? variant } })
}
`
    const props = componentDocs(src, FILE)[0].props!
    expect(props.render.defaultValue).toEqual({ value: '<span />', computed: false })
    expect(props.closedLabel.defaultValue).toEqual({ value: "The locale's", computed: false })
    // the destructuring default is what the component does, so it wins over the tag
    expect(props.variant.defaultValue).toEqual({ value: "'quiet'", computed: false })
    expect(props.label.defaultValue).toBeUndefined()
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
      'ref',
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

  it('gives an inherited member the component destructures with a default its type and JSDoc', () => {
    const src = `
import { Button as BaseButton } from '@base-ui/react/button'

export interface PressProps extends BaseButton.Props {}

export function Press({ focusableWhenDisabled = true, nativeButton = false, ...rest }: PressProps) {
  return <BaseButton {...rest} focusableWhenDisabled={focusableWhenDisabled} nativeButton={nativeButton} />
}
`
    const [doc] = componentDocs(src, FILE)
    expect(doc.props?.focusableWhenDisabled).toMatchObject({
      required: false,
      tsType: { name: 'boolean' },
      defaultValue: { value: 'true', computed: false },
    })
    expect(doc.props?.focusableWhenDisabled.description).toMatch(/focusable when disabled/)
    // the destructuring default wins over Base UI's @default true
    expect(doc.props?.nativeButton).toMatchObject({
      tsType: { name: 'boolean' },
      defaultValue: { value: 'false', computed: false },
    })
  })

  it('writes a type react-docgen reads as unknown, such as a readonly array, as the compiler does', () => {
    const src = `
interface Stop { name: string }

export interface TripProps {
  /** The stops, in order. */
  stops: readonly Stop[]
  /** The names, in order. */
  names?: readonly string[]
  /** As an array type. */
  others: ReadonlyArray<Stop>
}

export function Trip({ stops }: TripProps) {
  return <ol>{stops.length}</ol>
}
`
    const props = componentDocs(src, FILE)[0].props!
    expect(props.stops).toMatchObject({ required: true, tsType: { name: 'readonly Stop[]' } })
    expect(props.stops.description).toBe('The stops, in order.')
    expect(props.names.tsType).toEqual({ name: 'readonly string[]' })
    expect(props.others.tsType).toMatchObject({ raw: 'ReadonlyArray<Stop>' })
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
