// One foundation page, Content design among them: the sidebar, the page's prose from its markdown,
// and each table block drawn from the page's rows as swatches, specimens, bars, galleries and
// contrast cells, then the pages before and after it.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { introOf, plain } from '@/components/foundations/data.ts'
import { FoundationBody } from '@/components/foundations/FoundationBody.tsx'
import { Crumbs, FoundationsNav, PageNav } from '@/components/foundations/Navigation.tsx'
import '@/components/foundations/foundations.css'
import { Markdown } from '@/components/site/Markdown.tsx'
import { PageHeader } from '@/components/site/PageHeader.tsx'
import { readFoundation, readFoundations } from '@/lib/foundations.ts'

type Props = { params: Promise<{ slug: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return readFoundations().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = readFoundation((await params).slug)
  if (!page) return {}
  const intro = introOf(page)
  return { title: page.title, ...(intro ? { description: plain(intro).replaceAll('`', '') } : {}) }
}

export default async function FoundationPage({ params }: Props) {
  const page = readFoundation((await params).slug)
  if (!page) notFound()
  const intro = introOf(page)
  return (
    <div className="page fd-layout">
      <FoundationsNav current={page.slug} />
      <article className="fd-main">
        <div className="fd-head">
          <Crumbs title={page.title} />
          <PageHeader
            title={page.title}
            lead={intro ? <Markdown source={intro} path={page.path} inline /> : undefined}
          />
        </div>
        <FoundationBody page={page} />
        <PageNav slug={page.slug} />
      </article>
    </div>
  )
}
