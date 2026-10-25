// Kbd's stories: one per row of the spec's Stories table (docs/components/kbd.md), with the design
// deferred, and their play tests, which read the DOM and the accessibility tree, not the pixels.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent } from 'storybook/test'
import { heard } from '../../testing/stories.ts'
import { Text } from '../Text/Text.tsx'
import { Kbd } from './Kbd.tsx'

const meta = {
  title: 'Components/Kbd',
  component: Kbd,
  // the one required prop and the caller's word, so any story renders alone
  args: { children: 'Esc' },
} satisfies Meta<typeof Kbd>

export default meta

type Story = StoryObj<typeof meta>

/** Every Kbd rendered inside `canvas`. */
const keysIn = (canvas: HTMLElement) => [...canvas.querySelectorAll<HTMLElement>('.pn-Kbd')]

/** The key "Esc", the contract story's subject. */
export const Default: Story = {
  args: { children: 'Esc' },
  play: async ({ canvasElement }) => {
    const [key] = keysIn(canvasElement)
    // the native <kbd>, with Perron's class and no role, ARIA or data attribute (CR-1)
    await expect(key.tagName).toBe('KBD')
    await expect(key).toHaveClass('pn-Kbd')
    const names = key.getAttributeNames()
    await expect(names.filter((n) => n === 'role' || n.startsWith('aria-'))).toEqual([])
    await expect(names.filter((n) => n.startsWith('data-'))).toEqual([])
    await expect(heard(key)).toBe('Esc')
    // never focusable (CR-2): no tab stop, and Tab lands nowhere inside it
    await expect(key).not.toHaveAttribute('tabindex')
    await userEvent.tab()
    await expect(key.contains(document.activeElement)).toBe(false)
    await userEvent.tab({ shift: true })
  },
}

/** The key "+": one character, in a box at least as wide as it is tall (CR-3). */
export const SingleCharacter: Story = {
  args: { children: '+' },
  play: async ({ canvasElement }) => {
    const [key] = keysIn(canvasElement)
    const box = key.getBoundingClientRect()
    await expect(box.width).toBeGreaterThanOrEqual(box.height)
    await expect(heard(key)).toBe('+')
  },
}

/** Help text in `typography.caption`, wrapped in a narrow column, with each key a Kbd (CR-3). */
export const InHelpText: Story = {
  render: () => (
    <div style={{ inlineSize: 160 }}>
      <Text variant="caption" render={<p />}>
        Keys: <Kbd>+</Kbd> and <Kbd>−</Kbd> zoom, arrows pan, <Kbd>Esc</Kbd> closes panels.
      </Text>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const paragraph = canvasElement.querySelector('p')!
    const column = paragraph.parentElement!.getBoundingClientRect()
    const lineHeight = parseFloat(getComputedStyle(paragraph).lineHeight)
    // the sentence is read whole, in order, and the column is narrow enough to wrap it
    await expect(heard(paragraph)).toBe('Keys: + and − zoom, arrows pan, Esc closes panels.')
    await expect(paragraph.getBoundingClientRect().height).toBeGreaterThan(lineHeight)
    // no taller than the same paragraph with its keys as plain text, in the same column: each
    // stand-in as wide as its key, so the sentence wraps at the same words
    const plain = paragraph.cloneNode(true) as HTMLElement
    const widths = keysIn(paragraph).map((key) => key.getBoundingClientRect().width)
    keysIn(plain).forEach((key, i) => {
      const standIn = document.createElement('span')
      standIn.style.display = 'inline-block'
      standIn.style.inlineSize = `${widths[i]}px`
      standIn.textContent = key.textContent
      key.replaceWith(standIn)
    })
    paragraph.after(plain)
    const plainHeight = plain.getBoundingClientRect().height
    plain.remove()
    await expect(paragraph.getBoundingClientRect().height).toBeLessThanOrEqual(plainHeight)
    const keys = keysIn(canvasElement)
    await expect(keys.map(heard)).toEqual(['+', '−', 'Esc'])
    for (const key of keys) {
      const box = key.getBoundingClientRect()
      // no taller than the line, so the lines around it keep their spacing
      await expect(box.height).toBeLessThanOrEqual(lineHeight)
      // its text on one line
      const range = document.createRange()
      range.selectNodeContents(key)
      await expect(range.getClientRects().length).toBe(1)
      // inside the column
      await expect(box.left).toBeGreaterThanOrEqual(column.left)
      await expect(box.right).toBeLessThanOrEqual(column.right)
    }
    // a key on a wrapped line stands apart from a key on the line above, by more than both their
    // borders, so their edges never read as one doubled line (CR-3)
    const border = parseFloat(getComputedStyle(keys[0]).borderTopWidth)
    const boxes = keys.map((key) => key.getBoundingClientRect())
    // the space between each key and each key below it: the column wraps the caption, so there is one
    const gaps = boxes.flatMap((upper) =>
      boxes
        .filter((lower) => lower.top >= upper.bottom - border)
        .map((lower) => lower.top - upper.bottom),
    )
    await expect(gaps.length).toBeGreaterThan(0)
    for (const gap of gaps) await expect(gap).toBeGreaterThan(2 * border)
  },
}
