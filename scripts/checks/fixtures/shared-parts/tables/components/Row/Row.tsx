const Icon = () => null

const KINDS = { delay: 'delays', data: 'dataFeed', planned: 'plannedWorks' } as const

const ICONS = { delay: Icon, data: 'dataFeed', planned: 'plannedWorks' }

const PAIR = { on: 'on', off: 'off' }

export const Row = () => [KINDS, ICONS, PAIR]
