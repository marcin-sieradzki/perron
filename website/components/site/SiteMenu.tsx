// The phone menu: a menu button shown under breakpoint.phone, where the header's section links
// hide, opening the sections, the theme and GitHub as a bottom sheet, Perron's Sheet. A server
// component, so the repository's link comes from the loaders; the sheet and its state are the
// client part beside it (SiteMenuSheet).
import '../../app/phone.css'
import { REPO_URL } from '../../lib/repo.ts'
import type { SiteSection } from './sections.ts'
import { SiteMenuSheet } from './SiteMenuSheet.tsx'

export interface SiteMenuProps {
  /** The sections the menu lists, in the header's order */
  sections: readonly SiteSection[]
}

export function SiteMenu({ sections }: SiteMenuProps) {
  return <SiteMenuSheet sections={sections} repoUrl={REPO_URL} />
}
