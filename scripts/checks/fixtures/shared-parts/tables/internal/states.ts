export const STATE_KEY = {
  live: 'live',
  ageing: 'ageing',
  estimated: 'estimated',
  'no-signal': 'noSignal',
} as const

export const STATES = Object.keys(STATE_KEY)
