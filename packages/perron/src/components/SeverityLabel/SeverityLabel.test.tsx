// SeverityLabel's props type holds the rule of its spec's Do and don't checked by types: each line
// under a `@ts-expect-error DD-<n>` is one the compiler rejects, so `npm run typecheck` fails the
// day SeverityLabelProps accepts it. Spec: docs/components/severity-label.md.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SeverityLabel } from './SeverityLabel.tsx'

describe("SeverityLabel's props type", () => {
  it('rejects a kind of its own invention, which breaks the render at run time (DD-5)', () => {
    const misuses = [
      // @ts-expect-error DD-5: success is no kind of disruption; a line running normally has none
      () => <SeverityLabel severity="success" />,
      // @ts-expect-error DD-5: the five kinds are disruptions and notices, never good news
      () => <SeverityLabel severity="normal" />,
    ]
    for (const misuse of misuses) expect(() => renderToStaticMarkup(misuse())).toThrow(TypeError)
  })
})
