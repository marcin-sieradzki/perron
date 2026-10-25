// Slider's stories: the states of the deferred design, Default, Hover, Focus, Pressed, Disabled and
// Invalid, and the stories of content and behaviour the spec's Stories table names
// (docs/components/slider.md), each in a 320 px container. Hover, focus and pressed render at rest;
// their plays drive them.
import { useState } from 'react'
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

/**
 * A mouse event at a fraction of the way along `track`, dispatched on `target`. Base UI's control
 * reads only `clientX`, `clientY`, the button and the buttons held; a pointer id of 0 asks it to
 * capture no pointer, which a synthetic event has none of.
 */
function pointer(type: string, target: Element, track: Element, along: number) {
  const box = track.getBoundingClientRect()
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerType: 'mouse',
      isPrimary: true,
      button: 0,
      buttons: type === 'pointerup' ? 0 : 1,
      clientX: box.left + box.width * along,
      clientY: box.top + box.height / 2,
    }),
  )
}

/** The subject story, State default: the label, the help, the track filled to 5 of 10 and "5". */
export const Default: Story = {
  play: async ({ args, canvasElement, step }) => {
    const slider = sliderIn(canvasElement)
    const root = within(canvasElement).getByRole('group', { name: LABEL })
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
      await expect(figure(canvasElement)).toBe('5')
      await expect(part(canvasElement, 'control')).toHaveAttribute('data-base-ui-swipe-ignore', 'x')
    })
    await step(
      'Tab focuses the slider; ArrowRight steps it and calls each handler once',
      async () => {
        await userEvent.tab()
        await expect(slider).toHaveFocus()
        await userEvent.keyboard('{ArrowRight}')
        await expect(slider).toHaveAttribute('aria-valuenow', '6')
        await expect(figure(canvasElement)).toBe('6')
        await expect(spy(args.onChange)).toHaveBeenCalledTimes(1)
        await expect(call(args.onChange)).toEqual({ value: 6, reason: 'keyboard' })
        await expect(spy(args.onChangeCommitted)).toHaveBeenCalledTimes(1)
        await expect(call(args.onChangeCommitted).value).toBe(6)
      },
    )
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
    await step('Home, PageUp and PageDown move to the ends and by one large step', async () => {
      await userEvent.keyboard('{Home}')
      await expect(slider).toHaveAttribute('aria-valuenow', '0')
      await userEvent.keyboard('{PageUp}')
      await expect(slider).toHaveAttribute('aria-valuenow', '10')
      await userEvent.keyboard('{PageDown}')
      await expect(slider).toHaveAttribute('aria-valuenow', '0')
    })
    await step('ArrowUp and ArrowDown step it; with Shift, by one large step', async () => {
      await userEvent.keyboard('{ArrowUp}')
      await expect(slider).toHaveAttribute('aria-valuenow', '1')
      await userEvent.keyboard('{ArrowDown}')
      await expect(slider).toHaveAttribute('aria-valuenow', '0')
      await userEvent.keyboard('{Shift>}{ArrowUp}{/Shift}')
      await expect(slider).toHaveAttribute('aria-valuenow', '10')
      await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}')
      await expect(slider).toHaveAttribute('aria-valuenow', '0')
    })
    await step('five steps bring it back to 5, and Shift+Tab moves focus out', async () => {
      await userEvent.keyboard('{ArrowRight>5/}')
      await expect(slider).toHaveAttribute('aria-valuenow', '5')
      await userEvent.tab({ shift: true })
      await expect(slider).not.toHaveFocus()
    })
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
    await step('moving the pointer, still pressed, to 30% drags the value to 3', async () => {
      pointer('pointermove', control, track, 0.3)
      await waitFor(() => expect(slider).toHaveAttribute('aria-valuenow', '3'))
      await expect(call(args.onChange)).toEqual({ value: 3, reason: 'drag' })
      await expect(spy(args.onChangeCommitted)).not.toHaveBeenCalled()
    })
    await step('releasing commits 3 once, and the drag ends', async () => {
      pointer('pointerup', control, track, 0.3)
      await waitFor(() => expect(thumb).not.toHaveAttribute('data-dragging'))
      await expect(spy(args.onChangeCommitted)).toHaveBeenCalledTimes(1)
      await expect(call(args.onChangeCommitted).value).toBe(3)
    })
    await step('a press and release at the middle puts it back at 5', async () => {
      pointer('pointerdown', control, track, 0.5)
      pointer('pointerup', control, track, 0.5)
      await waitFor(() => expect(slider).toHaveAttribute('aria-valuenow', '5'))
      await waitFor(() => expect(thumb).not.toHaveAttribute('data-dragging'))
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
  play: async ({ args, canvasElement }) => {
    const slider = sliderIn(canvasElement)
    const root = within(canvasElement).getByRole('group', { name: LABEL })
    const thumb = part(canvasElement, 'thumb')
    const control = part(canvasElement, 'control')
    await expect(slider).toBeDisabled()
    await expect(root).toHaveAttribute('data-disabled')
    await expect(thumb).toHaveAttribute('data-disabled')
    await userEvent.tab()
    await expect(slider).not.toHaveFocus()
    const tertiary = colour('--perron-color-text-tertiary')
    await expect(getComputedStyle(part(canvasElement, 'indicator')).backgroundColor).toBe(
      fill('color-text-tertiary'),
    )
    await expect(getComputedStyle(thumb).borderColor).toBe(edge('color-text-tertiary'))
    await expect(getComputedStyle(thumb).backgroundColor).toBe(fill('color-surface-raised'))
    await expect(getComputedStyle(part(canvasElement, 'value')).color).toBe(tertiary)
    await expect(getComputedStyle(fieldPart(canvasElement, 'label')!).color).toBe(tertiary)
    await expect(getComputedStyle(fieldPart(canvasElement, 'description')!).color).toBe(tertiary)
    await expect(getComputedStyle(control).cursor).toBe('default')
    pointer('pointerdown', control, part(canvasElement, 'track'), 0.8)
    pointer('pointerup', control, part(canvasElement, 'track'), 0.8)
    await expect(slider).toHaveAttribute('aria-valuenow', '5')
    await expect(spy(args.onChange)).not.toHaveBeenCalled()
    await expect(spy(args.onChangeCommitted)).not.toHaveBeenCalled()
    await userEvent.tab({ shift: true })
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
    await expect(getComputedStyle(part(canvasElement, 'indicator')).backgroundColor).toBe(
      fill('color-text-primary'),
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
  play: async ({ canvasElement }) => {
    const [english, danish] = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('.pn-Slider-field'),
    )
    const slider = sliderIn(english, UNITS.label)
    await expect(figure(english)).toBe('1.5 km')
    await expect(slider).toHaveAttribute('aria-valuetext', '1.5 km')
    await expect(figure(danish)).toBe('1,5 km')
    await expect(sliderIn(danish, UNITS.label)).toHaveAttribute('aria-valuetext', '1,5 km')
    slider.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(figure(english)).toBe('2 km')
    for (const field of [english, danish])
      await expect(lines(part(field, 'valueText'))).toBeLessThan(1.5)
    await userEvent.keyboard('{ArrowLeft}')
    await expect(figure(english)).toBe('1.5 km')
    slider.blur()
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
    await step('details.cancel() keeps an uncontrolled value', async () => {
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
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form')!
    await expect(new FormData(form).get('trail')).toBe('5')
    await expect(new FormData(form).getAll('departures')).toEqual(['4', '12'])
    const slider = sliderIn(canvasElement)
    slider.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(new FormData(form).get('trail')).toBe('6')
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
  },
}
