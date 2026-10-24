// A component that spreads its rest props on its root but puts its ref on a child: the contract's
// Root story must fail it.
import type { ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { rootStory } from '../contract/root.tsx'

function Split({ ref, ...rest }: ComponentProps<'span'>) {
  return (
    <span {...rest}>
      <span ref={ref}>Split</span>
    </span>
  )
}

export default { title: 'Fixtures/Split root' } satisfies Meta

export const Root: StoryObj = rootStory([{ name: 'Split', Component: Split, args: {} }])
