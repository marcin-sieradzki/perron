// The docs search: the header's search button, with its / key hint, and the dialog it opens,
// Perron's Dialog and SearchField over an index of every page's title and headings. A server
// component: it reads the index made at build time by website/lib/search-index.ts and hands it,
// with the icon, to the client part that holds the dialog (SiteSearchDialog).
import '../../app/phone.css'
import { readSearchIndex } from '../../lib/search-index.ts'
import { PackageIcon } from './PackageIcon.tsx'
import { SiteSearchDialog } from './SiteSearchDialog.tsx'

export interface SiteSearchProps {
  /** The button's words; the / key is shown beside them */
  label?: string
}

export function SiteSearch({ label = 'Search the docs' }: SiteSearchProps) {
  return (
    <SiteSearchDialog
      index={readSearchIndex()}
      label={label}
      icon={<PackageIcon name="search" />}
    />
  )
}
