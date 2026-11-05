// A made-up Pin's stories, which cite Flag's rule from the wrong folder.
import { Flag } from '../Flag/Flag.tsx'

// @ts-expect-error DD-2: Flag has no huge size
export const Huge = () => <Flag size="huge" />
