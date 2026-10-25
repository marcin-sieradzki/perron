// The site's footer: the licence and the repository.
import { Link } from '@/components/perron'
import { REPO_URL } from '../../lib/repo.ts'

export function SiteFooter() {
  return (
    <footer className="site-footer page">
      <p>Perron is open source under the MIT licence.</p>
      <Link href={REPO_URL}>The repository on GitHub</Link>
    </footer>
  )
}
