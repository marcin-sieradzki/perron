// The Root rule of the contract (docs/components/README.md) as a story: it renders each subject
// with a ref and a data-testid, and its play fails unless both land on one element. It looks for
// the root in the whole document, so a root a portal moves out of the canvas to the end of <body>,
// such as an overlay's popup, is found as any other.
import { createRef } from 'react'
import type { ComponentType, RefObject } from 'react'
import type { StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'

/** One component under the contract, with the props it needs to render, such as its children. */
export interface Subject {
  name: string
  Component: ComponentType<any>
  args: Record<string, unknown>
}

const testId = (name: string) => `contract-root-${name}`

/** A story that checks the Root rule on every subject. */
export function rootStory(subjects: Subject[]): StoryObj {
  const refs = new Map<string, RefObject<Element | null>>(
    subjects.map((s) => [s.name, createRef<Element>()]),
  )
  return {
    render: () => (
      <>
        {subjects.map(({ name, Component, args }) => (
          <Component key={name} {...args} ref={refs.get(name)} data-testid={testId(name)} />
        ))}
      </>
    ),
    play: async ({ canvasElement, step }) => {
      const canvas = within(canvasElement.ownerDocument.body)
      for (const { name } of subjects)
        await step(`${name}: ref and data-testid land on one element`, async () => {
          const root = canvas.getByTestId(testId(name))
          await expect(refs.get(name)?.current, `${name}'s ref`).toBe(root)
        })
    },
  }
}
