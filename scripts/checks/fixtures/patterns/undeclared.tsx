// A pattern that composes a pattern its dependsOn leaves out, and a helper that reads Base UI.
import { DetailHeader } from '../DetailHeader/DetailHeader.tsx'
import { usePart } from '../../internal/use-part.ts'

export const Fixture = () => <DetailHeader {...usePart({})} />
