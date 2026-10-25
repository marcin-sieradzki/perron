// Accordion's stories: the accordion, then the item in each state of the deferred design, each in
// an accordion of its own, as Base UI's parts need (CR-2), then several open, a controlled one, a
// heading level, a long title, the motion and find in page. Every story sits on a raised Surface,
// as an accordion sits in a panel. Hover and focus render at rest; the visual check drives them,
// and their play tests check them.
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { Button } from '../Button/Button.tsx'
import { Surface } from '../Surface/Surface.tsx'
import {
  closed,
  colour,
  frames,
  lines,
  pressedAfterHover,
  rendered,
  resolve,
  stateFill,
} from '../../testing/stories.ts'
import { Accordion, AccordionItem, type AccordionProps } from './Accordion.tsx'

const SHAPES = 'What the dot shapes mean'
const FRESHNESS = 'How fresh the data is'
const MISSING = 'Why a vehicle can be missing'

/** The help panel's three questions, each with its answer as its panel. */
const questions = (freshness: { disabled?: boolean } = {}) => [
  <AccordionItem key="shapes" value="shapes" title={SHAPES}>
    A circle is a bus, a square is a tram and a diamond is a train.
  </AccordionItem>,
  <AccordionItem key="freshness" value="freshness" title={FRESHNESS} {...freshness}>
    Positions update every few seconds. A pale dot hasn't reported for over a minute.
  </AccordionItem>,
  <AccordionItem key="missing" value="missing" title={MISSING}>
    Some vehicles don't send their position. Their departures still show on the stop's list.
  </AccordionItem>,
]

/** The first two questions, with the state under test on the second. */
const twoQuestions = (freshness: { disabled?: boolean } = {}) => questions(freshness).slice(0, 2)

/** The spy every story's Accordion reports to; a play that asserts on it clears it first. */
const onChange = fn()

const meta = {
  title: 'Components/Accordion',
  component: Accordion,
  args: { defaultValue: ['shapes'], children: questions(), onChange },
  decorators: [
    // a story's `inlineSize` parameter narrows the panel, such as LongTitle's 320 px
    (Story, { parameters }) => (
      <Surface
        variant="raised"
        data-testid="panel"
        style={{ inlineSize: parameters.inlineSize, maxInlineSize: 'min(28rem, 100%)' }}
      >
        <Story />
      </Surface>
    ),
  ],
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

/** The trigger named `title` in `canvasElement`. */
const trigger = (canvasElement: HTMLElement, title: string) =>
  within(canvasElement).getByRole('button', { name: title })

/** The panel a trigger controls while it is open, by the trigger's `aria-controls`. */
const panelOf = (button: HTMLElement) =>
  document.getElementById(button.getAttribute('aria-controls') ?? '') as HTMLElement

/** A selector for the element with `id`, which Base UI's generated ids keep valid. */
const byId = (id: string) => `[id="${id}"]`

/** The subject story: three questions of a help panel, the first open. */
export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    onChange.mockClear()
    const shapes = trigger(canvasElement, SHAPES)
    const freshness = trigger(canvasElement, FRESHNESS)
    await step('each trigger is a button in a heading of level 3, named by its title', async () => {
      for (const title of [SHAPES, FRESHNESS, MISSING]) {
        const button = trigger(canvasElement, title)
        await expect(button.tagName).toBe('BUTTON')
        await expect(button.parentElement).toBe(
          within(canvasElement).getByRole('heading', { level: 3, name: title }),
        )
      }
    })
    await step('the first is open, its panel a region named by its title', async () => {
      await expect(shapes).toHaveAttribute('aria-expanded', 'true')
      await expect(within(canvasElement).getByRole('region', { name: SHAPES })).toBe(
        panelOf(shapes),
      )
    })
    await step('Enter closes it, and onChange hears it once, at the press', async () => {
      const id = shapes.getAttribute('aria-controls')!
      await userEvent.tab()
      await expect(shapes).toHaveFocus()
      await userEvent.keyboard('{Enter}')
      await expect(shapes).toHaveAttribute('aria-expanded', 'false')
      await expect(onChange).toHaveBeenCalledTimes(1)
      await expect(onChange).toHaveBeenCalledWith(
        expect.any(Event),
        [],
        expect.objectContaining({ reason: 'trigger-press' }),
      )
      await closed({ selector: byId(id) })
    })
    await step('Tab moves to the second, and Space opens it', async () => {
      await userEvent.tab()
      await expect(freshness).toHaveFocus()
      await userEvent.keyboard(' ')
      await expect(freshness).toHaveAttribute('aria-expanded', 'true')
      await expect(within(canvasElement).getByRole('region', { name: FRESHNESS })).toBeVisible()
    })
    await step('pressing the first opens it and closes the second', async () => {
      await userEvent.click(shapes)
      await expect(shapes).toHaveAttribute('aria-expanded', 'true')
      await expect(freshness).toHaveAttribute('aria-expanded', 'false')
      await expect(onChange).toHaveBeenLastCalledWith(
        expect.any(Event),
        ['shapes'],
        expect.objectContaining({ reason: 'trigger-press' }),
      )
    })
    await step('Shift+Tab leaves the accordion, where focus started', async () => {
      await expect(shapes).toHaveFocus()
      await userEvent.tab({ shift: true })
      await expect(canvasElement).not.toContainElement(document.activeElement as HTMLElement)
    })
  },
}

/** An item at rest, closed: the second, under the closed first. */
export const ItemDefault: Story = {
  args: { defaultValue: [], children: twoQuestions() },
}

/** An item, hovered by the visual check. */
export const ItemHover: Story = {
  args: { defaultValue: [], children: twoQuestions() },
  play: async ({ canvasElement }) => {
    const button = trigger(canvasElement, FRESHNESS)
    await expect(stateFill(button)).toBe('var(--perron-color-surface-hover)')
    await expect(stateFill(button, ':active')).toBe('var(--perron-color-surface-selected)')
    const pressed = resolve('backgroundColor', stateFill(button, ':active'))
    await expect(pressed).not.toBe(resolve('backgroundColor', stateFill(button)))
    await expect(pressed).not.toBe(getComputedStyle(button).backgroundColor)
    await expect(pressedAfterHover(button)).toBe(true)
    await expect(getComputedStyle(button).cursor).toBe('pointer')
  },
}

/** An item, focused by the visual check. */
export const ItemFocus: Story = {
  args: { defaultValue: [], children: twoQuestions() },
  play: async ({ canvasElement }) => {
    const button = trigger(canvasElement, FRESHNESS)
    await userEvent.tab()
    await userEvent.tab()
    await expect(button).toHaveFocus()
    await expect(button.matches(':focus-visible')).toBe(true)
    const ring = getComputedStyle(button)
    await expect(ring.outlineStyle).toBe('solid')
    await expect(ring.outlineColor).toBe(colour('--perron-color-border-focus'))
    await expect(ring.outlineWidth).toBe(rendered('focus-width', 'outline-width'))
    await userEvent.tab({ shift: true })
    await userEvent.tab({ shift: true })
    await expect(canvasElement).not.toContainElement(document.activeElement as HTMLElement)
  },
}

/** An item, open by `defaultValue`, its chevron turned up. */
export const ItemOpen: Story = {
  args: { defaultValue: ['freshness'], children: twoQuestions() },
  play: async ({ canvasElement }) => {
    const button = trigger(canvasElement, FRESHNESS)
    const panel = panelOf(button)
    await expect(button).toHaveAttribute('aria-expanded', 'true')
    await expect(button).toHaveAttribute('data-panel-open')
    await expect(panel).toHaveAttribute('aria-labelledby', button.id)
    await expect(within(canvasElement).getByRole('region', { name: FRESHNESS })).toBe(panel)
    const chevron = button.querySelector('.pn-AccordionItem-chevron')!
    await expect(getComputedStyle(chevron).scale).toBe('1 -1')
    // a panel open at first doesn't move: no starting style, no clip, and its content's height
    await expect(panel).not.toHaveAttribute('data-starting-style')
    await expect(panel.style.getPropertyValue('--accordion-panel-height')).toBe('auto')
    await expect(getComputedStyle(panel).overflow).toBe('visible')
    await expect(panel.clientHeight).toBe(panel.scrollHeight)
    await expect(panel.getAnimations()).toHaveLength(0)
  },
}

/** An item, disabled: out of the Tab order, in the tertiary ink. */
export const ItemDisabled: Story = {
  args: { defaultValue: [], children: twoQuestions({ disabled: true }) },
  play: async ({ canvasElement }) => {
    onChange.mockClear()
    const button = trigger(canvasElement, FRESHNESS)
    await expect(button).toBeDisabled()
    await expect(button).toHaveAttribute('data-disabled')
    await userEvent.tab()
    await expect(trigger(canvasElement, SHAPES)).toHaveFocus()
    await userEvent.tab()
    await expect(canvasElement).not.toContainElement(document.activeElement as HTMLElement)
    await userEvent.tab({ shift: true })
    await expect(trigger(canvasElement, SHAPES)).toHaveFocus()
    await userEvent.tab({ shift: true })
    await userEvent.click(button)
    await expect(button).toHaveAttribute('aria-expanded', 'false')
    await expect(within(canvasElement).queryByRole('region')).toBeNull()
    await expect(onChange).not.toHaveBeenCalled()
    await expect(getComputedStyle(button).cursor).toBe('default')
    await expect(getComputedStyle(button).color).toBe(colour('--perron-color-text-tertiary'))
    const chevron = button.querySelector('.pn-AccordionItem-chevron')!
    await expect(getComputedStyle(chevron).color).toBe(colour('--perron-color-text-tertiary'))
    await expect(canvasElement).not.toContainElement(document.activeElement as HTMLElement)
  },
}

/** Three questions with `multiple`, the first open: opening one keeps the others open. */
export const Multiple: Story = {
  args: { multiple: true },
  play: async ({ canvasElement }) => {
    onChange.mockClear()
    const shapes = trigger(canvasElement, SHAPES)
    const freshness = trigger(canvasElement, FRESHNESS)
    await userEvent.click(freshness)
    await expect(freshness).toHaveAttribute('aria-expanded', 'true')
    await expect(shapes).toHaveAttribute('aria-expanded', 'true')
    await expect(onChange).toHaveBeenCalledWith(
      expect.any(Event),
      ['shapes', 'freshness'],
      expect.objectContaining({ reason: 'trigger-press' }),
    )
    await expect(within(canvasElement).getAllByRole('region')).toHaveLength(2)
    freshness.blur()
  },
}

/**
 * A caller that keeps the open items in its own state and sets them from `onChange`, unless the
 * story's `onChange` spy returns `false`, which stands for a caller that turns the change down;
 * and two buttons outside the accordion that set them too.
 */
function ControlledAccordion(args: AccordionProps) {
  const [value, setValue] = useState<string[]>([])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 16 }}>
      <Accordion
        {...args}
        value={value}
        onChange={(event, next, details) => {
          if (onChange(event, next, details) !== false) setValue(next)
        }}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="outline" size="small" onClick={() => setValue(['missing'])}>
          Open the last question
        </Button>
        <Button variant="outline" size="small" onClick={() => setValue([])}>
          Close all
        </Button>
      </div>
    </div>
  )
}

/** Accordion given `value` and `onChange` from the story's state. */
export const Controlled: Story = {
  args: { defaultValue: undefined },
  render: (args) => <ControlledAccordion {...args} />,
  play: async ({ canvasElement }) => {
    onChange.mockClear()
    const canvas = within(canvasElement)
    const freshness = trigger(canvasElement, FRESHNESS)
    const missing = trigger(canvasElement, MISSING)
    onChange.mockReturnValueOnce(false)
    await userEvent.click(freshness)
    await expect(onChange).toHaveBeenCalledWith(
      expect.any(Event),
      ['freshness'],
      expect.objectContaining({ reason: 'trigger-press' }),
    )
    // the change turned down: the value, and so the panel, stays closed
    await expect(freshness).toHaveAttribute('aria-expanded', 'false')
    await expect(canvas.queryByRole('region')).toBeNull()
    await userEvent.click(freshness)
    await expect(freshness).toHaveAttribute('aria-expanded', 'true')
    await expect(canvas.getByRole('region', { name: FRESHNESS })).toBeVisible()
    const open = canvas.getByRole('button', { name: 'Open the last question' })
    await userEvent.click(open)
    await expect(missing).toHaveAttribute('aria-expanded', 'true')
    await expect(freshness).toHaveAttribute('aria-expanded', 'false')
    const close = canvas.getByRole('button', { name: 'Close all' })
    await userEvent.click(close)
    await expect(missing).toHaveAttribute('aria-expanded', 'false')
    await waitFor(() => expect(canvas.queryByRole('region')).toBeNull())
    close.blur()
    await expect(canvasElement).not.toContainElement(document.activeElement as HTMLElement)
  },
}

/** Two questions whose headings are `h2`s, through `slotProps.header.render`. */
export const HeadingLevel: Story = {
  args: {
    defaultValue: [],
    children: [
      <AccordionItem
        key="shapes"
        value="shapes"
        title={SHAPES}
        slotProps={{ header: { render: <h2 /> } }}
      >
        A circle is a bus, a square is a tram and a diamond is a train.
      </AccordionItem>,
      <AccordionItem
        key="freshness"
        value="freshness"
        title={FRESHNESS}
        slotProps={{ header: { render: <h2 /> } }}
      >
        Positions update every few seconds. A pale dot hasn't reported for over a minute.
      </AccordionItem>,
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const title of [SHAPES, FRESHNESS]) {
      const heading = canvas.getByRole('heading', { level: 2, name: title })
      await expect(heading.tagName).toBe('H2')
      await expect(heading).toHaveClass('pn-AccordionItem-header')
    }
    await expect(canvas.queryByRole('heading', { level: 3 })).toBeNull()
    const shapes = trigger(canvasElement, SHAPES)
    await userEvent.click(shapes)
    await expect(shapes).toHaveAttribute('aria-expanded', 'true')
    await expect(canvas.getByRole('region', { name: SHAPES })).toBeVisible()
    const id = shapes.getAttribute('aria-controls')!
    await userEvent.click(shapes)
    await closed({ selector: byId(id) })
    shapes.blur()
  },
}

/** A long Danish compound, wider than a 320 px row, as the first title. */
const LONG = 'Køretøjspositionsopdateringsfrekvensberegning'

/** Two questions in a 320 px wide container, the first titled with a long Danish compound. */
export const LongTitle: Story = {
  args: {
    defaultValue: [],
    children: [
      <AccordionItem key="long" value="long" title={LONG}>
        Hvor ofte et køretøjs position opdateres på kortet.
      </AccordionItem>,
      <AccordionItem key="freshness" value="freshness" title={FRESHNESS}>
        Positions update every few seconds. A pale dot hasn't reported for over a minute.
      </AccordionItem>,
    ],
  },
  parameters: { inlineSize: 320 },
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLElement>('[data-testid="panel"]')!
    await expect(container.getBoundingClientRect().width).toBe(320)
    const button = trigger(canvasElement, LONG)
    const title = button.querySelector<HTMLElement>('.pn-AccordionItem-title')!
    const chevron = button.querySelector<HTMLElement>('.pn-AccordionItem-chevron')!
    await expect(lines(title)).toBeGreaterThan(1.5)
    await expect(container.scrollWidth).toBe(container.clientWidth)
    await expect(button.getBoundingClientRect().right).toBeLessThanOrEqual(
      container.getBoundingClientRect().right + 0.5,
    )
    const line = Number.parseFloat(getComputedStyle(title).lineHeight)
    const top = title.getBoundingClientRect().top
    const mark = chevron.getBoundingClientRect()
    await expect(mark.top).toBeGreaterThanOrEqual(top - 0.5)
    await expect(mark.bottom).toBeLessThanOrEqual(top + line + 0.5)
  },
}

/** The height and overflow transitions running on `panel`, by property. */
const transitions = (panel: Element) =>
  Object.fromEntries(
    panel
      .getAnimations()
      .filter((a): a is CSSTransition => a instanceof CSSTransition)
      .map((a) => [a.transitionProperty, a]),
  )

/** The `from` and `to` values of a property's transition, as its keyframes give them. */
const span = (transition: CSSTransition, property: string) =>
  (transition.effect as KeyframeEffect).getKeyframes().map((frame) => frame[property])

/** Two questions, the first open, for the panel's and the chevron's motion. */
export const Motion: Story = {
  args: { children: twoQuestions() },
  play: async ({ canvasElement, step }) => {
    const shapes = trigger(canvasElement, SHAPES)
    const chevron = shapes.querySelector<HTMLElement>('.pn-AccordionItem-chevron')!
    const duration = rendered('duration-switch', 'transition-duration')
    let panel = panelOf(shapes)
    const height = panel.getBoundingClientRect().height
    await step('height, overflow and the turn transition over duration.switch', async () => {
      const style = getComputedStyle(panel)
      await expect(style.transitionProperty).toBe('height, overflow')
      // one duration for both, which the computed list may give once
      for (const each of style.transitionDuration.split(', ')) await expect(each).toBe(duration)
      await expect(style.transitionTimingFunction).toMatch(
        /, steps\(1(, jump-end| ?, ?end)?\)$|, step-end$/,
      )
      await expect(style.transitionBehavior).toBe('normal, allow-discrete')
      const turn = getComputedStyle(chevron)
      await expect(turn.transitionProperty).toBe('scale')
      await expect(turn.transitionDuration).toBe(duration)
    })
    await step('closing clips at once and falls to height 0, then leaves', async () => {
      const id = panel.id
      await userEvent.click(shapes)
      await waitFor(() => expect(panel).toHaveAttribute('data-ending-style'), { interval: 5 })
      await expect(getComputedStyle(panel).overflow).toBe('clip')
      const running = transitions(panel)
      await expect(span(running.height!, 'height').at(-1)).toBe('0px')
      await closed({ selector: byId(id) })
    })
    await step('opening grows from 0 with a clip, then rests unclipped', async () => {
      await userEvent.click(shapes)
      await waitFor(() => expect(panelOf(shapes)).not.toBeNull())
      panel = panelOf(shapes)
      await waitFor(() => expect(transitions(panel).height).toBeDefined(), { interval: 5 })
      const running = transitions(panel)
      const [from, to] = span(running.height!, 'height')
      await expect(from).toBe('0px')
      await expect(Math.abs(Number.parseFloat(String(to)) - height)).toBeLessThan(1)
      await expect(panel.getBoundingClientRect().height).toBeLessThan(height)
      await expect(getComputedStyle(panel).overflow).toBe('clip')
      await Promise.all(panel.getAnimations().map((a) => a.finished))
      await frames(2)
      await expect(panel.getBoundingClientRect().height).toBe(height)
      await expect(getComputedStyle(panel).overflow).toBe('visible')
      await waitFor(() => expect(getComputedStyle(chevron).scale).toBe('1 -1'))
      shapes.blur()
    })
  },
}

/** Three questions with `hiddenUntilFound`, all closed: find in page reaches their answers. */
export const HiddenUntilFound: Story = {
  args: { hiddenUntilFound: true, defaultValue: [] },
  play: async ({ canvasElement }) => {
    onChange.mockClear()
    const panels = canvasElement.querySelectorAll<HTMLElement>('.pn-AccordionItem-panel')
    await expect(panels).toHaveLength(3)
    for (const panel of panels) await expect(panel).toHaveAttribute('hidden', 'until-found')
    await expect(screen.queryByRole('region')).toBeNull()
    const freshness = panels[1]
    freshness.dispatchEvent(new Event('beforematch', { bubbles: true }))
    await waitFor(() => expect(freshness).not.toHaveAttribute('hidden'))
    await expect(onChange).toHaveBeenCalledWith(
      expect.any(Event),
      ['freshness'],
      expect.objectContaining({ reason: 'none' }),
    )
    await expect(trigger(canvasElement, FRESHNESS)).toHaveAttribute('aria-expanded', 'true')
    await frames(1)
    await expect(freshness.getBoundingClientRect().height).toBeGreaterThan(0)
    await expect(freshness.clientHeight).toBe(freshness.scrollHeight)
  },
}
