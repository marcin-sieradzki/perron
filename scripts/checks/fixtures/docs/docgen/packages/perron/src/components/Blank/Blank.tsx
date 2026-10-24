// Declares BlankProps but does not take it, so the docgen finds Blank with no props, and the docs
// page's props table would be empty.
export interface BlankProps {
  /** The blank's words. */
  label: string
}

export function Blank() {
  return <span>blank</span>
}
