// DetailPanel's stories: one per row of the spec's Stories table (docs/patterns/detail-panel.md),
// with the design deferred, each open by defaultOpen beside the trigger that opens it again, with
// play tests for its name, its size and stacking, dismissal, focus, the header row and every shape
// its ReactNode props take.
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { Button } from '../../components/Button/Button.tsx'
import { Text } from '../../components/Text/Text.tsx'
import { PerronProvider } from '../../PerronProvider.tsx'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'
import { DetailPanel } from './DetailPanel.tsx'
import type { DetailPanelProps } from './DetailPanel.tsx'

const LINE_NAME = '5C'
const DESTINATION = 'Husum Torv'
const NEXT_STOP = 'Next stop: Nørreport St.'
const LINE_TRIGGER = 'Show bus 5C'
const STOP = 'Nørreport St.'
const STOP_LINES = 'Metro, S-tog and buses'
const STOP_TRIGGER = 'Show Nørreport St.'
const SHOW_ON_MAP = 'Show on map'
const LINES = [
  'Arrives at Nørreport St. in 2 min, then Jagtvej in 6 min.',
  'Running 1 min late after roadworks on Nørre Voldgade.',
]
const STOP_BODY = ['Next departures: 5C in 2 min, M1 in 3 min, S-tog C in 4 min.']
const LONG = Array.from({ length: 30 }, (_, i) => `Stop ${i + 1}: Jagtvej, in ${i + 2} min.`)

/** The body: one paragraph of body text per line. */
const body = (lines: string[]) => (
  <>
    {lines.map((line) => (
      <Text key={line}>{line}</Text>
    ))}
  </>
)

/** The caller's action: one outlined neutral Button. */
const showOnMap = (
  <Button variant="outline" color="neutral">
    {SHOW_ON_MAP}
  </Button>
)

const meta = {
  title: 'Patterns/DetailPanel',
  component: DetailPanel,
  args: {
    variant: 'line',
    line: 'bus',
    lineName: LINE_NAME,
    title: DESTINATION,
    subheader: NEXT_STOP,
    children: body(LINES),
    trigger: <Button>{LINE_TRIGGER}</Button>,
    defaultOpen: true,
    onOpen: fn(),
    onClose: fn(),
  },
  // Each panel portals to the end of <body> with position: fixed, so on the docs page each story
  // renders in its own iframe rather than inline.
  parameters: { docs: { story: { inline: false, height: '480px' } } },
} satisfies Meta<typeof DetailPanel>

export default meta

type Story = StoryObj<typeof meta>

/** The open panel, found by its name in the portal at the end of `<body>`. */
const panel = (name: string) => screen.findByRole('dialog', { name })

/** Resolves once no panel is open. */
const closed = () => waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

/** A token's value as `:root` holds it, such as `--perron-z-index-detail`'s `6`. */
const token = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(`--perron-${name}`).trim()

/** The part of the open panel `dialog` with the class `pn-<part>`. */
const part = (dialog: HTMLElement, name: string) =>
  dialog.querySelector<HTMLElement>(`.pn-${name}`)!

/** Renders `ui` in a root of its own at the end of `<body>`, and returns what unmounts it. */
function mount(ui: ReactNode) {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  root.render(ui)
  return () => {
    root.unmount()
    host.remove()
  }
}

/** The element with `data-testid` `id`, once it has rendered. */
const byTestId = (id: string) =>
  waitFor(() => {
    const found = document.querySelector(`[data-testid="${id}"]`)
    expect(found).not.toBeNull()
    return found as HTMLElement
  })

/** Each shape a `ReactNode` prop takes, holding `text`: a string, an element and a list. */
const shapes = (text: string): ReactNode[] => [
  text,
  <span data-shape="element">{text}</span>,
  [text.slice(0, Math.ceil(text.length / 2)), text.slice(Math.ceil(text.length / 2))],
]

/** Whether `node` shows `text` in the shape `shapes(text)[index]` gives. */
async function expectShape(node: HTMLElement, text: string, index: number) {
  await expect(node.textContent).toContain(text)
  if (index === 1) await expect(node.querySelector('[data-shape="element"]')).not.toBeNull()
}

/**
 * Opens a panel for each of three renders, one at a time, giving every prop in `props` a string,
 * an element and a list across them, and checks each part shows it and the dialog keeps its
 * `name`; each is unmounted again, and focus is left where it was.
 */
async function expectEveryShape(
  args: Partial<DetailPanelProps>,
  name: string,
  props: Partial<Record<'title' | 'lineName' | 'subheader' | 'action' | 'children', string>>,
) {
  const before = document.activeElement
  const parts = {
    title: 'DetailHeader-title',
    lineName: 'DetailHeader-title',
    subheader: 'DetailHeader-subheader',
    action: 'DetailHeader-action',
    children: 'DetailPanel-content',
  } as const
  const entries = Object.entries(props) as [keyof typeof parts, string][]
  for (let render = 0; render < 3; render++) {
    // each prop takes the shape one after the last prop's, so three renders show all three
    const given = Object.fromEntries(
      entries.map(([prop, text], i) => [prop, shapes(text)[(render + i) % 3]]),
    )
    const unmount = mount(
      <DetailPanel {...args} title={args.title} {...given} defaultOpen data-testid="panel-shape" />,
    )
    const dialog = await byTestId('panel-shape')
    await expect(dialog).toHaveAccessibleName(name)
    for (const [i, [prop, text]] of entries.entries())
      await expectShape(part(dialog, parts[prop]), text, (render + i) % 3)
    unmount()
  }
  await closed()
  // Base UI hands focus back on the next frame, to the element focused last, which can be the
  // story's trigger, blurred since; the story leaves focus where it was
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  if (document.activeElement !== before) (document.activeElement as HTMLElement | null)?.blur()
  await expect(document.activeElement).toBe(before)
}

/** Esc closes the panel with reason `escape-key`, and focus returns to `trigger`. */
async function escapeCloses(trigger: HTMLElement, onClose: unknown) {
  await userEvent.keyboard('{Escape}')
  await expect(onClose).toHaveBeenLastCalledWith(expect.anything(), 'escape-key', expect.anything())
  await closed()
  await waitFor(() => expect(trigger).toHaveFocus())
  trigger.blur()
}

/** A bus's panel: its 5C badge, its destination and next stop, and two lines of detail. */
export const Line: Story = {
  args: {},
  play: async ({ canvasElement, args, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: LINE_TRIGGER })
    const dialog = await panel(`${LINE_NAME} ${DESTINATION}`)
    await step('the dialog is named by its one heading, level 2', async () => {
      const headings = within(dialog).getAllByRole('heading')
      await expect(headings).toHaveLength(1)
      await expect(within(dialog).getByRole('heading', { level: 2 })).toBe(headings[0])
    })
    await step(
      'the root carries data-variant, is size.detail-width wide, and its viewport stacks at z-index.detail',
      async () => {
        await expect(dialog).toHaveAttribute('data-variant', 'line')
        const width = parseFloat(token('size-detail-width'))
        await expect(Math.abs(dialog.getBoundingClientRect().width - width)).toBeLessThan(0.5)
        const viewport = dialog.closest<HTMLElement>('.pn-DetailPanel-viewport')!
        await expect(getComputedStyle(viewport).zIndex).toBe(token('z-index-detail'))
      },
    )
    await step('the open panel holds only owned and caller words, in da (CR-8)', async () => {
      const unmount = mount(
        <PerronProvider locale="da">
          <DetailPanel {...args} data-testid="panel-da" />
        </PerronProvider>,
      )
      const da = await byTestId('panel-da')
      expectOwnedStrings(da.outerHTML, 'da', [LINE_NAME, DESTINATION, NEXT_STOP, ...LINES])
      unmount()
    })
    await step(
      'Esc closes it with reason escape-key, and focus returns to the trigger',
      async () => {
        await panel(`${LINE_NAME} ${DESTINATION}`)
        await escapeCloses(trigger, args.onClose)
      },
    )
    await step(
      '`title`, `lineName`, `subheader` and `children` show a string, an element and a list alike',
      async () => {
        await expectEveryShape(args, `${LINE_NAME} ${DESTINATION}`, {
          title: DESTINATION,
          lineName: LINE_NAME,
          subheader: NEXT_STOP,
          children: LINES[0],
        })
      },
    )
  },
}

/** A station several lines serve: a neutral marker, its name, the lines it has, and a short body. */
export const Stop: Story = {
  args: {
    variant: 'stop',
    line: undefined,
    lineName: undefined,
    title: STOP,
    subheader: STOP_LINES,
    children: body(STOP_BODY),
    trigger: <Button>{STOP_TRIGGER}</Button>,
  },
  play: async ({ canvasElement, args, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: STOP_TRIGGER })
    const dialog = await panel(STOP)
    await step('the root carries data-variant stop', async () => {
      await expect(dialog).toHaveAttribute('data-variant', 'stop')
    })
    await step(
      'Tab from the popup reaches the close button; Enter on it closes the panel with reason close-press, and focus returns to the trigger',
      async () => {
        dialog.focus()
        await userEvent.tab()
        await expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus()
        await userEvent.keyboard('{Enter}')
        await closed()
        await expect(args.onClose).toHaveBeenLastCalledWith(
          expect.anything(),
          'close-press',
          expect.anything(),
        )
        await waitFor(() => expect(trigger).toHaveFocus())
        trigger.blur()
      },
    )
    await step(
      '`title`, `subheader` and `children` show a string, an element and a list alike',
      async () => {
        await expectEveryShape(args, STOP, {
          title: STOP,
          subheader: STOP_LINES,
          children: STOP_BODY[0],
        })
      },
    )
  },
}

/** Line's panel with its own control, "Show on map", before the close button. */
export const WithAction: Story = {
  args: { action: showOnMap },
  play: async ({ canvasElement, args, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: LINE_TRIGGER })
    const dialog = await panel(`${LINE_NAME} ${DESTINATION}`)
    const action = within(dialog).getByRole('button', { name: SHOW_ON_MAP })
    const close = within(dialog).getByRole('button', { name: 'Close' })
    await step(
      'Tab from the popup reaches "Show on map", then "Close"; Shift+Tab comes back',
      async () => {
        dialog.focus()
        await userEvent.tab()
        await expect(action).toHaveFocus()
        await userEvent.tab()
        await expect(close).toHaveFocus()
        await userEvent.tab({ shift: true })
        await expect(action).toHaveFocus()
      },
    )
    await step("the close button is centred on the header's height", async () => {
      const header = part(dialog, 'DetailPanel-header').getBoundingClientRect()
      const button = close.getBoundingClientRect()
      const centre = (box: DOMRect) => box.top + box.height / 2
      await expect(Math.abs(centre(button) - centre(header))).toBeLessThanOrEqual(1)
    })
    await step(
      'Esc closes it with reason escape-key, and focus returns to the trigger',
      async () => {
        await escapeCloses(trigger, args.onClose)
      },
    )
    await step('`action` shows a string, an element and a list alike', async () => {
      await expectEveryShape(args, `${LINE_NAME} ${DESTINATION}`, { action: SHOW_ON_MAP })
    })
  },
}

/** A long Danish name and a subheader, each wrapping beside the action and the close button. */
export const LongTitle: Story = {
  args: {
    variant: 'stop',
    line: 'm3',
    lineName: undefined,
    title: 'Københavns Hovedbanegård (Tietgensgade)',
    subheader: 'Metro M3, entrance on Tietgensgade, beside the bus terminal',
    children: body(STOP_BODY),
    action: showOnMap,
    trigger: <Button>{STOP_TRIGGER}</Button>,
  },
  play: async ({ canvasElement, args, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: STOP_TRIGGER })
    const dialog = await screen.findByRole('dialog')
    await step(
      'the title and the subheader wrap, the buttons stay whole inside the panel, and the root is no wider than size.detail-width',
      async () => {
        const box = dialog.getBoundingClientRect()
        await expect(box.width).toBeLessThanOrEqual(parseFloat(token('size-detail-width')) + 0.5)
        for (const name of ['DetailHeader-title', 'DetailHeader-subheader']) {
          const text = part(dialog, name)
          const lineHeight = parseFloat(getComputedStyle(text).lineHeight)
          await expect(text.getBoundingClientRect().height).toBeGreaterThan(lineHeight)
          await expect(text.scrollWidth).toBeLessThanOrEqual(text.clientWidth)
        }
        for (const button of within(dialog).getAllByRole('button')) {
          await expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth)
          await expect(button.getBoundingClientRect().left).toBeGreaterThanOrEqual(box.left)
          await expect(button.getBoundingClientRect().right).toBeLessThanOrEqual(box.right)
        }
        await expect(dialog.scrollWidth).toBeLessThanOrEqual(dialog.clientWidth)
      },
    )
    await step(
      'Esc closes it with reason escape-key, and focus returns to the trigger',
      async () => {
        await escapeCloses(trigger, args.onClose)
      },
    )
  },
}

/** Line's panel as a phone's bottom sheet, open at the `size.sheet-peek` snap point. */
export const OnPhone: Story = {
  args: { anchor: 'bottom', children: body([...LINES, ...LONG]) },
  play: async ({ canvasElement, args, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: LINE_TRIGGER })
    const dialog = await panel(`${LINE_NAME} ${DESTINATION}`)
    await step(
      'the root carries data-anchor bottom, and its viewport stacks at z-index.detail',
      async () => {
        await expect(dialog).toHaveAttribute('data-anchor', 'bottom')
        const viewport = dialog.closest<HTMLElement>('.pn-DetailPanel-viewport')!
        await expect(getComputedStyle(viewport).zIndex).toBe(token('z-index-detail'))
      },
    )
    await step('the header row stays in place while the body scrolls', async () => {
      const header = part(dialog, 'DetailPanel-header')
      const content = part(dialog, 'DetailPanel-content')
      await waitFor(() => expect(content.scrollHeight).toBeGreaterThan(content.clientHeight))
      const top = header.getBoundingClientRect().top
      content.scrollTop = content.scrollHeight
      await waitFor(() => expect(content.scrollTop).toBeGreaterThan(0))
      await expect(header.getBoundingClientRect().top).toBe(top)
      content.scrollTop = 0
    })
    await step(
      'Esc closes it with reason escape-key, and focus returns to the trigger',
      async () => {
        await escapeCloses(trigger, args.onClose)
      },
    )
  },
}
