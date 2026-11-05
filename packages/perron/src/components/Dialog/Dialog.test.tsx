// Dialog's props type holds the rule of its spec's Do and don't checked by types: the line under a
// `@ts-expect-error DD-<n>` is one the compiler rejects, so `npm run typecheck` fails the day
// DialogProps accepts it. Spec: docs/components/dialog.md.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Button } from '../Button/Button.tsx'
import { Dialog } from './Dialog.tsx'

describe("Dialog's props type", () => {
  it('takes no disabled for the close button, which nothing refuses at run time (DD-7)', () => {
    // Dialog hands slotProps.close to Base UI's Dialog.Close, which would disable the button, and
    // renders with it as with any other prop. A server render draws the trigger but no popup.
    const misuse = (
      <Dialog
        title="Keys"
        trigger={<Button>Keys</Button>}
        // @ts-expect-error DD-7: the close button is never disabled
        slotProps={{ close: { disabled: true } }}
      />
    )
    expect(renderToStaticMarkup(misuse)).toContain('aria-haspopup="dialog"')
  })
})
