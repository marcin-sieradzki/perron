// The phone menu: a menu button shown under breakpoint.phone, where the header's section links
// hide. A stub until ticket T8 builds it (website/PLAN.md): the button opens the sections as a
// bottom sheet, Perron's Sheet, with keyboard support and focus returned on close. This file is a
// server component, so T8 can keep a client part beside it; SiteHeader renders
// <SiteMenu sections={SECTIONS} /> and needs no change.
import { Button } from '@/components/perron'
import { MenuIcon } from './icons.tsx'
import type { SiteSection } from './sections.ts'

export interface SiteMenuProps {
  /** The sections the menu lists, in the header's order */
  sections: readonly SiteSection[]
}

// T8: the sheet lists `sections`; the stub draws the button alone
export function SiteMenu(_props: SiteMenuProps) {
  return (
    <Button variant="outline" className="site-menu-button" startIcon={<MenuIcon />}>
      Menu
    </Button>
  )
}
