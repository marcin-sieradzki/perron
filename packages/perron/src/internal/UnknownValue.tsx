// A value no one knows, as content design writes it (docs/components/README.md, "Shared helpers").
import { VisuallyHidden } from '../parts/VisuallyHidden/VisuallyHidden.tsx'

/** U+2014, the dash content design writes for unknown. */
export const UNKNOWN = '—'

/** "—" for the eye, and `label`, such as "Unknown", for the ear in its own text run. */
export function UnknownValue({ label }: { label: string }) {
  return (
    <>
      <span aria-hidden="true">{UNKNOWN}</span>
      <VisuallyHidden>{label}</VisuallyHidden>
    </>
  )
}
