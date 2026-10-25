// One foundation page, Content design among them. A placeholder until ticket T4 draws its prose
// and its table blocks from the page's segments.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Markdown } from '@/components/site/Markdown.tsx'
import { PageHeader } from '@/components/site/PageHeader.tsx'
import { readFoundation, readFoundations } from '@/lib/foundations.ts'
import { firstParagraph } from '@/lib/markdown.ts'

type Props = { params: Promise<{ slug: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return readFoundations().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = readFoundation((await params).slug)
  return page ? { title: page.title } : {}
}

export default async function FoundationPage({ params }: Props) {
  const page = readFoundation((await params).slug)
  if (!page) notFound()
  const first = page.segments[0]
  const intro = first?.kind === 'prose' ? firstParagraph(first.markdown) : ''
  return (
    <div className="page">
      <PageHeader
        overline="Foundations"
        title={page.title}
        lead={intro ? <Markdown source={intro} path={page.path} inline /> : undefined}
      />
    </div>
  )
}
