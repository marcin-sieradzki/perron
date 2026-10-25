// Patterns: the index of Patterns.dc.html. The map screen with each stable pattern in its place, a
// card per stable pattern holding its preview, the patterns still in design, and how to import
// one. Every list and count comes from the registry's pattern entries.
import type { Metadata } from 'next'
import { MapScreen } from '@/components/patterns/MapScreen.tsx'
import { PatternCard } from '@/components/patterns/PatternCard.tsx'
import { UsePattern } from '@/components/patterns/UsePattern.tsx'
import '@/components/patterns/patterns.css'
import { PageHeader } from '@/components/site/PageHeader.tsx'
import { byCategory, entriesOf } from '@/lib/registry.ts'
import { githubUrl } from '@/lib/repo.ts'

export const metadata: Metadata = { title: 'Patterns' }

/** The contract every component and pattern is built to; the site has no page for it. */
const CONTRACT = 'docs/components/README.md'

export default function PatternsPage() {
  const patterns = entriesOf('pattern')
  const stable = patterns.filter((e) => e.status === 'stable')
  const designing = patterns.filter((e) => e.status === 'designing')

  return (
    <div className="page patterns">
      <nav aria-label="Patterns" className="patterns-nav glass">
        <a href="#top" aria-current="location" className="patterns-nav-link hover">
          Overview <span className="patterns-count">{stable.length}</span>
        </a>
        {byCategory(stable).map(({ category, entries }) => (
          <div key={category} className="patterns-nav-group">
            <span className="patterns-nav-category">{category}</span>
            {entries.map((e) => (
              <a key={e.slug} href={`#${e.slug}`} className="patterns-nav-link hover">
                {e.name}
              </a>
            ))}
          </div>
        ))}
        <hr className="patterns-nav-rule" />
        <a href="#in-design" className="patterns-nav-link hover">
          In design <span className="patterns-count">{designing.length}</span>
        </a>
      </nav>

      <div id="top" className="patterns-main">
        <PageHeader
          title="Patterns"
          lead="Pieces of a Mylder screen, built only from Perron components."
          actions={
            <a href={githubUrl(CONTRACT)} className="patterns-action hover">
              The contract
            </a>
          }
        />
        <p className="patterns-intro">
          A pattern takes Mylder&apos;s own data, such as a disruption or a vehicle&apos;s trip, and
          lays out components for it. It never reaches past them to Base UI, so every pattern keeps
          their keyboard, their words in four languages and both themes.
        </p>

        <MapScreen />

        <section aria-labelledby="stable" className="patterns-section">
          <h2 id="stable" className="patterns-heading">
            Stable <span className="patterns-count">{stable.length}</span>
          </h2>
          <div className="patterns-grid">
            {stable.map((e) => (
              <PatternCard key={e.slug} entry={e} />
            ))}
          </div>
        </section>

        <section id="in-design" aria-labelledby="designing" className="patterns-section">
          <h2 id="designing" className="patterns-heading">
            In design <span className="patterns-count">{designing.length}</span>
          </h2>
          <ul className="patterns-designing">
            {designing.map((e) => (
              <li key={e.slug} className="patterns-designing-item">
                <span className="patterns-designing-name">{e.name}</span>
                <span className="patterns-designing-parts">Will compose {listOf(e.dependsOn)}</span>
              </li>
            ))}
          </ul>
        </section>

        <UsePattern />
      </div>
    </div>
  )
}

/** Names as a sentence lists them: "LineBadge, Delay and VehicleDot". */
function listOf(names: string[]) {
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
}
