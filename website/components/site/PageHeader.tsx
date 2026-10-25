// A page's header: an optional overline, the title in the page-title role (typography.display,
// typography.heading-lg under breakpoint.phone), an optional row of actions beside it, and the
// lead in typography.lead. Every page opens with one, inside a `.page` container.
import type { ReactNode } from 'react'

export interface PageHeaderProps {
  /** The page's title, in sentence case: the page's one h1 */
  title: ReactNode
  /** The paragraph under the title, one or two sentences */
  lead?: ReactNode
  /** A short line above the title, set in capitals by the overline role: write sentence case */
  overline?: ReactNode
  /** Links or buttons beside the title, such as Storybook or the spec; never the brand yellow */
  actions?: ReactNode
}

export function PageHeader({ title, lead, overline, actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      {overline ? <div className="page-header-overline">{overline}</div> : null}
      <div className="page-header-row">
        <h1 className="title">{title}</h1>
        {actions ? <div className="page-header-actions">{actions}</div> : null}
      </div>
      {lead ? <p className="lead">{lead}</p> : null}
    </header>
  )
}
