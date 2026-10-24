import { CloseButton } from '../../parts/CloseButton/CloseButton.tsx'
import { VisuallyHidden } from '../../parts/VisuallyHidden/VisuallyHidden.tsx'

/** A dialog: it composes the parts and draws neither. */
export const Dialog = () => (
  <div className="pn-Dialog">
    <VisuallyHidden>Dialog</VisuallyHidden>
    <CloseButton label="Close" />
  </div>
)
