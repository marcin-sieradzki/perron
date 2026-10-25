// Home. A placeholder until ticket T3 builds the page of Home.dc.html over the full map.
import { PageHeader } from '@/components/site/PageHeader.tsx'
import { PACKAGES, readPackage } from '@/lib/repo.ts'

export default function HomePage() {
  const { version } = readPackage(PACKAGES.perron)
  return (
    <div className="page">
      <PageHeader
        overline={`Mylder's design system, version ${version}`}
        title="Everything that floats over the map"
        lead="Perron is the set of tokens, components, patterns and words behind Mylder, a live map of Copenhagen's buses, S-tog, metro and trains, and how sure we are about each of them."
      />
    </div>
  )
}
