// Any address the site has no page for.
import type { Metadata } from 'next'
import NextLink from 'next/link'
import { Link } from '@/components/perron'
import { PageHeader } from '@/components/site/PageHeader.tsx'

export const metadata: Metadata = { title: 'Page not found' }

export default function NotFound() {
  return (
    <div className="page">
      <PageHeader
        title="Page not found"
        lead={
          <>
            No page lives at this address. The sections above lead to every page, or go back to{' '}
            <Link render={<NextLink href="/" />}>the home page</Link>.
          </>
        }
      />
    </div>
  )
}
