// TopBar's stories: one per row of the spec's Stories table (docs/patterns/top-bar.md), with the
// design deferred, each over a map-like backdrop that shows the glass, with Mylder's five mode chips
// in `filters` and its language link and About button in `tools`, and their play tests, which read
// what the eye sees and what the ear hears.
import { createRef } from 'react'
import type { CSSProperties } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import info from '../../../icons/info.svg?raw'
import { FilterChip } from '../../components/FilterChip/FilterChip.tsx'
import { IconButton } from '../../components/IconButton/IconButton.tsx'
import { LinkButton } from '../../components/LinkButton/LinkButton.tsx'
import { PerronProvider } from '../../PerronProvider.tsx'
import { dictionaries, type Locale } from '../../locale/index.ts'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import {
  colour,
  frames,
  heard,
  icon,
  lines,
  mounted,
  pressedAfterHover,
  resolve,
  stateFill,
} from '../../testing/stories.ts'
import { TopBar } from './TopBar.tsx'
import type { TopBarProps } from './TopBar.tsx'

/**
 * A map-like backdrop of water, land, a park and two lines, under the bar's glass, so the blur has
 * something to soften.
 */
const UNDER_THE_BAR: CSSProperties = {
  background: [
    'linear-gradient(0deg, transparent 0 40%, var(--perron-color-transit-line-a) 40% 43%, transparent 43%)',
    'linear-gradient(115deg, transparent 0 55%, var(--perron-color-transit-mode-bus) 55% 57%, transparent 57%)',
    'radial-gradient(circle at 70% 30%, var(--perron-color-map-park) 0 18%, transparent 18%)',
    'linear-gradient(90deg, var(--perron-color-map-water) 0 30%, var(--perron-color-map-land) 30%)',
  ].join(', '),
  padding: 'var(--perron-size-panel-gap)',
  minBlockSize: 'calc(var(--perron-size-top-bar) * 3)',
}

/** The map the bar floats over, `size.panel-gap` from its edges, as its screen places it. */
const overTheMap: Decorator = (Story) => (
  <div style={UNDER_THE_BAR}>
    <Story />
  </div>
)

/** A container of `width` px around the story, for a screen of that width. */
const inside =
  (width: number): Decorator =>
  (Story) => (
    <div style={{ inlineSize: width }}>
      <Story />
    </div>
  )

/** Mylder's modes, each with the trips it has underway; Train is off, so both chip looks show. */
const MODES = [
  { label: 'Bus', count: 412, on: true },
  { label: 'Metro', count: 38, on: true },
  { label: 'S-tog', count: 61, on: true },
  { label: 'Train', count: 24, on: false },
  { label: 'Light rail', count: 9, on: true },
]

/** The mode filters as the caller writes them: a FilterChip for each, keeping its own state. */
const FILTERS = MODES.map((mode) => (
  <FilterChip key={mode.label} defaultSelected={mode.on} count={mode.count}>
    {mode.label}
  </FilterChip>
))

/** The tools as Mylder writes them: the language link and the About button. */
const TOOLS = (
  <>
    <LinkButton href="/da" hrefLang="da" lang="da" variant="outline" size="small">
      Dansk
    </LinkButton>
    <IconButton label="About Mylder" size="large">
      {icon(info)}
    </IconButton>
  </>
)

/** What the caller gives `MediumDefault`: every word the bar shows that isn't its own. */
const CALLER_WORDS = [...MODES.map((mode) => mode.label), 'Dansk', 'About Mylder']

const meta = {
  title: 'Patterns/TopBar',
  component: TopBar,
  args: { brandHref: '/en', time: '08:14:05', filters: FILTERS, tools: TOOLS },
  decorators: [overTheMap],
} satisfies Meta<typeof TopBar>

export default meta

type Story = StoryObj<typeof meta>

/** The bar in `scope`, once it has rendered. */
const barIn = (scope: HTMLElement) =>
  waitFor(() => {
    const found = scope.querySelector<HTMLElement>('.pn-TopBar')
    expect(found).not.toBeNull()
    return found!
  })

/** One part of the bar, by its name after `pn-TopBar-`. */
const part = (bar: Element, name: string) => bar.querySelector<HTMLElement>(`.pn-TopBar-${name}`)

/** The class names of the root's children, in the DOM's order. */
const groupsOf = (bar: Element) =>
  [...bar.children].map((child) => child.className.replace(/^pn-TopBar-(\w+).*$/, '$1'))

/** The room a focus ring takes outside its element: `focus.width` and `focus.offset`. */
const ringRoom = () =>
  Number.parseFloat(resolve('outlineWidth', 'var(--perron-focus-width)')) +
  Number.parseFloat(resolve('outlineOffset', 'var(--perron-focus-offset)'))

/** A length token in pixels, as it renders on `min-block-size`. */
const px = (token: string) => Number.parseFloat(resolve('minBlockSize', `var(--perron-${token})`))

/**
 * From a button placed before the story, Tab reaches each of `order` in turn and Shift+Tab walks
 * back through them to the button; removes the button after.
 */
async function expectTabOrder(canvas: HTMLElement, order: HTMLElement[]) {
  const before = document.createElement('button')
  before.textContent = 'Before the bar'
  canvas.before(before)
  before.focus()
  try {
    for (const element of order) {
      await userEvent.tab()
      await expect(element).toHaveFocus()
    }
    for (const element of [...order].reverse().slice(1)) {
      await userEvent.tab({ shift: true })
      await expect(element).toHaveFocus()
    }
    await userEvent.tab({ shift: true })
    await expect(before).toHaveFocus()
  } finally {
    before.remove()
  }
}

/** The bar's controls, as the ear finds them: the brand's link, the chips and the two tools. */
const controlsIn = (canvas: HTMLElement) => {
  const scope = within(canvas)
  return {
    brand: scope.queryByRole('link', { name: 'Mylder' }),
    chips: [...canvas.querySelectorAll<HTMLElement>('.pn-FilterChip')],
    language: scope.getByRole('link', { name: 'Dansk' }),
    about: scope.getByRole('button', { name: 'About Mylder' }),
  }
}

/** Each part of the bar's `slotProps`, given `props`, for the own-props checks. */
const everySlot = (props: (name: string) => object) =>
  Object.fromEntries(
    ['identity', 'brand', 'status', 'paused', 'separator', 'time', 'filters', 'tools'].map(
      (name) => [name, props(name)],
    ),
  ) as TopBarProps['slotProps']

/**
 * The wide screen's bar at 08:14:05 with the five mode chips, the language link and About, in a
 * 1024 px container; the contract story renders it.
 */
export const MediumDefault: Story = {
  decorators: [inside(1024)],
  play: async ({ canvasElement, step }) => {
    const bar = await barIn(canvasElement)
    const status = part(bar, 'status')!
    const time = part(bar, 'time')!
    const filters = part(bar, 'filters')!
    await step('Surface’s glass, one row at least size.top-bar tall (CR-2, CR-3)', async () => {
      await expect(bar.className).toBe('pn-Surface pn-TopBar')
      await expect(bar).toHaveAttribute('data-variant', 'glass')
      await expect(bar).toHaveAttribute('data-size', 'medium')
      await expect(bar.tagName).toBe('DIV')
      await expect(bar.getBoundingClientRect().height).toBeGreaterThanOrEqual(px('size-top-bar'))
      await expect(groupsOf(bar)).toEqual(['identity', 'filters', 'tools'])
      await expect([...part(bar, 'identity')!.children]).toEqual([part(bar, 'brand'), status])
      // one row: each group's middle is inside the identity's height
      const row = part(bar, 'identity')!.getBoundingClientRect()
      for (const group of bar.children) {
        const box = group.getBoundingClientRect()
        await expect((box.top + box.bottom) / 2).toBeGreaterThan(row.top)
        await expect((box.top + box.bottom) / 2).toBeLessThan(row.bottom)
      }
    })
    await step('the brand: a link to the start screen, named "Mylder" (CR-5)', async () => {
      const brand = part(bar, 'brand')!
      await expect(brand.tagName).toBe('A')
      await expect(brand).toHaveAttribute('href', '/en')
      await expect(brand).toHaveClass('pn-Brand')
      await expect(brand).toHaveAttribute('data-variant', 'full')
      await expect(within(canvasElement).getByRole('link', { name: 'Mylder' })).toBe(brand)
      // a quiet control's pointer feedback, the press a step past the hover (Pointer feedback)
      await expect(stateFill(brand)).toBe('var(--perron-color-surface-hover)')
      await expect(stateFill(brand, ':active')).toBe('var(--perron-color-surface-selected)')
      await expect(pressedAfterHover(brand)).toBe(true)
      await expect(getComputedStyle(brand).cursor).toBe('pointer')
      // the box padded at its sides and taken back, so the lockup sits where the identity starts
      const mark = brand.querySelector('.pn-Brand-mark')!.getBoundingClientRect()
      const start = part(bar, 'identity')!.getBoundingClientRect().left
      await expect(mark.left).toBeCloseTo(start, 0)
    })
    await step(
      'the status line: "Updated 08:14:05" in data-sm and secondary ink (CR-4)',
      async () => {
        await expect(status).toHaveClass('pn-Text')
        await expect(status.className).toBe('pn-Text pn-TopBar-status')
        await expect(status).toHaveAttribute('data-variant', 'data-sm')
        await expect(status).toHaveAttribute('data-emphasis', 'secondary')
        // the role's family, size, weight and line height, as the font shorthand sets them
        const role = resolve('font', 'var(--perron-typography-data-sm)')
        await expect(role).toContain('JetBrains Mono')
        const own = getComputedStyle(status)
        await expect(role).toBe(
          `${own.fontWeight} ${own.fontSize} / ${own.lineHeight} ${own.fontFamily}`,
        )
        await expect(getComputedStyle(status).color).toBe(colour('--perron-color-text-secondary'))
        await expect(heard(status)).toBe('Updated 08:14:05')
        await expect(time.tagName).toBe('TIME')
        await expect(time).toHaveAttribute('dateTime', '08:14:05')
        // one owned phrase, one text run
        await expect(time.childNodes).toHaveLength(1)
        await expect(time.firstChild?.nodeType).toBe(Node.TEXT_NODE)
        await expect(bar).not.toHaveAttribute('data-paused')
        await expect(bar).not.toHaveAttribute('data-out-of-date')
        await expect(part(bar, 'paused')).toBeNull()
      },
    )
    await step(
      'the filters: a group named "Filters", holding the caller’s chips (CR-7)',
      async () => {
        const group = within(canvasElement).getByRole('group', { name: 'Filters' })
        await expect(group).toBe(filters)
        await expect(group.tagName).toBe('FIELDSET')
        await expect(within(group).getAllByRole('button')).toHaveLength(MODES.length)
        const style = getComputedStyle(group)
        await expect([style.borderTopStyle, style.marginTop, style.paddingTop]).toEqual([
          'none',
          '0px',
          '0px',
        ])
      },
    )
    await step(
      'no live region, and the text holds still between updates (CR-6, CR-13)',
      async () => {
        await expect(bar.querySelector('[aria-live], [role="status"], [role="log"]')).toBeNull()
        const before = bar.textContent
        await frames(30)
        await expect(bar.textContent).toBe(before)
      },
    )
    await step('Tab: the brand, the chips in order, then the tools; Shift+Tab back', async () => {
      const controls = controlsIn(canvasElement)
      await expectTabOrder(canvasElement, [
        controls.brand!,
        ...controls.chips,
        controls.language,
        controls.about,
      ])
    })
    await step('a chip keeps its own state: a click turns Train on (CR-7)', async () => {
      const train = controlsIn(canvasElement).chips[3]
      await expect(train).toHaveAttribute('aria-pressed', 'false')
      await userEvent.click(train)
      await expect(train).toHaveAttribute('aria-pressed', 'true')
      await userEvent.click(train)
      await expect(train).toHaveAttribute('aria-pressed', 'false')
      train.blur()
    })
    await step('className, ref, as an object and as a callback, and style (CR-11)', async () => {
      const held = createRef<HTMLDivElement>()
      let called: HTMLDivElement | null = null
      await mounted(
        canvasElement,
        <>
          <TopBar
            time="08:14:05"
            className="caller"
            ref={held}
            style={{ opacity: 0.5 }}
            data-testid="object"
          />
          <TopBar
            time="08:14:05"
            ref={(element) => {
              called = element
            }}
            data-testid="callback"
          />
        </>,
        async (host) => {
          const object = await waitFor(() => within(host).getByTestId('object'))
          await expect(object.className).toBe('pn-Surface pn-TopBar caller')
          await expect(held.current).toBe(object)
          await expect(called).toBe(within(host).getByTestId('callback'))
          await expect(getComputedStyle(object).opacity).toBe('0.5')
        },
      )
    })
    await step('its own props never reach the DOM (CR-11)', async () => {
      await mounted(
        canvasElement,
        <TopBar
          size="small"
          brandHref="/en"
          time="08:14:05"
          paused
          outOfDate
          filters={FILTERS}
          tools={TOOLS}
          updatedLabel="As of {time}"
          updatedOutOfDateLabel="As of {time}, could be old"
          sourcePausedLabel="On hold"
          filtersLabel="Modes"
          brandNameLabel="Perron"
          slotProps={everySlot(() => ({}))}
        />,
        async (host) => {
          const own = await barIn(host)
          await expect(own.getAttributeNames().sort()).toEqual(
            ['class', 'data-out-of-date', 'data-paused', 'data-size', 'data-variant'].sort(),
          )
        },
      )
    })
    await step('each slotProps className joins after its part’s own (CR-12)', async () => {
      await mounted(
        canvasElement,
        <TopBar
          brandHref="/en"
          time="08:14:05"
          paused
          filters={FILTERS}
          tools={TOOLS}
          slotProps={everySlot((name) => ({ className: `caller-${name}` }))}
        />,
        async (host) => {
          const own = await barIn(host)
          for (const name of ['identity', 'paused', 'separator', 'time', 'filters', 'tools'])
            await expect(part(own, name)!.className).toBe(`pn-TopBar-${name} caller-${name}`)
          await expect(part(own, 'brand')!.className).toBe('pn-Brand pn-TopBar-brand caller-brand')
          await expect(part(own, 'status')!.className).toBe(
            'pn-Text pn-TopBar-status caller-status',
          )
        },
      )
    })
    await step('the pattern’s own props win over each slotProps value (CR-12)', async () => {
      await mounted(
        canvasElement,
        <TopBar
          time="08:14:05"
          paused
          filters={FILTERS}
          tools={TOOLS}
          slotProps={
            {
              paused: { children: 'Caller paused' },
              separator: { children: 'Caller separator' },
              status: { children: 'Caller status' },
              time: { dateTime: '23:59:59', children: 'Caller time' },
              filters: { 'aria-label': 'Caller filters', children: 'Caller filters' },
              tools: { children: 'Caller tools' },
              brand: { variant: 'mark' },
            } as TopBarProps['slotProps']
          }
        />,
        async (host) => {
          const own = await barIn(host)
          await expect(own.textContent).not.toContain('Caller')
          await expect(heard(part(own, 'status')!)).toBe('Paused · Updated 08:14:05')
          await expect(own).toHaveAttribute('data-paused', '')
          await expect(part(own, 'time')).toHaveAttribute('dateTime', '08:14:05')
          await expect(part(own, 'filters')).toHaveAttribute('aria-label', 'Filters')
          // the brand's variant is the slot's to pick (CR-5)
          await expect(part(own, 'brand')).toHaveAttribute('data-variant', 'mark')
          await expect(heard(part(own, 'brand')!)).toBe('Mylder')
        },
      )
    })
  },
}

/** The brand link of a wide bar under the pointer, at rest: the visual stage drives the hover. */
export const MediumHover: Story = {
  decorators: [inside(1024)],
  play: async ({ canvasElement }) => {
    const brand = part(await barIn(canvasElement), 'brand')!
    await expect(stateFill(brand)).toBe('var(--perron-color-surface-hover)')
    await expect(getComputedStyle(brand).cursor).toBe('pointer')
  },
}

/** The brand link of a wide bar pressed, at rest: the visual stage drives the press. */
export const MediumPressed: Story = {
  decorators: [inside(1024)],
  play: async ({ canvasElement }) => {
    const brand = part(await barIn(canvasElement), 'brand')!
    await expect(stateFill(brand, ':active')).toBe('var(--perron-color-surface-selected)')
    await expect(pressedAfterHover(brand)).toBe(true)
  },
}

/** `MediumDefault`'s args on a phone: `size` small, in a 375 px container. */
export const SmallDefault: Story = {
  args: { size: 'small' },
  decorators: [inside(375)],
  play: async ({ canvasElement, step }) => {
    const bar = await barIn(canvasElement)
    const [brand, status, tools, filters] = ['brand', 'status', 'tools', 'filters'].map((name) =>
      part(bar, name)!.getBoundingClientRect(),
    )
    await step('two rows, at least size.top-bar-phone tall (CR-3)', async () => {
      await expect(bar).toHaveAttribute('data-size', 'small')
      await expect(bar.getBoundingClientRect().height).toBeGreaterThanOrEqual(
        px('size-top-bar-phone'),
      )
      await expect(groupsOf(bar)).toEqual(['identity', 'tools', 'filters'])
      // the status line under the brand
      await expect(status.top).toBeGreaterThanOrEqual(brand.bottom - 1)
      const mark = part(bar, 'brand')!.querySelector('.pn-Brand-mark')!.getBoundingClientRect()
      await expect(status.left).toBeCloseTo(mark.left, 0)
      // the tools end the first row, the filters take the second
      const identity = part(bar, 'identity')!.getBoundingClientRect()
      await expect(tools.top).toBeLessThan(identity.bottom)
      await expect(filters.top).toBeGreaterThanOrEqual(identity.bottom)
      await expect(filters.top).toBeGreaterThanOrEqual(tools.bottom)
    })
    await step('the filters scroll sideways, with room for the ring (CR-9)', async () => {
      const group = part(bar, 'filters')!
      const style = getComputedStyle(group)
      await expect(style.overflowX).toBe('auto')
      const room = ringRoom()
      await expect(Number.parseFloat(style.paddingTop)).toBe(room)
      await expect(Number.parseFloat(style.paddingLeft)).toBe(room)
      await expect(Number.parseFloat(style.paddingRight)).toBe(room)
      await expect(Number.parseFloat(style.marginTop)).toBe(-room)
      await expect(Number.parseFloat(style.marginLeft)).toBe(-room)
      // the chips' row starts where the bar's content does: the margin keeps the chips in place
      const content =
        bar.getBoundingClientRect().left +
        Number.parseFloat(getComputedStyle(bar).paddingLeft) +
        Number.parseFloat(getComputedStyle(bar).borderLeftWidth)
      await expect(group.firstElementChild!.getBoundingClientRect().left).toBeCloseTo(content, 0)
    })
    await step('Tab: the brand, the tools, then the chips; Shift+Tab back', async () => {
      const controls = controlsIn(canvasElement)
      await expectTabOrder(canvasElement, [
        controls.brand!,
        controls.language,
        controls.about,
        ...controls.chips,
      ])
    })
    await step('a focused chip’s ring is inside the scrolling box (CR-9)', async () => {
      const group = part(bar, 'filters')!
      const first = controlsIn(canvasElement).chips[0]
      first.focus({ focusVisible: true } as FocusOptions)
      const box = group.getBoundingClientRect()
      const chip = first.getBoundingClientRect()
      await expect(chip.top - ringRoom()).toBeGreaterThanOrEqual(box.top)
      await expect(chip.left - ringRoom()).toBeGreaterThanOrEqual(box.left)
      await expect(chip.bottom + ringRoom()).toBeLessThanOrEqual(box.bottom)
      first.blur()
    })
    await step(
      'at 320 px, a long status line leaves the tools on the first row (CR-3)',
      async () => {
        await mounted(
          canvasElement,
          <PerronProvider locale="da">
            <div style={{ inlineSize: 320 }}>
              <TopBar size="small" brandHref="/en" time="08:09:40" paused outOfDate tools={TOOLS} />
            </div>
          </PerronProvider>,
          async (host) => {
            const own = await barIn(host)
            const identity = part(own, 'identity')!.getBoundingClientRect()
            const group = part(own, 'tools')!.getBoundingClientRect()
            await expect(group.top).toBeLessThan(identity.bottom)
            await expect(lines(part(own, 'status')!)).toBeGreaterThan(1)
            await expect(own.scrollWidth).toBe(own.clientWidth)
            await expect(group.right).toBeLessThanOrEqual(own.getBoundingClientRect().right)
          },
        )
      },
    )
    await step('at 320 px the chips scroll and nothing leaves the bar (CR-10)', async () => {
      await mounted(
        canvasElement,
        <div style={{ inlineSize: 320 }}>
          <TopBar size="small" brandHref="/en" time="08:14:05" filters={FILTERS} tools={TOOLS} />
        </div>,
        async (host) => {
          const own = await barIn(host)
          const group = part(own, 'filters')!
          await expect(group.scrollWidth).toBeGreaterThan(group.clientWidth)
          await expect(own.getBoundingClientRect().right).toBeLessThanOrEqual(
            host.firstElementChild!.getBoundingClientRect().right,
          )
          await expect(own.scrollWidth).toBe(own.clientWidth)
        },
      )
    })
  },
}

/** `MediumDefault`'s args with `paused`: "Paused · Updated 08:14:05". */
export const Paused: Story = {
  args: { paused: true },
  play: async ({ canvasElement }) => {
    const bar = await barIn(canvasElement)
    const status = part(bar, 'status')!
    const separator = part(bar, 'separator')!
    await expect(bar).toHaveAttribute('data-paused', '')
    await expect(heard(status)).toBe('Paused · Updated 08:14:05')
    await expect([...status.children]).toEqual([part(bar, 'paused'), separator, part(bar, 'time')])
    await expect(separator).toHaveTextContent(/^·$/)
    // a no-break space before the "·" and a space after it (CR-4)
    await expect(separator.previousSibling?.textContent).toBe(' ')
    await expect(separator.nextSibling?.textContent).toBe(' ')
    await expect(getComputedStyle(part(bar, 'paused')!).color).toBe(
      colour('--perron-color-text-primary'),
    )
    await expect(getComputedStyle(separator).color).toBe(colour('--perron-color-text-secondary'))
    await expect(part(bar, 'time')).toHaveAttribute('dateTime', '08:14:05')
  },
}

/** `MediumDefault`'s args with `time` 08:09:40 and `outOfDate`: "Updated 08:09:40, may be out of date". */
export const OutOfDate: Story = {
  args: { time: '08:09:40', outOfDate: true },
  play: async ({ canvasElement, step }) => {
    const bar = await barIn(canvasElement)
    await step('the whole phrase in warning ink (CR-4)', async () => {
      const time = part(bar, 'time')!
      await expect(bar).toHaveAttribute('data-out-of-date', '')
      await expect(time).toHaveTextContent(/^Updated 08:09:40, may be out of date$/)
      await expect(time.childNodes).toHaveLength(1)
      await expect(getComputedStyle(time).color).toBe(colour('--perron-color-text-warning'))
    })
    await step('paused too, and an HH:MM time not out of date (CR-4)', async () => {
      await mounted(
        canvasElement,
        <>
          <TopBar time="08:09:40" outOfDate paused data-testid="both" />
          <TopBar time="08:14" outOfDate={false} data-testid="fresh" />
        </>,
        async (host) => {
          const both = await waitFor(() => within(host).getByTestId('both'))
          await expect(heard(part(both, 'status')!)).toBe(
            'Paused · Updated 08:09:40, may be out of date',
          )
          const fresh = within(host).getByTestId('fresh')
          await expect(fresh).not.toHaveAttribute('data-out-of-date')
          await expect(part(fresh, 'time')).toHaveTextContent(/^Updated 08:14$/)
          await expect(part(fresh, 'time')).toHaveAttribute('dateTime', '08:14')
          await expect(getComputedStyle(part(fresh, 'time')!).color).toBe(
            colour('--perron-color-text-secondary'),
          )
        },
      )
    })
    await step('in every locale, only the dictionary’s words (CR-8)', async () => {
      for (const locale of Object.keys(dictionaries) as Locale[]) {
        const markup = renderToStaticMarkup(
          <PerronProvider locale={locale}>
            <TopBar
              brandHref="/en"
              time="08:09:40"
              outOfDate
              paused
              filters={FILTERS}
              tools={TOOLS}
            />
          </PerronProvider>,
        )
        expectOwnedStrings(markup, locale, CALLER_WORDS)
        await expect(markup).toContain(
          dictionaries[locale].topBarUpdatedOutOfDate.replace('{time}', '08:09:40'),
        )
      }
    })
  },
}

/** `MediumDefault`'s args with no `time`: the bar before the first answer, "Updated —". */
export const UnknownTime: Story = {
  args: { time: undefined },
  play: async ({ canvasElement }) => {
    const bar = await barIn(canvasElement)
    const time = part(bar, 'time')!
    await expect(time).toHaveTextContent(/^Updated —$/)
    await expect(time).not.toHaveAttribute('dateTime')
  },
}

/** `MediumDefault`'s args with no `brandHref` and no `filters`: the bar while the timetable loads. */
export const NoFilters: Story = {
  args: { brandHref: undefined, filters: undefined },
  play: async ({ canvasElement }) => {
    const bar = await barIn(canvasElement)
    // CR-7: no empty group is announced
    await expect(within(canvasElement).queryByRole('group')).toBeNull()
    await expect(groupsOf(bar)).toEqual(['identity', 'tools'])
    // CR-5: the brand alone, no link
    await expect(part(bar, 'brand')!.tagName).toBe('SPAN')
    await expect(within(canvasElement).queryByRole('link', { name: 'Mylder' })).toBeNull()
    // the tools end the row, at the end of the root's content box
    const style = getComputedStyle(bar)
    const end =
      bar.getBoundingClientRect().right -
      Number.parseFloat(style.paddingRight) -
      Number.parseFloat(style.borderRightWidth)
    await expect(part(bar, 'tools')!.getBoundingClientRect().right).toBeCloseTo(end, 0)
    const controls = controlsIn(canvasElement)
    await expectTabOrder(canvasElement, [controls.language, controls.about])
  },
}

/** A Danish wrapper, for the story whose words are the locale's. */
const inDanish: Decorator = (Story) => (
  <PerronProvider locale="da">
    <Story />
  </PerronProvider>
)

/** `OutOfDate`'s args with `paused`, `size` medium, in Danish, in a 320 px container. */
export const Narrow: Story = {
  args: { time: '08:09:40', outOfDate: true, paused: true },
  decorators: [inside(320), inDanish],
  play: async ({ canvasElement }) => {
    const bar = await barIn(canvasElement)
    const container = bar.parentElement!.getBoundingClientRect()
    const box = bar.getBoundingClientRect()
    // nothing reaches past the container's edge
    await expect(box.right).toBeLessThanOrEqual(container.right)
    await expect(bar.scrollWidth).toBe(bar.clientWidth)
    for (const element of bar.querySelectorAll('*')) {
      const rect = element.getBoundingClientRect()
      if (rect.width === 0) continue
      await expect(rect.left).toBeGreaterThanOrEqual(box.left)
      await expect(rect.right).toBeLessThanOrEqual(box.right)
    }
    // the groups take more rows: the filters below the identity, the tools below the filters
    const [identity, filters, tools] = ['identity', 'filters', 'tools'].map((name) =>
      part(bar, name)!.getBoundingClientRect(),
    )
    await expect(filters.top).toBeGreaterThanOrEqual(identity.bottom)
    await expect(tools.top).toBeGreaterThanOrEqual(filters.bottom)
    // the chips wrap
    const chips = [...part(bar, 'filters')!.children].map((chip) => chip.getBoundingClientRect())
    await expect(chips.at(-1)!.top).toBeGreaterThan(chips[0].top)
    // the line breaks at its spaces, never inside its time
    const time = part(bar, 'time')!
    await expect(heard(part(bar, 'status')!)).toBe(
      'Sat på pause · Opdateret 08:09:40, måske forældet',
    )
    await expect(getComputedStyle(part(bar, 'status')!).overflowWrap).toBe('break-word')
    await expect(lines(part(bar, 'status')!)).toBeGreaterThan(1)
    const text = time.firstChild!
    const at = text.textContent!.indexOf('08:09:40')
    const range = document.createRange()
    range.setStart(text, at)
    range.setEnd(text, at + '08:09:40'.length)
    await expect(new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size).toBe(1)
  },
}

/** Every owned word overridden, as a caller names its own: the labels replace only their words. */
const LABELS = {
  updatedLabel: 'As of {time}',
  updatedOutOfDateLabel: 'As of {time}, could be old',
  sourcePausedLabel: 'On hold',
  filtersLabel: 'Modes',
  brandNameLabel: 'Perron',
} satisfies Partial<TopBarProps>

/** `Paused`'s args with `outOfDate`, and every `*Label` given. */
export const WithLabels: Story = {
  args: { paused: true, outOfDate: true, ...LABELS },
  play: async ({ canvasElement }) => {
    const bar = await barIn(canvasElement)
    const scope = within(canvasElement)
    await expect(heard(part(bar, 'status')!)).toBe('On hold · As of 08:14:05, could be old')
    await expect(scope.getByRole('group', { name: 'Modes' })).toBe(part(bar, 'filters'))
    await expect(scope.getByRole('link', { name: 'Perron' })).toBe(part(bar, 'brand'))
    // the bar's own words are gone; "About Mylder" is the caller's
    await expect(part(bar, 'identity')).not.toHaveTextContent(/Paused|Updated|Mylder/i)
    await expect(bar.querySelector('[aria-label="Filters"]')).toBeNull()
    await mounted(canvasElement, <TopBar time="08:14:05" {...LABELS} />, async (host) => {
      const own = await barIn(host)
      await expect(heard(part(own, 'status')!)).toBe('As of 08:14:05')
    })
  },
}
