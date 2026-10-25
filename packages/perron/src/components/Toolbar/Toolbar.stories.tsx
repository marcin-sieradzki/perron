// Toolbar's stories: the toolbar in each orientation, then its button in each colour and state,
// each in a toolbar of its own, as Base UI's parts need (CR-2). Hover and focus render at rest;
// the visual check drives them, and their play tests check them.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { onHover, rendered } from '../../testing/stories.ts'
import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator } from './Toolbar.tsx'

/** `plus` from packages/perron/icons/. */
const Plus = () => (
  <svg
    className="perron-icon"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3.5 8h9M8 3.5v9" />
  </svg>
)

/** `minus` from packages/perron/icons/. */
const Minus = () => (
  <svg
    className="perron-icon"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3.5 8h9" />
  </svg>
)

/** `locate` from packages/perron/icons/. */
const Locate = () => (
  <svg
    className="perron-icon"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="8" cy="8" r="5" />
    <path d="M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3" />
  </svg>
)

const onShowDepartures = fn()
const onShowWholeLine = fn()

const mapControls = (
  <>
    <ToolbarButton aria-label="Zoom in" startIcon={<Plus />} />
    <ToolbarButton aria-label="Zoom out" startIcon={<Minus />} />
    <ToolbarSeparator />
    <ToolbarGroup>
      <ToolbarButton onClick={onShowWholeLine}>Show whole line</ToolbarButton>
      <ToolbarButton color="brand" onClick={onShowDepartures}>
        Show departures
      </ToolbarButton>
    </ToolbarGroup>
  </>
)

const meta = {
  title: 'Components/Toolbar',
  component: Toolbar,
  args: { 'aria-label': 'Map controls', children: mapControls },
} satisfies Meta<typeof Toolbar>

export default meta
type Story = StoryObj<typeof meta>

/** Two icon-only buttons, a separator, then a group of two labelled buttons. */
export const Horizontal: Story = {
  play: async ({ canvasElement }) => {
    onShowDepartures.mockClear()
    const canvas = within(canvasElement)
    const button = (name: string) => canvas.getByRole('button', { name })
    await userEvent.tab()
    await expect(button('Zoom in')).toHaveFocus()
    for (const name of ['Zoom out', 'Show whole line', 'Show departures', 'Zoom in']) {
      await userEvent.keyboard('{ArrowRight}')
      await expect(button(name)).toHaveFocus()
    }
    await userEvent.keyboard('{ArrowLeft}')
    await expect(button('Show departures')).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(onShowDepartures).toHaveBeenCalledTimes(1)
    await userEvent.tab({ shift: true })
    await expect(button('Show departures')).not.toHaveFocus()
    await userEvent.tab()
    await expect(button('Show departures')).toHaveFocus()
    await userEvent.tab({ shift: true })
    await expect(canvasElement).not.toContainElement(document.activeElement as HTMLElement)
  },
}

/** Zoom in, zoom out, a separator and locate, all icon-only, in a column. */
export const Vertical: Story = {
  args: {
    orientation: 'vertical',
    children: (
      <>
        <ToolbarButton aria-label="Zoom in" startIcon={<Plus />} />
        <ToolbarButton aria-label="Zoom out" startIcon={<Minus />} />
        <ToolbarSeparator />
        <ToolbarButton aria-label="Centre the map" startIcon={<Locate />} />
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = (name: string) => canvas.getByRole('button', { name })
    await userEvent.tab()
    await expect(button('Zoom in')).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(button('Zoom out')).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(button('Zoom out')).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(button('Centre the map')).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}')
    await expect(button('Zoom out')).toHaveFocus()
    await expect(canvas.getByRole('separator')).toHaveAttribute('aria-orientation', 'horizontal')
    await userEvent.tab({ shift: true })
    await expect(button('Zoom out')).not.toHaveFocus()
  },
}

const neutral = {
  'aria-label': 'Actions',
  children: <ToolbarButton>Show whole line</ToolbarButton>,
}
const brand = {
  'aria-label': 'Actions',
  children: <ToolbarButton color="brand">Show whole line</ToolbarButton>,
}

/** A neutral button at rest. */
export const ButtonNeutralDefault: Story = { args: neutral }

/** A neutral button, hovered by the visual check. */
export const ButtonNeutralHover: Story = {
  args: neutral,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Show whole line' })
    await expect(getComputedStyle(button).backgroundColor).toBe('rgba(0, 0, 0, 0)')
    await expect(onHover(button, 'background-color')).toBe('var(--perron-color-surface-hover)')
  },
}

/** A neutral button, focused by the visual check. */
export const ButtonNeutralFocus: Story = {
  args: neutral,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Show whole line' })
    await userEvent.tab()
    await expect(button).toHaveFocus()
    await expect(button.matches(':focus-visible')).toBe(true)
    await expect(getComputedStyle(button).outlineStyle).toBe('solid')
    await expect(getComputedStyle(button).outlineColor).toBe(
      rendered('color-border-focus', 'color'),
    )
    await userEvent.tab({ shift: true })
    await expect(button).not.toHaveFocus()
  },
}

/** A neutral button, disabled: still focusable, so it can explain itself. */
export const ButtonNeutralDisabled: Story = {
  args: {
    'aria-label': 'Actions',
    children: (
      <ToolbarButton disabled onClick={onShowWholeLine}>
        Show whole line
      </ToolbarButton>
    ),
  },
  play: async ({ canvasElement }) => {
    onShowWholeLine.mockClear()
    const button = within(canvasElement).getByRole('button', { name: 'Show whole line' })
    await expect(button).toHaveAttribute('aria-disabled', 'true')
    await expect(button).toHaveAttribute('data-disabled')
    await userEvent.tab()
    await expect(button).toHaveFocus()
    await userEvent.click(button)
    await expect(onShowWholeLine).not.toHaveBeenCalled()
    await userEvent.tab({ shift: true })
    await expect(button).not.toHaveFocus()
  },
}

/** A brand button at rest: the one main action. */
export const ButtonBrandDefault: Story = { args: brand }

/** A brand button, hovered by the visual check. */
export const ButtonBrandHover: Story = {
  args: brand,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Show whole line' })
    await expect(onHover(button, 'background-color')).toBe(
      'var(--perron-color-surface-brand-hover)',
    )
    await expect(onHover(button, 'border-color')).toBe('')
    await expect(getComputedStyle(button).borderTopColor).toBe(
      rendered('color-border-brand', 'color'),
    )
  },
}

/** A brand button, focused by the visual check. */
export const ButtonBrandFocus: Story = { args: brand }

/** A brand button, disabled: a fill and a colour, no longer yellow. */
export const ButtonBrandDisabled: Story = {
  args: {
    'aria-label': 'Actions',
    children: (
      <ToolbarButton color="brand" disabled>
        Show whole line
      </ToolbarButton>
    ),
  },
}

/** Labels turned off, as a caller's condition gives them: `false` and `''` render no label. */
const showLabels = false as boolean

/**
 * Three icon-only neutral buttons, each named by its aria-label; two get a label that renders
 * nothing, `false` and `''`, and stay icon-only.
 */
export const IconOnly: Story = {
  args: {
    children: (
      <>
        <ToolbarButton aria-label="Zoom in" startIcon={<Plus />} />
        <ToolbarButton aria-label="Zoom out" startIcon={<Minus />}>
          {showLabels && 'Zoom out'}
        </ToolbarButton>
        <ToolbarButton aria-label="Centre the map" startIcon={<Locate />}>
          {showLabels ? 'Centre the map' : ''}
        </ToolbarButton>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const side = rendered('size-control', 'width')
    for (const name of ['Zoom in', 'Zoom out', 'Centre the map']) {
      const button = canvas.getByRole('button', { name })
      await expect(button).toHaveAttribute('data-icon-only')
      await expect(button.querySelector('.pn-ToolbarButton-label')).toBeNull()
      await expect(button.querySelector('.pn-ToolbarButton-startIcon')).toHaveAttribute(
        'aria-hidden',
        'true',
      )
      const box = button.getBoundingClientRect()
      await expect(`${box.width}px`).toBe(side)
      await expect(`${box.height}px`).toBe(side)
    }
  },
}

/** The whole toolbar disabled: its buttons stay in the arrow-key order and ignore clicks. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    onShowDepartures.mockClear()
    const canvas = within(canvasElement)
    const buttons = canvas.getAllByRole('button')
    for (const button of buttons) await expect(button).toHaveAttribute('data-disabled')
    await userEvent.tab()
    await expect(buttons[0]).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(buttons[1]).toHaveFocus()
    await userEvent.click(canvas.getByRole('button', { name: 'Show departures' }))
    await expect(onShowDepartures).not.toHaveBeenCalled()
    await userEvent.tab({ shift: true })
    await expect(canvasElement).not.toContainElement(document.activeElement as HTMLElement)
  },
}
