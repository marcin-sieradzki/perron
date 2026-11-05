// A made-up Pin's stories, which prove Pin's DD-2: a citation in Pin's folder proves no rule of Flag's.
import { Pin } from './Pin.tsx'

// @ts-expect-error DD-2: Pin has no huge size
export const Huge = () => <Pin size="huge" />
