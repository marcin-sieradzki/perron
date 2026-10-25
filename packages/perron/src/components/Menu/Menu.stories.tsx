// Menu's stories: the deferred design's open menu, Default, and its row in each State, prefixed
// Item, then the other components and the behaviour beside them, each open at first render beside
// the trigger that opens it again, with the play tests the spec's Stories table names
// (docs/components/menu.md). Hover and focus render at rest; their plays drive them.
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import locate from '../../../icons/locate.svg?raw'
import minus from '../../../icons/minus.svg?raw'
import plus from '../../../icons/plus.svg?raw'
import { PerronProvider } from '../../PerronProvider.tsx'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import {
  closed,
  colour,
  frames,
  icon,
  lines,
  mounted,
  onHover,
  pressedAfterHover,
  resolve,
  stateFill,
  stateRules,
} from '../../testing/stories.ts'
import { Button } from '../Button/Button.tsx'
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuItem,
  MenuLinkItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSubmenu,
} from './Menu.tsx'
import type { MenuProps } from './Menu.tsx'

/**
 * An icon file inline, by `icon`, with the white space between its tags taken out: Base UI's
 * typeahead reads a row's text content as it is, so the file's indentation would start every
 * label with white space, and no letter typed would match it.
 */
const glyph = (svg: string) => icon(svg.trim().replace(/>\s+</g, '><'))

const TRIGGER = 'Map options'
const CENTRE = 'Centre the map'
const ZOOM_IN = 'Zoom in'
const ZOOM_OUT = 'Zoom out'

const onCentre = fn()
const onZoomIn = fn()
const onZoomOut = fn()

/**
 * The three items of the Default menu, each with its 16 px icon, drawn for `icon.size.400`, or
 * with none when `icons` is false, for a menu whose other rows have none, so every label starts
 * at one edge; with `disabled` on "Zoom in" when asked.
 */
const items = ({ zoomInDisabled = false, icons = true } = {}) => (
  <>
    <MenuItem startIcon={icons && glyph(locate)} onClick={onCentre}>
      {CENTRE}
    </MenuItem>
    <MenuItem startIcon={icons && glyph(plus)} onClick={onZoomIn} disabled={zoomInDisabled}>
      {ZOOM_IN}
    </MenuItem>
    <MenuItem startIcon={icons && glyph(minus)} onClick={onZoomOut}>
      {ZOOM_OUT}
    </MenuItem>
  </>
)

const meta = {
  title: 'Components/Menu',
  component: Menu,
  args: {
    trigger: <Button>{TRIGGER}</Button>,
    children: items(),
    defaultOpen: true,
    onOpen: fn(),
    onClose: fn(),
  },
  decorators: [
    (Story) => (
      <PerronProvider locale="en">
        <Story />
      </PerronProvider>
    ),
  ],
  // The menu portals to the end of <body> and locks the page while open, so on the docs page each
  // story renders in its own frame, tall enough for the open menu (CR-15).
  parameters: { docs: { story: { inline: false, height: '480px' } } },
} satisfies Meta<typeof Menu>

export default meta

type Story = StoryObj<typeof meta>

/** The open menu, found by its role in the portal at the end of `<body>`. */
const menu = (name = TRIGGER) => screen.findByRole('menu', { name })

/** The trigger, found while the open modal menu blocks the page around it. */
const triggerIn = (canvasElement: HTMLElement) =>
  within(canvasElement).getByRole('button', { name: TRIGGER, hidden: true })

/** A row of the open menu by its role and name. */
const row = (popup: HTMLElement, name: string, role = 'menuitem') =>
  within(popup).getByRole(role, { name })

/** Escape closes the menu, focus returns to the trigger, and the story ends at rest. */
async function closeAtRest(trigger: HTMLElement) {
  await userEvent.keyboard('{Escape}')
  await closed('menu')
  await waitFor(() => expect(trigger).toHaveFocus())
  trigger.blur()
}

/**
 * Closes the menu open at first render and opens it again from the keys, and resolves once focus
 * is on its first item, so the arrow keys move from there.
 */
async function reopenFromKeys(trigger: HTMLElement) {
  await userEvent.keyboard('{Escape}')
  await closed('menu')
  await waitFor(() => expect(trigger).toHaveFocus())
  await userEvent.keyboard('{ArrowDown}')
  const popup = await menu()
  await waitFor(() => expect(popup.querySelector(':focus')).not.toBeNull())
  return popup
}

/** The one variant of the menu: open, three items with start icons. */
export const Default: Story = {
  play: async ({ canvasElement, args, step }) => {
    const trigger = triggerIn(canvasElement)
    await step('the popup is a menu named by its trigger, and every word is known', async () => {
      const popup = await menu()
      await expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
      expectOwnedStrings(popup.outerHTML, 'en', [CENTRE, ZOOM_IN, ZOOM_OUT])
    })
    await step('Escape closes it, and focus returns to the trigger', async () => {
      await userEvent.keyboard('{Escape}')
      await closed('menu')
      await expect(args.onClose).toHaveBeenLastCalledWith(
        expect.anything(),
        'escape-key',
        expect.anything(),
      )
      await waitFor(() => expect(trigger).toHaveFocus())
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })
    await step('Enter on the trigger opens it and focuses the first item', async () => {
      await userEvent.keyboard('{Enter}')
      const popup = await menu()
      await expect(args.onOpen).toHaveBeenCalled()
      await waitFor(() => expect(row(popup, CENTRE)).toHaveFocus())
    })
    await step('the arrow keys, Home, End and typeahead move between the items', async () => {
      const popup = await menu()
      await userEvent.keyboard('{ArrowDown}')
      await waitFor(() => expect(row(popup, ZOOM_IN)).toHaveFocus())
      await userEvent.keyboard('{End}')
      await waitFor(() => expect(row(popup, ZOOM_OUT)).toHaveFocus())
      await userEvent.keyboard('{ArrowDown}')
      await waitFor(() => expect(row(popup, CENTRE)).toHaveFocus())
      await userEvent.keyboard('{Home}')
      await waitFor(() => expect(row(popup, CENTRE)).toHaveFocus())
      await userEvent.keyboard('z')
      await waitFor(() => expect(row(popup, ZOOM_IN)).toHaveFocus())
    })
    await step('Enter runs the item once, closes the menu, and focus returns', async () => {
      onZoomIn.mockClear()
      await userEvent.keyboard('{Enter}')
      await closed('menu')
      await expect(onZoomIn).toHaveBeenCalledTimes(1)
      await expect(args.onClose).toHaveBeenLastCalledWith(
        expect.anything(),
        'item-press',
        expect.anything(),
      )
      await waitFor(() => expect(trigger).toHaveFocus())
      trigger.blur()
    })
    await step('in da, the open popup shows no word of its own', async () => {
      const ui = (
        <PerronProvider locale="da">
          <Menu {...args} trigger={<Button>{TRIGGER}</Button>} data-testid="menu-da" />
        </PerronProvider>
      )
      await mounted(document.body, ui, async () => {
        const da = await waitFor(() => {
          const found = document.querySelector('[data-testid="menu-da"]')
          expect(found).not.toBeNull()
          return found as HTMLElement
        })
        expectOwnedStrings(da.outerHTML, 'da', [CENTRE, ZOOM_IN, ZOOM_OUT])
      })
      await closed('menu')
    })
  },
}

/** The row at rest: one item, "Zoom in", in an open menu. */
export const ItemDefault: Story = {
  args: {
    children: (
      <MenuItem startIcon={glyph(plus)} onClick={onZoomIn}>
        {ZOOM_IN}
      </MenuItem>
    ),
  },
}

/** The row highlighted: the Default menu, its second item under the pointer or the keys. */
export const ItemHighlighted: Story = {
  play: async ({ canvasElement, step }) => {
    const trigger = triggerIn(canvasElement)
    await step('the pointer highlights and focuses the row, with the hover fill', async () => {
      const zoomIn = row(await menu(), ZOOM_IN)
      await userEvent.hover(zoomIn)
      await waitFor(() => expect(zoomIn).toHaveAttribute('data-highlighted'))
      await waitFor(() => expect(zoomIn).toHaveFocus())
      await expect(getComputedStyle(zoomIn).backgroundColor).toBe(
        colour('--perron-color-surface-hover'),
      )
      await userEvent.unhover(zoomIn)
    })
    await step('pressed, the row lays the pressed layer past the hover one', async () => {
      const zoomIn = row(await menu(), ZOOM_IN)
      const fill = 'var(--perron-color-surface-selected)'
      await expect(stateFill(zoomIn, ':active')).toBe(fill)
      await expect(pressedAfterHover(zoomIn)).toBe(true)
      await expect(resolve('backgroundColor', fill)).not.toBe(
        resolve('backgroundColor', stateFill(zoomIn)),
      )
      await expect(getComputedStyle(zoomIn).cursor).toBe('pointer')
    })
    await step('opened from the keys, the first row has the focus ring', async () => {
      const popup = await reopenFromKeys(trigger)
      const centre = row(popup, CENTRE)
      await waitFor(() => expect(centre).toHaveFocus())
      await expect(centre.matches(':focus-visible')).toBe(true)
      const ring = getComputedStyle(centre)
      await expect(ring.outlineStyle).toBe('solid')
      await expect(ring.outlineColor).toBe(colour('--perron-color-border-focus'))
    })
    await step('Escape closes it, and focus returns to the trigger', () => closeAtRest(trigger))
  },
}

/** The row disabled: the Default menu with "Zoom in" disabled. */
export const ItemDisabled: Story = {
  args: { children: items({ zoomInDisabled: true }) },
  play: async ({ canvasElement, step }) => {
    const trigger = triggerIn(canvasElement)
    await step('the item is announced as dimmed and drawn in the tertiary colour', async () => {
      const zoomIn = row(await menu(), ZOOM_IN)
      await expect(zoomIn).toHaveAttribute('aria-disabled', 'true')
      await expect(zoomIn).toHaveAttribute('data-disabled')
      await expect(getComputedStyle(zoomIn).color).toBe(colour('--perron-color-text-tertiary'))
    })
    await step('ArrowDown still reaches it, and Enter and a click do nothing', async () => {
      onZoomIn.mockClear()
      const popup = await reopenFromKeys(trigger)
      await waitFor(() => expect(row(popup, CENTRE)).toHaveFocus())
      await userEvent.keyboard('{ArrowDown}')
      const zoomIn = row(popup, ZOOM_IN)
      await waitFor(() => expect(zoomIn).toHaveFocus())
      await userEvent.keyboard('{Enter}')
      await userEvent.click(zoomIn)
      await frames(2)
      await expect(onZoomIn).not.toHaveBeenCalled()
      await expect(screen.getByRole('menu', { name: TRIGGER })).toBeInTheDocument()
    })
    await step(
      'hovered, highlighted or pressed, it lays no fill, under the default cursor',
      async () => {
        const zoomIn = row(await menu(), ZOOM_IN)
        await expect(onHover(zoomIn, 'background-color')).toBe('')
        await expect(stateFill(zoomIn, ':active')).toBe('')
        await expect(getComputedStyle(zoomIn).backgroundColor).toBe('rgba(0, 0, 0, 0)')
        await expect(getComputedStyle(zoomIn).cursor).toBe('default')
      },
    )
    await step('Escape closes it, and focus returns to the trigger', () => closeAtRest(trigger))
  },
}

const THEME = 'Theme'
const SYSTEM = 'System'
const LIGHT = 'Light'
const DARK = 'Dark'

const onTheme = fn()

/** The radio group "Theme", with "System", "Light" and "Dark", one chosen at first. */
const theme = (chosen: string) => (
  <MenuRadioGroup label={THEME} defaultValue={chosen} onChange={onTheme}>
    <MenuRadioItem value="system">{SYSTEM}</MenuRadioItem>
    <MenuRadioItem value="light">{LIGHT}</MenuRadioItem>
    <MenuRadioItem value="dark">{DARK}</MenuRadioItem>
  </MenuRadioGroup>
)

/** The radio item's tick, the SelectedMark part in its indicator, where it is rendered. */
const tick = (item: HTMLElement) => item.querySelector('.pn-MenuRadioItem-radioItemIndicator')

/** The row selected: a radio group "Theme", "Light" chosen. */
export const ItemSelected: Story = {
  args: { children: theme('light') },
  play: async ({ canvasElement, step }) => {
    const trigger = triggerIn(canvasElement)
    await step('"Light" is checked, with the selected fill and the tick', async () => {
      const popup = await menu()
      const light = row(popup, LIGHT, 'menuitemradio')
      await expect(light).toHaveAttribute('aria-checked', 'true')
      await expect(light).toHaveAttribute('data-checked')
      await expect(getComputedStyle(light).backgroundColor).toBe(
        colour('--perron-color-surface-selected'),
      )
      await expect(tick(light)).not.toBeNull()
      for (const name of [SYSTEM, DARK]) {
        const other = row(popup, name, 'menuitemradio')
        await expect(other).toHaveAttribute('aria-checked', 'false')
        await expect(other).not.toHaveAttribute('data-checked')
        await expect(getComputedStyle(other).backgroundColor).not.toBe(
          colour('--perron-color-surface-selected'),
        )
        await expect(tick(other)).toBeNull()
      }
    })
    await step('pressed, "Light" lays the pressed layer over its fill', async () => {
      const light = row(await menu(), LIGHT, 'menuitemradio')
      const layers = stateRules(light, ':active').map((rule) =>
        rule.getPropertyValue('background-image'),
      )
      await expect(layers.at(-1)).toContain('var(--perron-color-surface-selected)')
      await expect(pressedAfterHover(light)).toBe(true)
    })
    await step('Escape closes it, and focus returns to the trigger', () => closeAtRest(trigger))
  },
}

const MAP = 'Map'
const ZOOM = 'Zoom'

/** Two groups, "Map" and "Zoom", a separator between them. */
export const Groups: Story = {
  args: {
    children: (
      <>
        <MenuGroup label={MAP}>
          <MenuItem startIcon={glyph(locate)} onClick={onCentre}>
            {CENTRE}
          </MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup label={ZOOM}>
          <MenuItem startIcon={glyph(plus)} onClick={onZoomIn}>
            {ZOOM_IN}
          </MenuItem>
          <MenuItem startIcon={glyph(minus)} onClick={onZoomOut}>
            {ZOOM_OUT}
          </MenuItem>
        </MenuGroup>
      </>
    ),
  },
  play: async ({ canvasElement, step }) => {
    const trigger = triggerIn(canvasElement)
    await step('each group is named by its label, which is hidden itself', async () => {
      const popup = await menu()
      await expect(within(popup).getByRole('group', { name: MAP })).toBeInTheDocument()
      await expect(within(popup).getByRole('group', { name: ZOOM })).toBeInTheDocument()
      for (const label of popup.querySelectorAll('.pn-MenuGroup-groupLabel'))
        await expect(label).toHaveAttribute('aria-hidden', 'true')
      await expect(within(popup).getByRole('separator')).toBeInTheDocument()
    })
    await step('the arrow keys move past the label and the separator', async () => {
      const popup = await reopenFromKeys(trigger)
      await waitFor(() => expect(row(popup, CENTRE)).toHaveFocus())
      await userEvent.keyboard('{ArrowDown}')
      await waitFor(() => expect(row(popup, ZOOM_IN)).toHaveFocus())
      await userEvent.keyboard('{ArrowDown}')
      await waitFor(() => expect(row(popup, ZOOM_OUT)).toHaveFocus())
    })
    await step('Escape closes it, and focus returns to the trigger', () => closeAtRest(trigger))
  },
}

const STOP_NAMES = 'Show stop names'
const TRAILS = 'Show vehicle trails'
const MAP_LABELS = 'Show map labels'

const onStopNames = fn()
const onTrails = fn()
const onMapLabels = fn()

/** Three settings: one on, one off, and one disabled. */
export const CheckboxItems: Story = {
  args: {
    children: (
      <>
        <MenuCheckboxItem defaultChecked onChange={onStopNames}>
          {STOP_NAMES}
        </MenuCheckboxItem>
        <MenuCheckboxItem onChange={onTrails}>{TRAILS}</MenuCheckboxItem>
        <MenuCheckboxItem disabled onChange={onMapLabels}>
          {MAP_LABELS}
        </MenuCheckboxItem>
      </>
    ),
  },
  play: async ({ canvasElement, step }) => {
    const trigger = triggerIn(canvasElement)
    await step('"Show stop names" is checked, and every box is rendered', async () => {
      const popup = await menu()
      await expect(row(popup, STOP_NAMES, 'menuitemcheckbox')).toHaveAttribute(
        'aria-checked',
        'true',
      )
      for (const name of [STOP_NAMES, TRAILS, MAP_LABELS])
        await expect(
          row(popup, name, 'menuitemcheckbox').querySelector(
            '.pn-MenuCheckboxItem-checkboxItemIndicator',
          ),
        ).not.toBeNull()
    })
    await step('Enter turns "Show vehicle trails" on, and the menu stays open', async () => {
      onTrails.mockClear()
      const popup = await reopenFromKeys(trigger)
      await waitFor(() => expect(row(popup, STOP_NAMES, 'menuitemcheckbox')).toHaveFocus())
      await userEvent.keyboard('{ArrowDown}')
      const trails = row(popup, TRAILS, 'menuitemcheckbox')
      await waitFor(() => expect(trails).toHaveFocus())
      await userEvent.keyboard('{Enter}')
      await waitFor(() => expect(trails).toHaveAttribute('aria-checked', 'true'))
      await expect(onTrails).toHaveBeenLastCalledWith(expect.anything(), true, expect.anything())
      await expect(screen.getByRole('menu', { name: TRIGGER })).toBeInTheDocument()
      await expect(trails).toHaveFocus()
    })
    await step('a click turns it off again', async () => {
      const trails = row(await menu(), TRAILS, 'menuitemcheckbox')
      await userEvent.click(trails)
      await waitFor(() => expect(trails).toHaveAttribute('aria-checked', 'false'))
      await expect(onTrails).toHaveBeenLastCalledWith(expect.anything(), false, expect.anything())
    })
    await step('the disabled item ignores a click and keeps its state', async () => {
      onMapLabels.mockClear()
      const labels = row(await menu(), MAP_LABELS, 'menuitemcheckbox')
      await userEvent.click(labels)
      await frames(2)
      await expect(labels).toHaveAttribute('aria-checked', 'false')
      await expect(onMapLabels).not.toHaveBeenCalled()
    })
    await step('Escape closes it, and focus returns to the trigger', () => closeAtRest(trigger))
  },
}

/** A radio group "Theme", "System" chosen at first. */
export const RadioItems: Story = {
  args: { children: theme('system') },
  play: async ({ canvasElement, step }) => {
    const trigger = triggerIn(canvasElement)
    await step('the group is named "Theme"', async () => {
      await expect(within(await menu()).getByRole('group', { name: THEME })).toBeInTheDocument()
    })
    await step('ArrowDown and Enter choose "Light", and the menu stays open', async () => {
      onTheme.mockClear()
      const popup = await reopenFromKeys(trigger)
      await waitFor(() => expect(row(popup, SYSTEM, 'menuitemradio')).toHaveFocus())
      await userEvent.keyboard('{ArrowDown}')
      const light = row(popup, LIGHT, 'menuitemradio')
      await waitFor(() => expect(light).toHaveFocus())
      await userEvent.keyboard('{Enter}')
      await waitFor(() => expect(light).toHaveAttribute('aria-checked', 'true'))
      await expect(onTheme).toHaveBeenLastCalledWith(expect.anything(), 'light', expect.anything())
      await expect(row(popup, SYSTEM, 'menuitemradio')).toHaveAttribute('aria-checked', 'false')
      await waitFor(() => expect(tick(light)).not.toBeNull())
      await expect(screen.getByRole('menu', { name: TRIGGER })).toBeInTheDocument()
    })
    await step('Escape closes it, and focus returns to the trigger', () => closeAtRest(trigger))
  },
}

const LANGUAGE = 'Language'
const ENGLISH = 'English'

/**
 * The Default items, a separator, and a submenu "Language" of four languages, its radio group
 * named by the row. No row has a start icon, as "Language" has none.
 */
export const Submenu: Story = {
  args: {
    children: (
      <>
        {items({ icons: false })}
        <MenuSeparator />
        <MenuSubmenu label={LANGUAGE}>
          <MenuRadioGroup defaultValue="en">
            <MenuRadioItem value="en">{ENGLISH}</MenuRadioItem>
            <MenuRadioItem value="da">Dansk</MenuRadioItem>
            <MenuRadioItem value="sv">Svenska</MenuRadioItem>
            <MenuRadioItem value="nb">Norsk</MenuRadioItem>
          </MenuRadioGroup>
        </MenuSubmenu>
      </>
    ),
  },
  play: async ({ canvasElement, step }) => {
    const trigger = triggerIn(canvasElement)
    await step('the row has aria-haspopup and the chevron', async () => {
      const language = row(await menu(), LANGUAGE)
      await expect(language).toHaveAttribute('aria-haspopup', 'menu')
      await expect(language.querySelector('.pn-MenuSubmenu-chevron')).not.toBeNull()
    })
    await step('ArrowRight opens the submenu and focuses its first item', async () => {
      const popup = await reopenFromKeys(trigger)
      await userEvent.keyboard('{End}')
      await waitFor(() => expect(row(popup, LANGUAGE)).toHaveFocus())
      await userEvent.keyboard('{ArrowRight}')
      const submenu = await menu(LANGUAGE)
      await waitFor(() => expect(row(submenu, ENGLISH, 'menuitemradio')).toHaveFocus())
    })
    await step('ArrowLeft closes it and returns focus to the row', async () => {
      await userEvent.keyboard('{ArrowLeft}')
      await closed({ selector: '.pn-MenuSubmenu-popup' })
      await waitFor(() => expect(row(screen.getByRole('menu'), LANGUAGE)).toHaveFocus())
    })
    await step('Enter opens it again, and Escape closes only the submenu', async () => {
      await userEvent.keyboard('{Enter}')
      const submenu = await menu(LANGUAGE)
      await waitFor(() => expect(row(submenu, ENGLISH, 'menuitemradio')).toHaveFocus())
      await userEvent.keyboard('{Escape}')
      await closed({ selector: '.pn-MenuSubmenu-popup' })
      const popup = await menu()
      await waitFor(() => expect(row(popup, LANGUAGE)).toHaveFocus())
    })
    await step('a second Escape closes the menu, and focus returns to the trigger', () =>
      closeAtRest(trigger),
    )
  },
}

const DATA_SOURCES = 'Data sources'
const PRIVACY = 'Privacy'

/** Two links after "Zoom out". No row has a start icon, as the links have none. */
export const LinkItems: Story = {
  args: {
    children: (
      <>
        {items({ icons: false })}
        <MenuLinkItem href="#data-sources">{DATA_SOURCES}</MenuLinkItem>
        <MenuLinkItem href="#privacy">{PRIVACY}</MenuLinkItem>
      </>
    ),
  },
  play: async ({ canvasElement, step }) => {
    const trigger = triggerIn(canvasElement)
    await step('each link is an <a href> with the menuitem role', async () => {
      const popup = await menu()
      for (const name of [DATA_SOURCES, PRIVACY]) {
        const link = row(popup, name)
        await expect(link.tagName).toBe('A')
        await expect(link).toHaveAttribute('href')
      }
    })
    await step('the arrow keys reach them like the other items', async () => {
      const popup = await reopenFromKeys(trigger)
      await userEvent.keyboard('{End}')
      await waitFor(() => expect(row(popup, PRIVACY)).toHaveFocus())
      await userEvent.keyboard('{ArrowUp}')
      await waitFor(() => expect(row(popup, DATA_SOURCES)).toHaveFocus())
      await userEvent.keyboard('{ArrowUp}')
      await waitFor(() => expect(row(popup, ZOOM_OUT)).toHaveFocus())
    })
    await step('Escape closes it, and focus returns to the trigger', () => closeAtRest(trigger))
  },
}

/** The Default menu with `disabled`, closed. */
export const Disabled: Story = {
  args: { disabled: true, defaultOpen: false },
  play: async ({ canvasElement, args, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: TRIGGER })
    await step('the trigger carries data-disabled', async () => {
      await expect(trigger).toHaveAttribute('data-disabled')
    })
    await step('a click and Enter open no menu', async () => {
      await userEvent.click(trigger)
      trigger.focus()
      await userEvent.keyboard('{Enter}')
      await frames(2)
      await expect(screen.queryByRole('menu')).toBeNull()
      await expect(args.onOpen).not.toHaveBeenCalled()
      trigger.blur()
    })
  },
}

const LONG_ITEM = 'Trafikinformationsoversigtssidesindstillinger'
const LONG_GROUP = 'Realtidsdataindstillinger'

/** The menu in a 320 px frame, the room it is placed in, as on a phone. */
function InFrame(args: MenuProps) {
  const [frame, setFrame] = useState<HTMLElement | null>(null)
  return (
    <div ref={setFrame} data-testid="frame" style={{ inlineSize: 320, blockSize: 400 }}>
      <Menu
        {...args}
        slotProps={{ positioner: { collisionBoundary: frame ?? 'clipping-ancestors' } }}
      />
    </div>
  )
}

/** A long Danish word in an item and in a group's label, in a 320 px frame. */
export const LongLabel: Story = {
  args: {
    children: (
      <MenuGroup label={LONG_GROUP}>
        <MenuItem startIcon={glyph(locate)} onClick={onCentre}>
          {LONG_ITEM}
        </MenuItem>
      </MenuGroup>
    ),
  },
  render: (args) => <InFrame {...args} />,
  play: async ({ canvasElement, step }) => {
    const trigger = triggerIn(canvasElement)
    await step('the popup stays in the frame, and the long label wraps in its row', async () => {
      const popup = await menu()
      const frame = within(canvasElement).getByTestId('frame').getBoundingClientRect()
      const box = popup.getBoundingClientRect()
      await expect(box.left).toBeGreaterThanOrEqual(frame.left - 0.5)
      await expect(box.right).toBeLessThanOrEqual(frame.right + 0.5)
      const item = row(popup, LONG_ITEM)
      const label = item.querySelector('.pn-MenuItem-label') as HTMLElement
      await expect(lines(label)).toBeGreaterThan(1.5)
      const glyphBox = (
        item.querySelector('.pn-MenuItem-startIcon') as HTMLElement
      ).getBoundingClientRect()
      const firstLine =
        label.getBoundingClientRect().top +
        Number.parseFloat(getComputedStyle(label).lineHeight) / 2
      await expect(Math.abs((glyphBox.top + glyphBox.bottom) / 2 - firstLine)).toBeLessThan(1)
      await expect(item.scrollWidth).toBeLessThanOrEqual(item.clientWidth)
      await expect(popup.scrollWidth).toBeLessThanOrEqual(popup.clientWidth)
    })
    await step('Escape closes it, and focus returns to the trigger', () => closeAtRest(trigger))
  },
}
