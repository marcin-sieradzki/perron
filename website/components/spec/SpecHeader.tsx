// A spec page's header, over the layout's map: the breadcrumb to its layer and category, the title
// with its status, links to its Storybook page and its spec, the spec's intro as the lead, and on
// phones the "On this page" select.
import NextLink from 'next/link'
import { Tag } from '@mylder/perron'
import { Markdown } from '@/components/site/Markdown.tsx'
import type { RegistryEntry } from '../../lib/registry.ts'
import { githubUrl } from '../../lib/repo.ts'
import { STATUS_LABEL, storybookUrl } from '../../lib/spec.ts'
import { TocSelect } from './TocSelect.tsx'
import type { TocItem } from './SpecToc.tsx'

const STATUS_COLOR = {
  designing: 'neutral',
  building: 'info',
  stable: 'success',
  deprecated: 'warning',
} as const

export function SpecHeader({
  entry,
  intro,
  toc,
}: {
  entry: RegistryEntry
  intro: { lead: string; rest: string }
  toc: TocItem[]
}) {
  const layer = entry.layer === 'pattern' ? 'Patterns' : 'Components'
  const storybook = entry.built ? storybookUrl(entry) : undefined
  return (
    <header id="overview" className="page-header spec-section">
      <nav aria-label="Breadcrumb" className="spec-breadcrumb">
        <NextLink href={`/${layer.toLowerCase()}`} className="link">
          {layer}
        </NextLink>{' '}
        <span aria-hidden="true">/</span> {entry.category}
      </nav>
      <div className="page-header-row">
        <div className="spec-title">
          <h1 className="title">{entry.name}</h1>
          <Tag color={STATUS_COLOR[entry.status]} variant={entry.built ? 'filled' : 'dashed'}>
            {STATUS_LABEL[entry.status]}
          </Tag>
        </div>
        <div className="page-header-actions spec-actions">
          {storybook ? (
            <a href={storybook} className="spec-action hover">
              Storybook
            </a>
          ) : null}
          <a href={githubUrl(entry.specPath)} className="spec-action hover">
            Spec
          </a>
        </div>
      </div>
      {intro.lead ? (
        <p className="lead">
          <Markdown source={intro.lead} path={entry.specPath} inline />
        </p>
      ) : null}
      {intro.rest ? <Markdown source={intro.rest} path={entry.specPath} /> : null}
      {!entry.built ? (
        <p className="spec-designing">
          {entry.name} is in design: its spec is written, and its code is not in{' '}
          <code>@mylder/perron</code> yet, so this page draws no preview.
        </p>
      ) : null}
      {toc.length > 1 ? <TocSelect items={toc} /> : null}
    </header>
  )
}
