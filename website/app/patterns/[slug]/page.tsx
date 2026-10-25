// One pattern's spec page, on the components' template: one route per registry pattern with a spec
// page.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SpecPage } from '@/components/spec/SpecPage.tsx'
import { entryBySlug, routedEntries } from '@/lib/registry.ts'

type Props = { params: Promise<{ slug: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return routedEntries('pattern').map((e) => ({ slug: e.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const entry = entryBySlug('pattern', (await params).slug)
  return entry ? { title: entry.name, description: entry.description || undefined } : {}
}

export default async function PatternPage({ params }: Props) {
  const entry = entryBySlug('pattern', (await params).slug)
  if (!entry?.hasSpec) notFound()
  return <SpecPage entry={entry} />
}
