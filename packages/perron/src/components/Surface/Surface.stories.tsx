// Surface's stories, one per step of the surface ladder the deferred design will draw, and Nested,
// the ladder together. Each variant story shows the shapes `children` takes: a list of nodes, a
// string and one element. The play tests read the DOM and the accessibility tree, not the pixels.
import { createRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Button } from '../Button/Button.tsx'
import { Surface } from './Surface.tsx'
import type { SurfaceProps } from './Surface.tsx'

const typography = (role: string): CSSProperties => ({
  font: `var(--perron-typography-${role})`,
  letterSpacing: `var(--perron-typography-${role}-tracking)`,
  margin: 0,
})

/**
 * A busy, map-like backdrop of land, water, a park, streets and a metro line, its busiest parts
 * under the panels on the left, so the blur has something to soften.
 */
const BACKDROP: CSSProperties = {
  background: [
    'linear-gradient(90deg, transparent 0 24%, var(--perron-color-transit-line-m2) 24% 26%, transparent 26%)',
    'repeating-linear-gradient(35deg, var(--perron-color-map-street) 0 var(--perron-space-100), transparent var(--perron-space-100) var(--perron-space-600))',
    'radial-gradient(circle at 40% 10%, var(--perron-color-map-water) 0 25%, transparent 25%)',
    'radial-gradient(circle at 5% 80%, var(--perron-color-map-park) 0 20%, transparent 20%)',
    'var(--perron-color-map-land)',
  ].join(', '),
}

/** The background each story sets its surfaces on: the one the spec's Stories table names. */
function Stage({ background, children }: { background: CSSProperties; children: ReactNode }) {
  return (
    <div
      style={{
        ...background,
        display: 'grid',
        gap: 'var(--perron-space-300)',
        justifyItems: 'start',
        padding: 'var(--perron-space-500)',
        color: 'var(--perron-color-text-primary)',
      }}
    >
      {children}
    </div>
  )
}

/** Content laid out in a column: Surface sets no layout of its own (CR-3). */
function Column({ children }: { children: ReactNode }) {
  return <div style={{ display: 'grid', gap: 'var(--perron-space-200)' }}>{children}</div>
}

/**
 * The three shapes `children` takes in one variant, as the spec's checklist asks: `list`, the
 * story's content as a list of nodes; then a string; then one element.
 */
function Shapes({
  variant,
  list,
  text,
  element,
}: {
  variant: SurfaceProps['variant']
  list: ReactNode
  text: string
  element: ReactNode
}) {
  return (
    <>
      <Surface variant={variant} data-testid="list" style={{ maxInlineSize: '24rem' }}>
        {list}
      </Surface>
      <Surface variant={variant} data-testid="string" style={typography('body')}>
        {text}
      </Surface>
      <Surface variant={variant} data-testid="element">
        {element}
      </Surface>
    </>
  )
}

const meta = {
  title: 'Components/Surface',
  component: Surface,
  args: { variant: 'raised', children: 'Next train to Lufthavnen in 3 min' },
} satisfies Meta<typeof Surface>

export default meta
type Story = StoryObj<typeof meta>

/** The surface `testId` names inside the story. */
const surfaceIn = (canvasElement: HTMLElement, testId: string) =>
  within(canvasElement).getByTestId(testId)

/** Each of the three shapes rendered, on the root, with the variant's data attribute. */
async function expectShapes(canvasElement: HTMLElement, variant: string) {
  for (const testId of ['list', 'string', 'element']) {
    const root = surfaceIn(canvasElement, testId)
    await expect(root).toHaveClass('pn-Surface')
    await expect(root).toHaveAttribute('data-variant', variant)
    await expect(root).not.toHaveAttribute('variant')
    await expect(root.textContent?.trim()).not.toBe('')
  }
}

/** The one surface the contract story renders: a raised card holding a string. */
export const Default: Story = {
  args: { variant: 'raised', children: 'Next train to Lufthavnen in 3 min' },
  render: (args) => (
    <Stage background={{ background: 'var(--perron-color-surface-default)' }}>
      <Surface {...args} style={typography('body')} />
    </Stage>
  ),
}

/** A raised card on the panel's surface, holding a heading, a line of text and a Button. */
export const Raised: Story = {
  args: { variant: 'raised' },
  render: (args) => (
    <Stage background={{ background: 'var(--perron-color-surface-default)' }}>
      <Shapes
        variant={args.variant}
        list={
          <Column>
            <h2 style={typography('heading-sm')}>Nørreport</h2>
            <p style={typography('body')}>Next train to Lufthavnen in 3 min, from platform 2.</p>
            <div>
              <Button variant="outline">Show departures</Button>
            </div>
          </Column>
        }
        text="No disruptions on the M2 line"
        element={<p style={typography('body')}>Step-free access from Frederiksborggade</p>}
      />
    </Stage>
  ),
  play: async ({ canvasElement }) => {
    await expectShapes(canvasElement, 'raised')
    const root = surfaceIn(canvasElement, 'list')
    // a generic <div>: no role, no name, not focusable (Keyboard and ARIA)
    await expect(root.tagName).toBe('DIV')
    await expect(root.className).toBe('pn-Surface')
    await expect(root).not.toHaveAttribute('role')
    await expect(root).not.toHaveAttribute('tabindex')
    await expect(root).not.toHaveAccessibleName()
    // Tab passes the surface by and lands on the Button inside it, then Shift+Tab goes back
    const button = within(root).getByRole('button', { name: 'Show departures' })
    const start = document.activeElement
    await userEvent.tab()
    await expect(button).toHaveFocus()
    await userEvent.tab({ shift: true })
    await expect(document.activeElement).toBe(start)
  },
}

/** An inset box set into a raised card's surface, holding a line of text. */
export const Inset: Story = {
  args: { variant: 'inset' },
  render: (args) => (
    <Stage background={{ background: 'var(--perron-color-surface-raised)' }}>
      <Shapes
        variant={args.variant}
        list={
          <Column>
            <p style={typography('label')}>Platform 2</p>
            <p style={typography('body')}>Trains towards Lufthavnen stop at the front.</p>
          </Column>
        }
        text="Next train to Lufthavnen in 3 min"
        element={<p style={typography('body')}>Step-free access from Frederiksborggade</p>}
      />
    </Stage>
  ),
  play: async ({ canvasElement }) => {
    await expectShapes(canvasElement, 'inset')
  },
}

/** The panel content glass and opaque hold, over the map. */
const panel = (
  <Column>
    <h2 style={typography('heading-md')}>Nørreport</h2>
    <p style={typography('body')}>
      Metro M1 and M2, S-trains and regional trains. Next train to Lufthavnen in 3 min.
    </p>
  </Column>
)

/** A glass panel floating over a busy map, which the blur softens. */
export const Glass: Story = {
  args: { variant: 'glass' },
  render: (args) => (
    <Stage background={BACKDROP}>
      <Shapes
        variant={args.variant}
        list={panel}
        text="No disruptions on the M2 line"
        element={<p style={typography('body')}>Step-free access from Frederiksborggade</p>}
      />
    </Stage>
  ),
  play: async ({ canvasElement }) => {
    await expectShapes(canvasElement, 'glass')
  },
}

/** The same panel, opaque, over the same map: what a phone full of text uses. */
export const Opaque: Story = {
  args: { variant: 'opaque' },
  render: (args) => (
    <Stage background={BACKDROP}>
      <Shapes
        variant={args.variant}
        list={panel}
        text="No disruptions on the M2 line"
        element={<p style={typography('body')}>Step-free access from Frederiksborggade</p>}
      />
    </Stage>
  ),
  play: async ({ canvasElement }) => {
    await expectShapes(canvasElement, 'opaque')
  },
}

const panelRef = createRef<HTMLDivElement>()
const cardRef = createRef<HTMLDivElement>()
const boxRef = createRef<HTMLDivElement>()

/**
 * The ladder together: a glass panel rendered as a named `<section>`, holding a raised card that
 * holds an inset box, over the map.
 */
export const Nested: Story = {
  args: { variant: 'glass' },
  render: (args) => (
    <Stage background={BACKDROP}>
      <Surface
        variant={args.variant}
        ref={panelRef}
        render={<section aria-labelledby="surface-nested-title" />}
        style={{ maxInlineSize: '24rem' }}
      >
        <Column>
          <h2 id="surface-nested-title" style={typography('heading-md')}>
            Nørreport
          </h2>
          <Surface variant="raised" ref={cardRef}>
            <Column>
              <h3 style={typography('heading-sm')}>Metro M2</h3>
              <p style={typography('body')}>Next train to Lufthavnen in 3 min.</p>
              <Surface variant="inset" ref={boxRef} style={typography('body')}>
                Platform 2, front of the train
              </Surface>
            </Column>
          </Surface>
        </Column>
      </Surface>
    </Stage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // the outer root is a region named by its heading, still a glass Surface
    const region = canvas.getByRole('region', { name: 'Nørreport' })
    await expect(region.tagName).toBe('SECTION')
    await expect(region).toHaveClass('pn-Surface')
    await expect(region).toHaveAttribute('data-variant', 'glass')
    await expect(panelRef.current).toBe(region)
    // the card and the box step down the ladder, each ref on its root
    const card = cardRef.current!
    const box = boxRef.current!
    await expect(region).toContainElement(card)
    await expect(card).toContainElement(box)
    await expect(card).toHaveClass('pn-Surface')
    await expect(card).toHaveAttribute('data-variant', 'raised')
    await expect(box).toHaveClass('pn-Surface')
    await expect(box).toHaveAttribute('data-variant', 'inset')
    await expect(card.tagName).toBe('DIV')
    await expect(box.tagName).toBe('DIV')
  },
}
