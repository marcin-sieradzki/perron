// One component's spec page, Button.dc.html's: one route per registry component with a spec page.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SpecPage } from '@/components/spec/SpecPage.tsx'
import { entryBySlug, routedEntries } from '@/lib/registry.ts'

type Props = { params: Promise<{ slug: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return routedEntries('component').map((e) => ({ slug: e.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const entry = entryBySlug('component', (await params).slug)
  return entry ? { title: entry.name, description: entry.description || undefined } : {}
}

export default async function ComponentPage({ params }: Props) {
  const entry = entryBySlug('component', (await params).slug)
  if (!entry?.hasSpec) notFound()
  return <SpecPage entry={entry} />
}
