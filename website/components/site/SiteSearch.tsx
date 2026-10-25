// The docs search: the header's search button, with its / key hint, and the dialog it opens,
// Perron's Dialog and SearchField over an index of every page's title and headings. A server
// component: it hands the icon to the client part that holds the dialog (SiteSearchDialog), which
// fetches the index, a static file made at build time (app/search-index.json), when it first opens.
import '../../app/phone.css'
import { PackageIcon } from './PackageIcon.tsx'
import { SiteSearchDialog } from './SiteSearchDialog.tsx'

export interface SiteSearchProps {
  /** The button's words; the / key is shown beside them */
  label?: string
}

export function SiteSearch({ label = 'Search the docs' }: SiteSearchProps) {
  return <SiteSearchDialog label={label} icon={<PackageIcon name="search" />} />
}
