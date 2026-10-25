import { expect, userEvent } from 'storybook/test'

export const Default = {
  /** Chip's helper again, copied into the story's play function. */
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const leaves = async (root: HTMLElement) => {
      await userEvent.tab()
      await expect(root.contains(document.activeElement)).toBe(false)
      await userEvent.tab({ shift: true })
    }
    await leaves(canvasElement)
  },
}
