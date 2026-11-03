// Toolbar's stories: the toolbar laid out horizontally and vertically, its button in each colour
// and disabled, toggles, icon-only buttons and a disabled toolbar. Hover and focus are play steps,
// not stories.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { showcase } from '../../testing/Showcase.tsx'
import { expect, fn, userEvent, within } from 'storybook/test'
import {
  colour,
  fill,
  forcedColourSheet,
  onHover,
  pressedAfterHover,
  rendered,
  resolve,
  stateFill,
} from '../../testing/stories.ts'
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
/** The args a story renders with: the meta's and its own. */
type StoryArgs = Parameters<NonNullable<Story['render']>>[0]

const neutral = {
  'aria-label': 'Actions',
  children: <ToolbarButton>Show whole line</ToolbarButton>,
}
const brand = {
  'aria-label': 'Actions',
  children: <ToolbarButton color="brand">Show whole line</ToolbarButton>,
}

/** Labels turned off, as a caller's condition gives them: `false` and `''` render no label. */
const showLabels = false as boolean

/** Two icon-only buttons, a separator, then a group of two labelled buttons. */
const horizontal = {
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
} satisfies Story

/** A neutral button at rest. */
const buttonNeutralDefault = { args: neutral } satisfies Story

/** A neutral button, hovered by the visual check. */
const buttonNeutralHover = {
  args: neutral,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Show whole line' })
    await expect(getComputedStyle(button).backgroundColor).toBe('rgba(0, 0, 0, 0)')
    await expect(onHover(button, 'background-color')).toBe('var(--perron-color-surface-hover)')
    await expect(stateFill(button, ':active')).toBe('var(--perron-color-surface-selected)')
    await expect(pressedAfterHover(button)).toBe(true)
    await expect(getComputedStyle(button).cursor).toBe('pointer')
  },
} satisfies Story

/** A neutral button, focused by the visual check. */
const buttonNeutralFocus = {
  args: neutral,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Show whole line' })
    await userEvent.tab()
    await expect(button).toHaveFocus()
    await expect(button.matches(':focus-visible')).toBe(true)
    await expect(getComputedStyle(button).outlineStyle).toBe('solid')
    await expect(getComputedStyle(button).outlineColor).toBe(colour('--perron-color-border-focus'))
    await userEvent.tab({ shift: true })
    await expect(button).not.toHaveFocus()
  },
} satisfies Story

/** A neutral button, disabled: still focusable, so it can explain itself. */
const buttonNeutralDisabled = {
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
} satisfies Story

/** A brand button at rest: the one main action. */
const buttonBrandDefault = { args: brand } satisfies Story

/** A brand button, hovered by the visual check. */
const buttonBrandHover = {
  args: brand,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Show whole line' })
    await expect(onHover(button, 'background-color')).toBe(
      'var(--perron-color-surface-brand-hover)',
    )
    await expect(onHover(button, 'border-color')).toBe('')
    await expect(stateFill(button, ':active')).toBe('var(--perron-color-surface-brand-pressed)')
    await expect(pressedAfterHover(button)).toBe(true)
    await expect(getComputedStyle(button).borderTopColor).toBe(
      colour('--perron-color-border-brand'),
    )
  },
} satisfies Story

/** A brand button, disabled: a fill and a colour, no longer yellow. */
const buttonBrandDisabled = {
  args: {
    'aria-label': 'Actions',
    children: (
      <ToolbarButton color="brand" disabled>
        Show whole line
      </ToolbarButton>
    ),
  },
} satisfies Story

const neutralButton = {
  args: buttonNeutralDefault.args,
  play: async (context: Parameters<NonNullable<Story['play']>>[0]) => {
    await buttonNeutralHover.play(context)
    await buttonNeutralFocus.play(context)
  },
} satisfies Story

const brandButton = {
  args: buttonBrandDefault.args,
  play: async (context: Parameters<NonNullable<Story['play']>>[0]) => {
    await buttonBrandHover.play(context)
  },
} satisfies Story

/** Two icon-only buttons, a separator, then a group of two labelled buttons, laid out horizontally. */
export const Default: Story = {
  play: async (context) => {
    await horizontal.play(context)
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

/** The button in each colour, at rest and disabled, each in a toolbar of its own. */
export const Buttons: Story = {
  ...showcase<StoryArgs>(
    [
      { label: 'Neutral', story: neutralButton },
      { label: 'Brand', story: brandButton },
      { label: 'Neutral, disabled', story: buttonNeutralDisabled },
      { label: 'Brand, disabled', story: buttonBrandDisabled },
    ],
    (args) => <Toolbar {...args} />,
  ),
}

/**
 * Three neutral buttons: a toggle that is on, a toggle that is off and a plain button, which has
 * no `aria-pressed`. On is the inverse fill, with its own hover and pressed steps (CR-14).
 */
export const Toggle: Story = {
  args: {
    'aria-label': 'Map view',
    children: [
      <ToolbarButton key="on" selected>
        3D view
      </ToolbarButton>,
      <ToolbarButton key="off" selected={false}>
        Satellite
      </ToolbarButton>,
      <ToolbarButton key="plain">Centre the map</ToolbarButton>,
    ],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const on = canvas.getByRole('button', { name: '3D view' })
    const off = canvas.getByRole('button', { name: 'Satellite' })
    const plain = canvas.getByRole('button', { name: 'Centre the map' })
    await step('selected sets aria-pressed, and data-selected only while on', async () => {
      await expect(on).toHaveAttribute('aria-pressed', 'true')
      await expect(on).toHaveAttribute('data-selected')
      await expect(off).toHaveAttribute('aria-pressed', 'false')
      await expect(off).not.toHaveAttribute('data-selected')
      await expect(plain).not.toHaveAttribute('aria-pressed')
      await expect(plain).not.toHaveAttribute('data-selected')
    })
    await step('on is the inverse fill, the size of off, which is the neutral rest', async () => {
      const style = getComputedStyle(on)
      await expect(style.backgroundColor).toBe(fill('color-surface-inverse'))
      await expect(style.color).toBe(colour('--perron-color-text-inverse'))
      await expect(style.borderTopColor).toBe(resolve('borderColor', 'transparent'))
      await expect(getComputedStyle(off).backgroundColor).toBe('rgba(0, 0, 0, 0)')
      await expect(on.getBoundingClientRect().height).toBe(off.getBoundingClientRect().height)
    })
    await step("hover and press take the inverse fill's own steps, the press after", async () => {
      await expect(stateFill(on)).toBe('var(--perron-color-surface-inverse-hover)')
      await expect(stateFill(on, ':active')).toBe('var(--perron-color-surface-inverse-pressed)')
      await expect(pressedAfterHover(on)).toBe(true)
      await expect(getComputedStyle(on).cursor).toBe('pointer')
    })
    await step('in forced colours, on keeps a Highlight fill', async () => {
      const sheet = forcedColourSheet('pn-ToolbarButton')
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]
      try {
        const style = getComputedStyle(on)
        await expect(style.backgroundColor).toBe(resolve('backgroundColor', 'Highlight'))
        await expect(style.color).toBe(resolve('color', 'HighlightText'))
      } finally {
        document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== sheet)
      }
    })
  },
}

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
