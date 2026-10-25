// The site's header: a glass pill floating over the map, with Brand named Perron as the link home,
// the six section links, the docs search, the theme switch, the GitHub link and, on phones, the
// menu. No brand yellow here: the header has no main action. A server component; the parts that
// read the route or the theme are client components of their own.
import NextLink from 'next/link'
import { Brand } from '@/components/perron'
import { REPO_URL } from '../../lib/repo.ts'
import { SECTIONS } from '../../lib/sections.ts'
import { SiteMenu } from './SiteMenu.tsx'
import { SiteNav } from './SiteNav.tsx'
import { SiteSearch } from './SiteSearch.tsx'
import { ThemeSwitch } from './ThemeSwitch.tsx'

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-bar glass floating">
        <Brand brandNameLabel="Perron" className="site-brand" render={<NextLink href="/" />} />
        <SiteNav sections={SECTIONS} />
        <div className="site-header-actions">
          <SiteSearch />
          <ThemeSwitch />
          <a href={REPO_URL} className="site-header-link hover">
            GitHub
          </a>
          <SiteMenu sections={SECTIONS} />
        </div>
      </div>
    </header>
  )
}
