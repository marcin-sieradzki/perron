import { expect, userEvent, within } from 'storybook/test'

const TITLE = 'Chip'

/** Tabs once and expects focus outside `root`. */
async function expectNoFocus(root: HTMLElement) {
  await userEvent.tab()
  await expect(root.contains(document.activeElement)).toBe(false)
  await userEvent.tab({ shift: true })
}

/** A query: a story's name for its own element. */
const chipIn = (scope: HTMLElement, name: string) => within(scope).getByRole('article', { name })

/** It reads its own file's TITLE. */
const titled = (scope: HTMLElement) => within(scope).getAllByText(TITLE).at(0)?.textContent

export { chipIn, expectNoFocus, titled }
