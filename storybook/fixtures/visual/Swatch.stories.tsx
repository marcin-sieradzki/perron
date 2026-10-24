// A made-up component whose stories scripts/visual.test.ts measures: one story per variant of the
// fixture read-back, scripts/checks/fixtures/visual/penpot/swatch.json, named as the visual stage
// names them.
import type { Meta, StoryObj } from '@storybook/react-vite'
import '../../../packages/perron/tokens/generated/tokens.css'
import './Swatch.css'

function Swatch({ tone = 'plain' }: { tone?: 'plain' | 'brand' }) {
  return (
    <span className="pn-Swatch" data-tone={tone}>
      <span className="pn-Swatch-dot" />
    </span>
  )
}

export default { title: 'Components/Swatch', component: Swatch } satisfies Meta<typeof Swatch>

type Story = StoryObj<typeof Swatch>

export const PlainDefault: Story = { args: { tone: 'plain' } }
export const PlainHover: Story = { args: { tone: 'plain' } }
export const BrandDefault: Story = { args: { tone: 'brand' } }
