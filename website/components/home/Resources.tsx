// Where Perron lives, and what it is built with: the versions from the repo's package files.
import NextLink from 'next/link'
import { PACKAGES, readPackage, REPO_URL } from '@/lib/repo.ts'
import { STORYBOOK_URL } from '@/lib/spec.ts'
import type { HomeFigures } from './figures.ts'

export function Resources({ figures }: { figures: HomeFigures }) {
  const npm = `https://www.npmjs.com/package/${readPackage(PACKAGES.perron).name}`
  return (
    <section aria-label="Where Perron lives" className="home-resources">
      <ul className="home-resources-links">
        <li>
          <a href={STORYBOOK_URL} className="home-resource hover">
            Storybook
          </a>
        </li>
        <li>
          <a href={REPO_URL} className="home-resource hover">
            GitHub
          </a>
        </li>
        <li>
          <a href={npm} className="home-resource hover">
            npm
          </a>
        </li>
        <li>
          <NextLink href="/agents" className="home-resource hover">
            MCP server
          </NextLink>
        </li>
      </ul>
      <p className="home-resources-note">
        Built with React {figures.reactMajor}, Base UI {figures.baseUi} and DTCG tokens
      </p>
    </section>
  )
}
