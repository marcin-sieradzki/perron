// Declares two shared helpers again, and a local of the same name inside a function, which is not one.
import { classes } from '../../internal/nodes.ts'

const given = (node: unknown) => node != null

function usePart() {
  return null
}

export function Card({ className }: { className?: string }) {
  const known = given(className)
  usePart()
  return <div className={classes('pn-Card', className)} data-known={known} />
}
