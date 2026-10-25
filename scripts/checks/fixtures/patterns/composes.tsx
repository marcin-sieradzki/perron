// A pattern that composes a pattern its dependsOn names, and reads the helpers that read no Base UI.
import { DetailHeader } from '../DetailHeader/DetailHeader.tsx'
import { classes } from '../../internal/nodes.ts'
import { tokenValue } from '../../internal/tokens.ts'
import { UnknownValue } from '../../internal/UnknownValue.tsx'

export const Fixture = () => (
  <DetailHeader
    className={classes('pn-Fixture', undefined)}
    title={tokenValue('--perron-space-100')}
  >
    <UnknownValue />
  </DetailHeader>
)
