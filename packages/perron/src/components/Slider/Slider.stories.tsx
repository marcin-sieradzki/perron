// Slider's stories: the states of the deferred design, Default, Hover, Focus, Pressed, Disabled and
// Invalid, and the stories of content and behaviour the spec's Stories table names
// (docs/components/slider.md), each in a 320 px container. Hover, focus and pressed render at rest;
// their plays drive them.
import { createRef, useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { PerronProvider } from '../../PerronProvider.tsx'
import type { Locale } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import {
  colour,
  edge,
  fieldPart,
  fill,
  heard,
  lines,
  mounted,
  onHover,
  pressedAfterHover,
  rendered,
  stateRules,
} from '../../testing/stories.ts'
import { Button } from '../Button/Button.tsx'
import { Slider } from './Slider.tsx'
import type { SliderProps } from './Slider.tsx'

const LABEL = 'Trail length'
const DESCRIPTION = 'Minutes of movement drawn behind each vehicle'

const meta = {
  title: 'Components/Slider',
  component: Slider,
  // every word the caller gives, the range and the value, and a handler for each event, so any
  // story renders alone
  args: {
    label: LABEL,
    description: DESCRIPTION,
    min: 0,
    max: 10,
    defaultValue: 5,
    onChange: fn(),
    onChangeCommitted: fn(),
  },
  decorators: [
    (Story) => (
      <PerronProvider locale="en">
        <div style={{ inlineSize: 320 }}>
          <Story />
        </div>
      </PerronProvider>
    ),
  ],
} satisfies Meta<typeof Slider>

export default meta

type Story = StoryObj<typeof meta>

/** A range: the label and the help the Range story and the form's second slider show. */
const RANGE = {
  label: 'Departures per hour',
  description: 'Show stops with this many departures each hour',
  min: 0,
  max: 30,
  defaultValue: [4, 12] as const,
} satisfies Partial<SliderProps>

/** The slider's input named `name`, the `slider`, in `scope`. */
const sliderIn = (scope: HTMLElement, name: string | RegExp = LABEL) =>
  within(scope).getByRole<HTMLInputElement>('slider', { name })

/** One of Slider's own parts in `scope`, by its class. */
const part = (
  scope: Element,
  name: 'control' | 'track' | 'indicator' | 'thumb' | 'value' | 'valueText',
) => scope.querySelector<HTMLElement>(`.pn-Slider-${name}`)!

/** The figure as it is read in place: the value text, without the hidden sizers. */
const figure = (scope: Element) => heard(part(scope, 'value'))

/** The figure's two hidden sizers, the formatted ends, as their text (CR-8). */
const sizers = (scope: Element) =>
  Array.from(part(scope, 'value').querySelectorAll('.pn-Slider-valueSizer'), (s) => s.textContent)

/** Every key of `slotProps`, each one of Slider's parts. */
const SLOTS = [
  'field',
  'label',
  'description',
  'error',
  'control',
  'track',
  'indicator',
  'thumb',
  'value',
] as const

/** The `onChange` or `onChangeCommitted` spy of a story's args. */
const spy = (handler: unknown) => handler as ReturnType<typeof fn>

/** The value and the details' reason of a spy's call, by its index. */
const call = (handler: unknown, index = -1) => {
  const [, value, details] = spy(handler).mock.calls.at(index) as [
    Event,
    SliderProps['value'],
    { reason: string },
  ]
  return { value, reason: details.reason }
}

/** The event and the details of a spy's call, by its index, for CR-6. */
const eventOf = (handler: unknown, index = -1) => {
  const [event, , details] = spy(handler).mock.calls.at(index) as [
    Event,
    SliderProps['value'],
    { event: Event },
  ]
  return { event, details }
}

/**
 * A mouse event at `clientX`, `clientY`, dispatched on `target`. Base UI's control reads only
 * `clientX`, `clientY`, the button and the buttons held; a pointer id of 0 asks it to capture no
 * pointer, which a synthetic event has none of.
 */
function pointerAt(type: string, target: Element, clientX: number, clientY: number) {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerType: 'mouse',
      isPrimary: true,
      button: 0,
      buttons: type === 'pointerup' ? 0 : 1,
      clientX,
      clientY,
    }),
  )
}

/** A mouse event at a fraction of the way along `track`, dispatched on `target`. */
function pointer(type: string, target: Element, track: Element, along: number) {
  const box = track.getBoundingClientRect()
  pointerAt(type, target, box.left + box.width * along, box.top + box.height / 2)
}

/**
 * Sets a thumb's hidden range input as a screen reader or the browser does, with no key: its value
 * through the native setter, then an `input` event, which Base UI reads as `'input-change'`.
 */
function setInput(input: HTMLInputElement, value: number) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(
    input,
    String(value),
  )
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

/** Whether every duration `element` transitions or animates over is zero, and it runs none (CR-15). */
function still(element: Element) {
  const style = getComputedStyle(element)
  const zero = (durations: string) => durations.split(',').every((d) => Number.parseFloat(d) === 0)
  return zero(style.transitionDuration) && style.animationName === 'none'
}

/** A slider that turns disabled at its first change, while its thumb has focus. */
function DisablesOnChange(props: SliderProps) {
  const [disabled, setDisabled] = useState(false)
  return <Slider {...props} disabled={disabled} onChange={() => setDisabled(true)} />
}

/** The subject story, State default: the label, the help, the track filled to 5 of 10 and "5". */
export const Default: Story = {
  play: async ({ args, canvasElement, step }) => {
    const slider = sliderIn(canvasElement)
    const root = within(canvasElement).getByRole('group', { name: LABEL })
    const control = part(canvasElement, 'control')
    const value = part(canvasElement, 'value')
    await step('the group in its frame, named by the label, holds one slider', async () => {
      await expect(root).toHaveClass('pn-Slider')
      await expect(root.closest('.pn-Field')).toHaveClass('pn-Field', 'pn-Slider-field')
      await expect(fieldPart(canvasElement, 'label')).toHaveClass(
        'pn-Field-label',
        'pn-Slider-label',
      )
      await expect(fieldPart(canvasElement, 'description')).toHaveClass(
        'pn-Field-description',
        'pn-Slider-description',
      )
      await expect(within(root).getAllByRole('slider')).toEqual([slider])
      await expect(slider).toHaveAccessibleDescription(DESCRIPTION)
      await expect(slider).toHaveAttribute('aria-valuenow', '5')
      await expect(slider).toHaveAttribute('min', '0')
      await expect(slider).toHaveAttribute('max', '10')
      await expect(slider).toHaveAttribute('aria-orientation', 'horizontal')
      await expect(figure(canvasElement)).toBe('5')
      await expect(control).toHaveAttribute('data-base-ui-swipe-ignore', 'x')
    })
    await step('a single thumb gets no name or value text of Slider’s own (CR-7)', async () => {
      await expect(slider).not.toHaveAttribute('aria-label')
      await expect(slider).not.toHaveAttribute('aria-valuetext')
    })
    await step(
      'the parts in order, the control as tall as the smallest target (CR-3)',
      async () => {
        const track = part(canvasElement, 'track')
        await expect(Array.from(track.children)).toEqual([
          part(canvasElement, 'indicator'),
          part(canvasElement, 'thumb'),
        ])
        await expect(control.nextElementSibling).toBe(value)
        await expect(getComputedStyle(control).blockSize).toBe(
          rendered('size-target-min', 'block-size'),
        )
        // the thumb sits inside the control, the press target
        const box = control.getBoundingClientRect()
        const thumb = part(canvasElement, 'thumb').getBoundingClientRect()
        await expect(thumb.top).toBeGreaterThanOrEqual(box.top)
        await expect(thumb.bottom).toBeLessThanOrEqual(box.bottom)
      },
    )
    await step('the figure is an output read in place, its sizers hidden (CR-8)', async () => {
      await expect(value.tagName).toBe('OUTPUT')
      await expect(value).toHaveAttribute('aria-live', 'off')
      await expect(value.getAttribute('for')).toBe(slider.id)
      const sizers = Array.from(value.querySelectorAll('.pn-Slider-valueSizer'))
      await expect(sizers.map((sizer) => sizer.textContent)).toEqual(['0', '10'])
      for (const sizer of sizers) {
        await expect(sizer).toHaveAttribute('aria-hidden', 'true')
        await expect(getComputedStyle(sizer).visibility).toBe('hidden')
      }
    })
    await step(
      'Tab focuses the slider; ArrowRight steps it and calls each handler once',
      async () => {
        await expect(root).not.toHaveAttribute('data-touched')
        await userEvent.tab()
        await expect(slider).toHaveFocus()
        await userEvent.keyboard('{ArrowRight}')
        await expect(slider).toHaveAttribute('aria-valuenow', '6')
        await expect(figure(canvasElement)).toBe('6')
        await expect(spy(args.onChange)).toHaveBeenCalledTimes(1)
        await expect(call(args.onChange)).toEqual({ value: 6, reason: 'keyboard' })
        await expect(spy(args.onChangeCommitted)).toHaveBeenCalledTimes(1)
        await expect(call(args.onChangeCommitted)).toEqual({ value: 6, reason: 'keyboard' })
        // Base UI marks the field touched at a change
        await waitFor(() => expect(root).toHaveAttribute('data-touched'))
        await expect(part(canvasElement, 'thumb')).toHaveAttribute('data-touched')
      },
    )
    await step(
      'each event is the details’ event, its target the value and name (CR-6)',
      async () => {
        for (const handler of [args.onChange, args.onChangeCommitted]) {
          const { event, details } = eventOf(handler)
          await expect(event).toBe(details.event)
        }
        const { event } = eventOf(args.onChange)
        await expect(event.target).toEqual({ value: 6, name: undefined })
      },
    )
    await step('the input set with no key changes and commits with input-change', async () => {
      setInput(slider, 7)
      await waitFor(() => expect(slider).toHaveAttribute('aria-valuenow', '7'))
      await expect(call(args.onChange)).toEqual({ value: 7, reason: 'input-change' })
      await expect(call(args.onChangeCommitted)).toEqual({ value: 7, reason: 'input-change' })
      setInput(slider, 6)
      await waitFor(() => expect(slider).toHaveAttribute('aria-valuenow', '6'))
    })
    await step('End, then a step down and back, keeps the track’s width (CR-8)', async () => {
      await userEvent.keyboard('{End}')
      await expect(slider).toHaveAttribute('aria-valuenow', '10')
      await userEvent.keyboard('{ArrowLeft}')
      await expect(slider).toHaveAttribute('aria-valuenow', '9')
      const width = part(canvasElement, 'track').getBoundingClientRect().width
      await userEvent.keyboard('{ArrowRight}')
      await expect(figure(canvasElement)).toBe('10')
      await expect(part(canvasElement, 'track').getBoundingClientRect().width).toBe(width)
    })
    await step('ArrowRight at max changes nothing and calls neither handler', async () => {
      const changes = spy(args.onChange).mock.calls.length
      const commits = spy(args.onChangeCommitted).mock.calls.length
      await userEvent.keyboard('{ArrowRight}')
      await expect(slider).toHaveAttribute('aria-valuenow', '10')
      await expect(spy(args.onChange)).toHaveBeenCalledTimes(changes)
      await expect(spy(args.onChangeCommitted)).toHaveBeenCalledTimes(commits)
    })
    await step('Home, PageUp and PageDown move to the ends and by one large step', async () => {
      await userEvent.keyboard('{Home}')
      await expect(slider).toHaveAttribute('aria-valuenow', '0')
      await userEvent.keyboard('{PageUp}')
      await expect(slider).toHaveAttribute('aria-valuenow', '10')
      await userEvent.keyboard('{PageDown}')
      await expect(slider).toHaveAttribute('aria-valuenow', '0')
    })
    await step('the arrows step it; with Shift, by one large step', async () => {
      await userEvent.keyboard('{ArrowUp}')
      await expect(slider).toHaveAttribute('aria-valuenow', '1')
      await userEvent.keyboard('{ArrowDown}')
      await expect(slider).toHaveAttribute('aria-valuenow', '0')
      await userEvent.keyboard('{Shift>}{ArrowUp}{/Shift}')
      await expect(slider).toHaveAttribute('aria-valuenow', '10')
      await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}')
      await expect(slider).toHaveAttribute('aria-valuenow', '0')
      await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}')
      await expect(slider).toHaveAttribute('aria-valuenow', '10')
      await userEvent.keyboard('{Shift>}{ArrowLeft}{/Shift}')
      await expect(slider).toHaveAttribute('aria-valuenow', '0')
    })
    await step('five steps bring it back to 5, and Shift+Tab moves focus out', async () => {
      await userEvent.keyboard('{ArrowRight>5/}')
      await expect(slider).toHaveAttribute('aria-valuenow', '5')
      await userEvent.tab({ shift: true })
      await expect(slider).not.toHaveFocus()
    })
    await step('a press on the label focuses the slider', async () => {
      await userEvent.click(fieldPart(canvasElement, 'label')!)
      await expect(slider).toHaveFocus()
      await expect(slider).toHaveAttribute('aria-valuenow', '5')
      slider.blur()
    })
    await step(
      'the caller’s props reach the root, and each slot’s class follows its own (CR-2, CR-4)',
      async () => {
        const ref = createRef<HTMLDivElement>()
        await mounted(
          canvasElement,
          <PerronProvider locale="en">
            <Slider
              label="Probe"
              description="Probe help"
              error="Probe error"
              ref={ref}
              id="probe"
              data-testid="probe"
              className="caller"
              style={{ marginBlockStart: 1 }}
              slotProps={Object.fromEntries(
                SLOTS.map((slot) => [slot, { className: `caller-${slot}` }]),
              )}
            />
          </PerronProvider>,
          async (host) => {
            const probe = await waitFor(() => within(host).getByRole('group', { name: 'Probe' }))
            await expect(ref.current).toBe(probe)
            await expect(probe).toHaveAttribute('id', 'probe')
            await expect(probe).toHaveAttribute('data-testid', 'probe')
            await expect(probe.className).toBe('pn-Slider caller')
            await expect(probe.style.marginBlockStart).toBe('1px')
            for (const slot of ['field', 'label', 'description', 'error'] as const)
              await expect(fieldPart(host, slot)!.className).toBe(
                `pn-Field${slot === 'field' ? '' : `-${slot}`} pn-Slider-${slot} caller-${slot}`,
              )
            for (const slot of ['control', 'track', 'indicator', 'thumb', 'value'] as const)
              await expect(part(host, slot).className).toContain(`pn-Slider-${slot} caller-${slot}`)
            // with no defaultValue, a single thumb starts at min
            await expect(sliderIn(host, 'Probe')).toHaveAttribute('aria-valuenow', '0')
          },
        )
      },
    )
  },
}

/** State hover: the slider at 5, at rest at first render; the play reads the hover rule. */
export const Hover: Story = {
  play: async ({ canvasElement }) => {
    const thumb = part(canvasElement, 'thumb')
    const image = onHover(thumb, 'background-image')
    await expect(image).toContain('linear-gradient')
    await expect(image).toContain('var(--perron-color-surface-hover)')
    await expect(getComputedStyle(thumb).backgroundColor).toBe(fill('color-surface-raised'))
    await expect(getComputedStyle(part(canvasElement, 'control')).cursor).toBe('pointer')
    await expect(getComputedStyle(thumb).cursor).toBe('pointer')
    // the thumb alone takes a hover look (CR-12)
    for (const name of ['control', 'track', 'indicator', 'value'] as const)
      for (const property of ['background-color', 'background-image', 'border-color', 'color'])
        await expect(onHover(part(canvasElement, name), property)).toBe('')
    // the thumb and the fill change at once, with no transition or animation (CR-15)
    await expect(still(thumb)).toBe(true)
    await expect(still(part(canvasElement, 'indicator'))).toBe(true)
  },
}

/** State focus: the slider at 5, at rest at first render; Tab gives the thumb its ring (CR-9). */
export const Focus: Story = {
  play: async ({ canvasElement }) => {
    const slider = sliderIn(canvasElement)
    const thumb = part(canvasElement, 'thumb')
    await userEvent.tab()
    await expect(slider).toHaveFocus()
    await expect(slider.matches(':focus-visible')).toBe(true)
    const ring = getComputedStyle(thumb)
    await expect(ring.outlineStyle).toBe('solid')
    await expect(ring.outlineColor).toBe(colour('--perron-color-border-focus'))
    await expect(ring.outlineWidth).toBe(rendered('focus-width', 'outline-width'))
    await expect(ring.outlineOffset).toBe(rendered('focus-offset', 'outline-offset'))
    // the ring is the thumb's own outline, so it follows the thumb's round radius
    await expect(ring.borderTopLeftRadius).toBe(rendered('radius-full', 'border-top-left-radius'))
    await userEvent.tab({ shift: true })
    await expect(slider).not.toHaveFocus()
    await expect(getComputedStyle(thumb).outlineStyle).toBe('none')
  },
}

/** State pressed: the slider at 5, at rest at first render; the play presses and drags. */
export const Pressed: Story = {
  play: async ({ args, canvasElement, step }) => {
    const slider = sliderIn(canvasElement)
    const control = part(canvasElement, 'control')
    const track = part(canvasElement, 'track')
    const thumb = part(canvasElement, 'thumb')
    await step('the pressed layer is a step past hover, and its rule comes after', async () => {
      const pressed = stateRules(thumb, ':active')
        .map((s) => s.getPropertyValue('background-image'))
        .filter(Boolean)
      await expect(pressed.at(-1)).toContain('var(--perron-color-surface-selected)')
      await expect(onHover(thumb, 'background-image')).toContain(
        'var(--perron-color-surface-hover)',
      )
      await expect(pressedAfterHover(thumb)).toBe(true)
    })
    await step('a press at 80% of the track moves the thumb there and drags it', async () => {
      pointer('pointerdown', control, track, 0.8)
      await waitFor(() => expect(slider).toHaveAttribute('aria-valuenow', '8'))
      await expect(call(args.onChange)).toEqual({ value: 8, reason: 'track-press' })
      await waitFor(() => expect(thumb).toHaveAttribute('data-dragging'))
    })
    await step('the press focuses the thumb’s input without the ring (CR-9)', async () => {
      await waitFor(() => expect(slider).toHaveFocus())
      await expect(slider.matches(':focus-visible')).toBe(false)
      await expect(getComputedStyle(thumb).outlineStyle).toBe('none')
    })
    await step('moving the pointer, still pressed, to 30% drags the value to 3', async () => {
      pointer('pointermove', control, track, 0.3)
      await waitFor(() => expect(slider).toHaveAttribute('aria-valuenow', '3'))
      await expect(call(args.onChange)).toEqual({ value: 3, reason: 'drag' })
      await expect(spy(args.onChangeCommitted)).not.toHaveBeenCalled()
    })
    await step('releasing commits 3 once, with drag, and the drag ends', async () => {
      pointer('pointerup', control, track, 0.3)
      await waitFor(() => expect(thumb).not.toHaveAttribute('data-dragging'))
      await expect(spy(args.onChangeCommitted)).toHaveBeenCalledTimes(1)
      await expect(call(args.onChangeCommitted)).toEqual({ value: 3, reason: 'drag' })
    })
    await step('a key pressed after the press brings the ring back (CR-9)', async () => {
      await userEvent.keyboard('{ArrowRight}')
      await expect(slider).toHaveAttribute('aria-valuenow', '4')
      await expect(slider).toHaveFocus()
      await expect(slider.matches(':focus-visible')).toBe(true)
      await expect(getComputedStyle(thumb).outlineStyle).toBe('solid')
      await userEvent.keyboard('{ArrowLeft}')
      await expect(slider).toHaveAttribute('aria-valuenow', '3')
    })
    await step(
      'a press in the control’s padding moves the thumb to the nearer end (CR-10)',
      async () => {
        const box = control.getBoundingClientRect()
        const middle = box.top + box.height / 2
        pointerAt('pointerdown', control, box.left + 1, middle)
        pointerAt('pointerup', control, box.left + 1, middle)
        await waitFor(() => expect(slider).toHaveAttribute('aria-valuenow', '0'))
        await expect(call(args.onChangeCommitted)).toEqual({ value: 0, reason: 'track-press' })
        // at min, the thumb stays inside the control
        await expect(thumb.getBoundingClientRect().left).toBeGreaterThanOrEqual(box.left - 0.5)
        pointerAt('pointerdown', control, box.right - 1, middle)
        pointerAt('pointerup', control, box.right - 1, middle)
        await waitFor(() => expect(slider).toHaveAttribute('aria-valuenow', '10'))
        // and at max
        await expect(thumb.getBoundingClientRect().right).toBeLessThanOrEqual(box.right + 0.5)
      },
    )
    await step('a press and release at the middle commits 5, with track-press', async () => {
      const commits = spy(args.onChangeCommitted).mock.calls.length
      pointer('pointerdown', control, track, 0.5)
      pointer('pointerup', control, track, 0.5)
      await waitFor(() => expect(slider).toHaveAttribute('aria-valuenow', '5'))
      await waitFor(() => expect(thumb).not.toHaveAttribute('data-dragging'))
      await expect(spy(args.onChangeCommitted)).toHaveBeenCalledTimes(commits + 1)
      await expect(call(args.onChangeCommitted)).toEqual({ value: 5, reason: 'track-press' })
      slider.blur()
    })
  },
}

/** State disabled: the fill, the thumb's edge, the figure, the label and the help in tertiary ink. */
export const Disabled: Story = {
  args: { disabled: true },
  parameters: {
    // a disabled slider's words are color.text.tertiary, a miss Accessibility lists by name
    // (docs/foundations/accessibility.md) and WCAG 1.4.3 exempts for an inactive control, so
    // axe's contrast rule is off for this story alone
    a11y: { options: { rules: { 'color-contrast': { enabled: false } } } },
  },
  play: async ({ args, canvasElement, step }) => {
    const slider = sliderIn(canvasElement)
    const root = within(canvasElement).getByRole('group', { name: LABEL })
    const thumb = part(canvasElement, 'thumb')
    const control = part(canvasElement, 'control')
    await step('the input is disabled, and Tab passes it by', async () => {
      await expect(slider).toBeDisabled()
      await expect(root).toHaveAttribute('data-disabled')
      await expect(thumb).toHaveAttribute('data-disabled')
      await userEvent.tab()
      await expect(slider).not.toHaveFocus()
      await userEvent.tab({ shift: true })
    })
    await step(
      'every part in the tertiary ink, the thumb with no hover or pressed layer',
      async () => {
        const tertiary = colour('--perron-color-text-tertiary')
        await expect(getComputedStyle(part(canvasElement, 'indicator')).backgroundColor).toBe(
          fill('color-text-tertiary'),
        )
        await expect(getComputedStyle(thumb).borderColor).toBe(edge('color-text-tertiary'))
        await expect(getComputedStyle(thumb).backgroundColor).toBe(fill('color-surface-raised'))
        await expect(getComputedStyle(part(canvasElement, 'value')).color).toBe(tertiary)
        await expect(getComputedStyle(fieldPart(canvasElement, 'label')!).color).toBe(tertiary)
        await expect(getComputedStyle(fieldPart(canvasElement, 'description')!).color).toBe(
          tertiary,
        )
        await expect(getComputedStyle(control).cursor).toBe('default')
        // CR-12: the hover and pressed rules pass a disabled thumb by
        await expect(onHover(thumb, 'background-image')).toBe('')
        await expect(
          stateRules(thumb, ':active')
            .map((s) => s.getPropertyValue('background-image'))
            .filter(Boolean),
        ).toEqual([])
      },
    )
    await step('a press on the control changes nothing and calls no handler', async () => {
      pointer('pointerdown', control, part(canvasElement, 'track'), 0.8)
      pointer('pointerup', control, part(canvasElement, 'track'), 0.8)
      await expect(slider).toHaveAttribute('aria-valuenow', '5')
      await expect(spy(args.onChange)).not.toHaveBeenCalled()
      await expect(spy(args.onChangeCommitted)).not.toHaveBeenCalled()
    })
    await step(
      'inside an invalid field, it keeps its disabled look and is not invalid',
      async () => {
        await mounted(
          canvasElement,
          <PerronProvider locale="en">
            <Slider label="Disabled and invalid" disabled error="Choose 8 minutes or fewer" />
          </PerronProvider>,
          async (host) => {
            const input = await waitFor(() => sliderIn(host, 'Disabled and invalid'))
            await expect(input).not.toHaveAttribute('aria-invalid')
            await expect(getComputedStyle(part(host, 'thumb')).borderColor).toBe(
              edge('color-text-tertiary'),
            )
          },
        )
      },
    )
    await step('a focused thumb that turns disabled loses focus', async () => {
      await mounted(
        canvasElement,
        <PerronProvider locale="en">
          <DisablesOnChange label="Turns disabled" min={0} max={10} defaultValue={5} />
        </PerronProvider>,
        async (host) => {
          const input = await waitFor(() => sliderIn(host, 'Turns disabled'))
          input.focus()
          await expect(input).toHaveFocus()
          await userEvent.keyboard('{ArrowRight}')
          await waitFor(() => expect(input).toBeDisabled())
          await expect(input).not.toHaveFocus()
        },
      )
    })
  },
}

/** State invalid: the slider at 9 with the error "Choose 8 minutes or fewer", a danger edge. */
export const Invalid: Story = {
  args: { defaultValue: 9, error: 'Choose 8 minutes or fewer' },
  play: async ({ canvasElement }) => {
    const slider = sliderIn(canvasElement)
    const root = within(canvasElement).getByRole('group', { name: LABEL })
    const thumb = part(canvasElement, 'thumb')
    const description = fieldPart(canvasElement, 'description')!
    const error = fieldPart(canvasElement, 'error')!
    await expect(error).toHaveClass('pn-Field-error', 'pn-Slider-error')
    await expect(slider).toHaveAttribute('aria-invalid', 'true')
    await expect(root).toHaveAttribute('aria-invalid', 'true')
    await expect(root).toHaveAttribute('data-invalid')
    await expect(thumb).toHaveAttribute('data-invalid')
    // the help first, then the error
    await waitFor(() =>
      expect(slider.getAttribute('aria-describedby')).toBe(`${description.id} ${error.id}`),
    )
    await expect(slider).toHaveAccessibleDescription(`${DESCRIPTION} Choose 8 minutes or fewer`)
    await expect(getComputedStyle(thumb).borderColor).toBe(edge('color-status-danger'))
    // the fill and the figure keep their rest look
    await expect(getComputedStyle(part(canvasElement, 'indicator')).backgroundColor).toBe(
      fill('color-text-primary'),
    )
    await expect(getComputedStyle(part(canvasElement, 'value')).color).toBe(
      colour('--perron-color-text-primary'),
    )
    // with no error given, the field's own check shows its message when it fails
    await mounted(
      canvasElement,
      <PerronProvider locale="en">
        <Slider
          label="Checked"
          min={0}
          max={10}
          defaultValue={8}
          slotProps={{
            field: {
              validationMode: 'onChange',
              validate: (value) => ((value as number) > 8 ? 'Choose 8 minutes or fewer' : null),
            },
          }}
        />
      </PerronProvider>,
      async (host) => {
        const checked = await waitFor(() => sliderIn(host, 'Checked'))
        await expect(fieldPart(host, 'error')).toBeNull()
        checked.focus()
        await userEvent.keyboard('{ArrowRight}')
        await waitFor(() =>
          expect(fieldPart(host, 'error')).toHaveTextContent('Choose 8 minutes or fewer'),
        )
        await expect(checked).toHaveAttribute('aria-invalid', 'true')
        checked.blur()
      },
    )
  },
}

/** Renders `props` in `locale` on the server, as the owned-strings check reads a render. */
const markup = (props: SliderProps, locale: Locale) =>
  renderToStaticMarkup(
    <PerronProvider locale={locale}>
      <Slider {...props} />
    </PerronProvider>,
  )

/** A range: two thumbs at 4 and 12 of 30, the fill between them and the figure "4 – 12". */
export const Range: Story = {
  args: RANGE,
  play: async ({ args, canvasElement, step }) => {
    const root = within(canvasElement).getByRole('group', { name: RANGE.label })
    const minimum = sliderIn(canvasElement, 'Minimum')
    const maximum = sliderIn(canvasElement, 'Maximum')
    await step('two sliders, named and saying their value alone (CR-7)', async () => {
      await expect(within(root).getAllByRole('slider')).toEqual([minimum, maximum])
      await expect(minimum).toHaveAttribute('aria-valuetext', '4')
      await expect(maximum).toHaveAttribute('aria-valuetext', '12')
      await expect(root.outerHTML).not.toMatch(/start range|end range/)
      await expect(figure(canvasElement)).toBe('4 – 12')
    })
    await step('Tab reaches the lower thumb, then the upper one', async () => {
      await userEvent.tab()
      await expect(minimum).toHaveFocus()
      await userEvent.tab()
      await expect(maximum).toHaveFocus()
    })
    await step(
      'ArrowRight on the upper thumb raises it alone, ArrowLeft brings it back',
      async () => {
        await userEvent.keyboard('{ArrowRight}')
        await expect(figure(canvasElement)).toBe('4 – 13')
        await expect(maximum).toHaveAttribute('aria-valuetext', '13')
        await expect(call(args.onChange).value).toEqual([4, 13])
        await userEvent.keyboard('{ArrowLeft}')
        await expect(figure(canvasElement)).toBe('4 – 12')
        await userEvent.tab({ shift: true })
        await userEvent.tab({ shift: true })
        await expect(root.contains(document.activeElement)).toBe(false)
      },
    )
    await step('the figure’s sizers write each end twice (CR-8)', async () => {
      await expect(sizers(canvasElement)).toEqual(['0 – 0', '30 – 30'])
    })
    await step('a press on the label focuses nothing', async () => {
      await userEvent.click(fieldPart(canvasElement, 'label')!)
      await expect(root.contains(document.activeElement)).toBe(false)
    })
    await step(
      'Home on the upper thumb and End on the lower stop at the other, less the steps between',
      async () => {
        await mounted(
          canvasElement,
          <PerronProvider locale="en">
            <Slider {...RANGE} label="Spaced" minStepsBetweenValues={2} />
          </PerronProvider>,
          async (host) => {
            const lower = await waitFor(() => sliderIn(host, 'Minimum'))
            const upper = sliderIn(host, 'Maximum')
            upper.focus()
            await userEvent.keyboard('{Home}')
            await expect(figure(host)).toBe('4 – 6')
            await userEvent.keyboard('{End}')
            await expect(figure(host)).toBe('4 – 30')
            lower.focus()
            await userEvent.keyboard('{End}')
            await expect(figure(host)).toBe('28 – 30')
            await userEvent.keyboard('{Home}')
            await expect(figure(host)).toBe('0 – 30')
            lower.blur()
          },
        )
      },
    )
    await step('dragging the lower thumb past the upper pushes it; a range is sorted', async () => {
      const onChange = fn()
      const onChangeCommitted = fn()
      await mounted(
        canvasElement,
        <PerronProvider locale="en">
          <Slider
            {...RANGE}
            label="Pushed"
            onChange={onChange}
            onChangeCommitted={onChangeCommitted}
          />
          <Slider {...RANGE} label="Sorted" defaultValue={[12, 4]} />
        </PerronProvider>,
        async (host) => {
          const [pushed, sorted] = await waitFor(() => {
            const fields = Array.from(host.querySelectorAll<HTMLElement>('.pn-Slider-field'))
            expect(fields).toHaveLength(2)
            return fields
          })
          await expect(figure(sorted)).toBe('4 – 12')
          const control = part(pushed, 'control')
          const track = part(pushed, 'track')
          pointer('pointerdown', control, track, 4 / 30)
          pointer('pointermove', control, track, 20 / 30)
          await waitFor(() => expect(figure(pushed)).toBe('20 – 20'))
          await expect(call(onChange)).toEqual({ value: [20, 20], reason: 'drag' })
          pointer('pointerup', control, track, 20 / 30)
          await waitFor(() => expect(onChangeCommitted).toHaveBeenCalledTimes(1))
          await expect(call(onChangeCommitted)).toEqual({ value: [20, 20], reason: 'drag' })
          ;(document.activeElement as HTMLElement | null)?.blur()
        },
      )
    })
    await step('the caller’s own thumb names and value texts win (CR-7)', async () => {
      await mounted(
        canvasElement,
        <PerronProvider locale="en">
          <Slider
            {...RANGE}
            label="Own words"
            slotProps={{
              thumb: {
                getAriaLabel: (index) => (index === 0 ? 'From' : 'To'),
                getAriaValueText: (formatted) => `${formatted} departures`,
              },
            }}
          />
          <Slider
            {...RANGE}
            label="Own label"
            slotProps={{ thumb: { 'aria-label': 'Bound', 'aria-valuetext': 'Any' } }}
          />
          <span id="slider-ends">Ends</span>
          <Slider
            {...RANGE}
            label="Labelled by"
            slotProps={{ thumb: { 'aria-labelledby': 'slider-ends' } }}
          />
        </PerronProvider>,
        async (host) => {
          const from = await waitFor(() => sliderIn(host, 'From'))
          await expect(from).toHaveAttribute('aria-valuetext', '4 departures')
          await expect(sliderIn(host, 'To')).toHaveAttribute('aria-valuetext', '12 departures')
          const bound = within(host).getAllByRole('slider', { name: 'Bound' })
          await expect(bound).toHaveLength(2)
          for (const input of bound) await expect(input).toHaveAttribute('aria-valuetext', 'Any')
          const ends = within(host).getAllByRole('slider', { name: 'Ends' })
          await expect(ends).toHaveLength(2)
          // a caller's name alone leaves Slider's value text in place, the value alone
          await expect(ends.map((input) => input.getAttribute('aria-valuetext'))).toEqual([
            '4',
            '12',
          ])
          await expect(within(host).queryAllByRole('slider', { name: /Minimum|Maximum/ })).toEqual(
            [],
          )
        },
      )
    })
    await step('minimumLabel and maximumLabel name the thumbs', async () => {
      await mounted(
        canvasElement,
        <PerronProvider locale="en">
          <Slider {...args} minimumLabel="Fewest" maximumLabel="Most" />
        </PerronProvider>,
        async (host) => {
          await waitFor(() => expect(sliderIn(host, 'Fewest')).toBeInTheDocument())
          await expect(sliderIn(host, 'Most')).toBeInTheDocument()
        },
      )
    })
    await step('its render says only the dictionary’s and the caller’s words (CR-14)', async () => {
      for (const locale of ['en', 'da', 'sv', 'nb'] as const)
        expectOwnedStrings(markup(args, locale), locale, [RANGE.label, RANGE.description])
    })
  },
}

/** Walking distance in kilometres, in English and in a Danish PerronProvider. */
const UNITS = {
  label: 'Walking distance',
  description: undefined,
  min: 0.5,
  max: 3,
  step: 0.5,
  defaultValue: 1.5,
  format: { style: 'unit', unit: 'kilometer' },
} satisfies Partial<SliderProps>

/** A distance with its unit in `format`: "1.5 km", beside the same slider in Danish, "1,5 km". */
export const Units: Story = {
  args: UNITS,
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--perron-space-400)' }}>
      <Slider {...args} />
      <PerronProvider locale="da">
        <Slider {...args} />
      </PerronProvider>
    </div>
  ),
  play: async ({ args, canvasElement, step }) => {
    const [english, danish] = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('.pn-Slider-field'),
    )
    const slider = sliderIn(english, UNITS.label)
    await step('the figure and the value text in each provider’s locale (CR-13)', async () => {
      // with no description given, none is rendered
      await expect(fieldPart(english, 'description')).toBeNull()
      await expect(figure(english)).toBe('1.5 km')
      await expect(slider).toHaveAttribute('aria-valuetext', '1.5 km')
      await expect(figure(danish)).toBe('1,5 km')
      await expect(sliderIn(danish, UNITS.label)).toHaveAttribute('aria-valuetext', '1,5 km')
    })
    await step('the sizers are the ends in the same locale and format (CR-8)', async () => {
      await expect(sizers(english)).toEqual(['0.5 km', '3 km'])
      await expect(sizers(danish)).toEqual(['0,5 km', '3 km'])
    })
    await step('ArrowRight makes it "2 km" on one line, the track as wide (CR-8)', async () => {
      const width = part(english, 'track').getBoundingClientRect().width
      slider.focus()
      await userEvent.keyboard('{ArrowRight}')
      await expect(figure(english)).toBe('2 km')
      await expect(part(english, 'track').getBoundingClientRect().width).toBe(width)
      for (const field of [english, danish])
        await expect(lines(part(field, 'valueText'))).toBeLessThan(1.5)
      await userEvent.keyboard('{ArrowLeft}')
      await expect(figure(english)).toBe('1.5 km')
      slider.blur()
    })
    await step('a caller’s locale wins over the PerronProvider’s (CR-13)', async () => {
      await mounted(
        canvasElement,
        <PerronProvider locale="da">
          <Slider {...args} label="Own locale" locale="en" />
        </PerronProvider>,
        async (host) => {
          const own = await waitFor(() => sliderIn(host, 'Own locale'))
          await expect(figure(host)).toBe('1.5 km')
          await expect(own).toHaveAttribute('aria-valuetext', '1.5 km')
          await expect(sizers(host)).toEqual(['0.5 km', '3 km'])
        },
      )
    })
  },
}

/** The value held in the story's state, set from each change. */
function ControlledSlider(props: SliderProps) {
  const [value, setValue] = useState<SliderProps['value']>(5)
  return (
    <Slider
      {...props}
      defaultValue={undefined}
      value={value}
      onChange={(event, next, details) => {
        props.onChange?.(event, next, details)
        setValue(next)
      }}
    />
  )
}

/** `value` held in the story's state, starting at 5. */
export const Controlled: Story = {
  render: (args) => <ControlledSlider {...args} />,
  play: async ({ args, canvasElement, step }) => {
    const slider = sliderIn(canvasElement)
    const root = within(canvasElement).getByRole('group', { name: LABEL })
    const start = document.activeElement
    await step('the caller sets the value onChange gives', async () => {
      slider.focus()
      await userEvent.keyboard('{ArrowRight}')
      await expect(call(args.onChange).value).toBe(6)
      await expect(figure(canvasElement)).toBe('6')
      await expect(slider).toHaveAttribute('aria-valuenow', '6')
      await waitFor(() => expect(root).toHaveAttribute('data-dirty'))
      await expect(part(canvasElement, 'thumb')).toHaveAttribute('data-dirty')
    })
    await step('a caller that ignores the change keeps the value', async () => {
      await mounted(
        canvasElement,
        <PerronProvider locale="en">
          <Slider {...args} defaultValue={undefined} value={5} label="Ignored" />
        </PerronProvider>,
        async (host) => {
          const ignored = await waitFor(() => sliderIn(host, 'Ignored'))
          ignored.focus()
          await userEvent.keyboard('{ArrowRight}')
          await expect(ignored).toHaveAttribute('aria-valuenow', '5')
          await expect(figure(host)).toBe('5')
        },
      )
    })
    await step('details.cancel() keeps an uncontrolled value, and commits nothing', async () => {
      const commits = spy(args.onChangeCommitted).mock.calls.length
      await mounted(
        canvasElement,
        <PerronProvider locale="en">
          <Slider {...args} label="Cancelled" onChange={(_e, _v, details) => details.cancel()} />
        </PerronProvider>,
        async (host) => {
          const cancelled = await waitFor(() => sliderIn(host, 'Cancelled'))
          cancelled.focus()
          await userEvent.keyboard('{ArrowRight}')
          await expect(cancelled).toHaveAttribute('aria-valuenow', '5')
          await expect(figure(host)).toBe('5')
          await expect(spy(args.onChangeCommitted)).toHaveBeenCalledTimes(commits)
        },
      )
    })
    await step('back at 5, with focus where it started', async () => {
      slider.focus()
      await userEvent.keyboard('{ArrowLeft}')
      await expect(figure(canvasElement)).toBe('5')
      slider.blur()
      await expect(document.activeElement).toBe(start)
    })
  },
}

/** `hiddenLabel`: the help, the track and the figure, no label in view. */
export const HiddenLabel: Story = {
  args: { hiddenLabel: true },
  parameters: {
    // axe's label-title-only fails a control with no visible label text that has a title or an
    // aria-describedby, and here the description's aria-describedby trips it on the hidden label,
    // the point of the story; so the rule is off for it alone: the slider is still named by the
    // label, through aria-labelledby
    a11y: { options: { rules: { 'label-title-only': { enabled: false } } } },
  },
  play: async ({ canvasElement }) => {
    const label = fieldPart(canvasElement, 'label')!
    await expect(label.tagName).toBe('SPAN')
    await expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(1)
    await expect(within(canvasElement).getByRole('group')).toHaveAccessibleName(LABEL)
    await expect(sliderIn(canvasElement)).toHaveAccessibleName(LABEL)
  },
}

/** Inside a native `<form>`: a single slider named "trail" and a range named "departures". */
export const InForm: Story = {
  args: { name: 'trail' },
  render: (args) => (
    <form
      onSubmit={(event) => event.preventDefault()}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--perron-space-400)' }}
    >
      <Slider {...args} />
      <Slider {...RANGE} name="departures" />
      <div>
        <Button type="submit">Show stops</Button>
      </div>
    </form>
  ),
  play: async ({ args, canvasElement }) => {
    const form = canvasElement.querySelector('form')!
    await expect(new FormData(form).get('trail')).toBe('5')
    await expect(new FormData(form).getAll('departures')).toEqual(['4', '12'])
    const slider = sliderIn(canvasElement)
    slider.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(new FormData(form).get('trail')).toBe('6')
    // a form library reads the value and the name from the event's target (CR-6)
    await expect(eventOf(args.onChange).event.target).toEqual({ value: 6, name: 'trail' })
    await userEvent.keyboard('{ArrowLeft}')
    await expect(new FormData(form).get('trail')).toBe('5')
    slider.blur()
  },
}

const COMPOUND = 'Hovedstadsområdetsbuslinjestoppestedsoversigtskortudgivelsen'

/** A Danish compound longer than its line in the label and in the help, with the figure "5". */
export const LongWords: Story = {
  args: { label: COMPOUND, description: `Minutter vist bag hver ${COMPOUND}` },
  play: async ({ canvasElement }) => {
    const frame = fieldPart(canvasElement, 'field')!
    const container = frame.parentElement!
    const bounds = frame.getBoundingClientRect()
    for (const name of ['label', 'description'] as const) {
      const element = fieldPart(canvasElement, name)!
      await expect(lines(element)).toBeGreaterThan(1.5)
      await expect(element.getBoundingClientRect().right).toBeLessThanOrEqual(bounds.right + 0.5)
    }
    await expect(figure(canvasElement)).toBe('5')
    await expect(lines(part(canvasElement, 'valueText'))).toBeLessThan(1.5)
    const control = part(canvasElement, 'control').getBoundingClientRect()
    await expect(control.right).toBeLessThanOrEqual(container.getBoundingClientRect().right + 0.5)
    await expect(container.scrollWidth).toBe(container.clientWidth)
    // the label, the help and the error render an element and a list as a string
    await mounted(
      canvasElement,
      <PerronProvider locale="en">
        <Slider
          label={
            <span>
              Trail <em>length</em>
            </span>
          }
          description={['Minutes of movement', ' drawn behind each vehicle']}
          error={<strong>Choose 8 minutes or fewer</strong>}
        />
      </PerronProvider>,
      async (host) => {
        const input = await waitFor(() => sliderIn(host, LABEL))
        await expect(within(host).getByRole('group')).toHaveAccessibleName(LABEL)
        await expect(input).toHaveAccessibleDescription(`${DESCRIPTION} Choose 8 minutes or fewer`)
      },
    )
  },
}
