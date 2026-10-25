// One pattern's spec page. A placeholder until ticket T5 builds it on the spec-page template.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Markdown } from '@/components/site/Markdown.tsx'
import { PageHeader } from '@/components/site/PageHeader.tsx'
import { entryBySlug, routedEntries } from '@/lib/registry.ts'

type Props = { params: Promise<{ slug: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return routedEntries('pattern').map((e) => ({ slug: e.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const entry = entryBySlug('pattern', (await params).slug)
  return entry ? { title: entry.name } : {}
}

export default async function PatternPage({ params }: Props) {
  const entry = entryBySlug('pattern', (await params).slug)
  if (!entry?.hasSpec) notFound()
  return (
    <div className="page">
      <PageHeader
        overline={entry.category}
        title={entry.name}
        lead={<Markdown source={entry.description} path={entry.specPath} inline />}
      />
    </div>
  )
}
