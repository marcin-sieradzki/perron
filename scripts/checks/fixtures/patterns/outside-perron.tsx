import { DepartureRow } from '../DepartureRow/DepartureRow.tsx'
import { expectOwnedStrings } from '../../testing/owned-strings.ts'

export const Fixture = () => <DepartureRow check={expectOwnedStrings} />
