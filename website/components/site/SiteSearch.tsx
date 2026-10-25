// The docs search: the header's search button, with its / key hint. A stub until ticket T8 builds
// the search (website/PLAN.md), Perron's Dialog and SearchField over an index of every page's
// title and headings, made at build time by website/lib/search-index.ts and opened by / or here.
// This file is a server component, so T8 can read the index here and hand it to a client part
// that holds the dialog; SiteHeader renders <SiteSearch /> and needs no change.
import { Button, Kbd } from '@/components/perron'
import { PackageIcon } from './PackageIcon.tsx'

export interface SiteSearchProps {
  /** The button's words; the / key is shown beside them */
  label?: string
}

export function SiteSearch({ label = 'Search the docs' }: SiteSearchProps) {
  return (
    <Button
      variant="outline"
      className="site-search"
      aria-label={label}
      aria-keyshortcuts="/"
      startIcon={<PackageIcon name="search" />}
      endIcon={<Kbd aria-hidden="true">/</Kbd>}
    >
      <span className="site-search-label">{label}</span>
    </Button>
  )
}
