// A pattern built from Perron's components and parts only.
import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Departure } from '@mylder/domain'
import { Button } from '../../components/Button/Button.tsx'
import { VisuallyHidden } from '../../parts/VisuallyHidden/VisuallyHidden.tsx'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import { Badge } from '@mylder/perron'
import { minutes } from './minutes.ts'
import './Fixture.css'

export interface FixtureProps {
  /** The departure the row shows */
  departure: Departure
  /** Shown after the time */
  children?: ReactNode
}

export function Fixture({ departure, children }: FixtureProps) {
  const [open, setOpen] = useState(false)
  const strings = useOwnedStrings({})
  return (
    <Button onClick={() => setOpen(!open)}>
      <Badge>{minutes(departure)}</Badge>
      <VisuallyHidden>{strings.close}</VisuallyHidden>
      {children}
    </Button>
  )
}
