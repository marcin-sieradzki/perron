import { expect, userEvent, within } from 'storybook/test'

const TITLE = 'Card'

/** A copy of Chip's helper, under a new name. */
async function noFocusIn(root: HTMLElement) {
  await userEvent.tab()
  await expect(root.contains(document.activeElement)).toBe(false)
  await userEvent.tab({ shift: true })
}

/** A query: a story's name for its own element. */
const cardIn = (scope: HTMLElement, name: string) => within(scope).getByRole('article', { name })

/** It reads its own file's TITLE, so Chip's twin does something else. */
const titled = (scope: HTMLElement) => within(scope).getAllByText(TITLE).at(0)?.textContent

export { cardIn, noFocusIn, titled }
