// A data state's VehicleDot, hidden from screen readers since its state's word sits beside it, or
// nothing while the registry has VehicleDot in design: a page draws the real dot or none.
import { VehicleDot, type VehicleDotProps } from '@/components/perron'
import { entryByName } from '@/lib/registry.ts'

export type StateVariant = NonNullable<VehicleDotProps['variant']>

/** Whether VehicleDot is stable, so the data states draw their dots beside their words. */
export const dotsDrawn = () => entryByName('VehicleDot')?.status === 'stable'

const VARIANTS: readonly StateVariant[] = [
  'live',
  'ageing',
  'estimated',
  'timetable-only',
  'no-signal',
]

/** A state's variant from its word as the Data states page writes it: "Timetable only" is `timetable-only`. */
export function stateVariant(word: string): StateVariant {
  const variant = word.toLowerCase().replaceAll(' ', '-') as StateVariant
  if (!VARIANTS.includes(variant)) throw new Error(`VehicleDot has no state "${word}"`)
  return variant
}

export function StateDot(props: VehicleDotProps) {
  return dotsDrawn() ? <VehicleDot aria-hidden {...props} /> : null
}
