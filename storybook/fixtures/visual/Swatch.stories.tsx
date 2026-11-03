// A made-up component whose Default story scripts/visual.test.ts measures, once per variant of the
// fixture read-back, scripts/checks/fixtures/visual/penpot/swatch.json, with that variant's args.
import type { Meta, StoryObj } from '@storybook/react-vite'
import '../../../packages/perron/tokens/generated/tokens.css'
import './Swatch.css'

function Swatch({ tone = 'plain' }: { tone?: 'plain' | 'brand' }) {
  return (
    <span className="pn-Swatch" data-tone={tone} tabIndex={0}>
      <span className="pn-Swatch-dot" />
    </span>
  )
}

export default { title: 'Components/Swatch', component: Swatch } satisfies Meta<typeof Swatch>

type Story = StoryObj<typeof Swatch>

export const Default: Story = { args: { tone: 'plain' } }
