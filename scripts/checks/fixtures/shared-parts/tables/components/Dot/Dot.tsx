import { STATE_KEY } from '../../internal/states.ts'

const LABELS = [
  { variant: 'live', key: 'live' },
  { variant: 'ageing', key: 'ageing' },
  { variant: 'no-signal', key: 'noSignal' },
] as const satisfies readonly { variant: string; key: string }[]

const PAIR = { on: 'on', off: 'off' }

export const Dot = () => [STATE_KEY, LABELS, PAIR]
