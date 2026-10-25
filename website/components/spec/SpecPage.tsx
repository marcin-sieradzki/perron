// One component's or pattern's spec page, Button.dc.html's layout: the header over the layout's
// map, the entry in context on a framed map, variants by states, sizes, icons, props, the install
// strip and the spec's own sections, with the components list and "On this page" beside them. An
// entry takes only the sections its props support; one in design shows its spec and no preview.
// A server component: everything comes from the repo at build time.
import { hasPreview } from '@/previews/index.ts'
import { Markdown } from '@/components/site/Markdown.tsx'
import { readComponentApi } from '../../lib/api.ts'
import type { RegistryEntry } from '../../lib/registry.ts'
import { readRepoFile } from '../../lib/repo.ts'
import {
  PROSE_SECTIONS,
  bareDefault,
  entryStateStyles,
  readShippedCss,
  sizeSpecs,
  specBody,
  specIntro,
  specPropsTable,
  specSections,
  stateMatrix,
  unionValues,
} from '../../lib/spec.ts'
import { InContext } from './InContext.tsx'
import { InstallStrip } from './InstallStrip.tsx'
import { PageLinks } from './PageLinks.tsx'
import { PropsTable } from './PropsTable.tsx'
import { SpecAside } from './SpecAside.tsx'
import { SpecHeader } from './SpecHeader.tsx'
import { SpecToc, type TocItem } from './SpecToc.tsx'
import { SizesAndIcons } from './SizesAndIcons.tsx'
import { StatesSection } from './StatesSection.tsx'
import './spec.css'

/** The class the matrix's state styles are scoped to. */
const SCOPE = 'spec-states'

/** A heading's anchor: `Do and don't` as `do-and-dont`. */
const anchor = (heading: string) =>
  heading
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export function SpecPage({ entry }: { entry: RegistryEntry }) {
  const markdown = readRepoFile(entry.specPath)
  const intro = specIntro(markdown)
  const api = readComponentApi(entry.name)
  const drawn = entry.built && hasPreview(entry.name)
  const spec = specPropsTable(markdown, entry.name)
  const styles = drawn && api ? entryStateStyles(entry, `.${SCOPE}`) : undefined
  const matrix = api && styles ? stateMatrix(api, spec, styles) : undefined
  // the default size first, as Button.dc.html sets Medium before Small
  const defaultSize = bareDefault(spec, 'size')
  const sizes = (api && drawn ? unionValues(api, 'size', spec) : []).sort(
    (a, b) => Number(b === defaultSize) - Number(a === defaultSize),
  )
  const sizeRows = sizes.length
    ? sizeSpecs(readShippedCss(entry), entry.name, sizes, defaultSize)
    : []
  const icons =
    api && drawn ? (['startIcon', 'endIcon'] as const).filter((p) => p in api.props) : []
  const prose = entry.built ? specSections(markdown, PROSE_SECTIONS) : []

  const toc: TocItem[] = [
    { id: 'overview', label: 'Overview' },
    ...(matrix ? [{ id: 'states', label: 'Variants and states' }] : []),
    ...(sizeRows.length ? [{ id: 'sizes', label: 'Sizes' }] : []),
    ...(icons.length ? [{ id: 'icons', label: 'With icons' }] : []),
    ...(api && entry.built ? [{ id: 'props', label: 'Props' }] : []),
    ...(entry.built ? [{ id: 'install', label: 'Use it' }] : []),
    ...prose.map((s) => ({ id: anchor(s.heading), label: s.heading })),
  ]

  return (
    <div className="page spec">
      <div className="spec-layout">
        <SpecAside entry={entry} />
        <div className="spec-main">
          <div className="spec-content">
            <SpecHeader entry={entry} intro={intro} toc={toc} />

            {drawn && api ? <InContext entry={entry} api={api} intro={intro.lead} /> : null}

            {!entry.built ? (
              <section className="spec-section spec-prose" aria-label="The spec">
                <Markdown source={specBody(markdown)} path={entry.specPath} />
              </section>
            ) : null}

            {matrix && styles ? (
              <StatesSection
                name={entry.name}
                matrix={matrix}
                css={styles.css}
                scope={SCOPE}
                unforced={styles.styled && !styles.forceable}
                stacked={entry.layer === 'pattern'}
              />
            ) : null}

            {sizeRows.length || icons.length ? (
              <SizesAndIcons entry={entry} api={api!} spec={spec} sizes={sizeRows} icons={icons} />
            ) : null}

            {api && entry.built ? <PropsTable entry={entry} api={api} spec={spec} /> : null}

            {entry.built ? <InstallStrip entry={entry} /> : null}

            {prose.map((s) => (
              <section
                key={s.heading}
                id={anchor(s.heading)}
                className="spec-section spec-prose"
                aria-labelledby={`${anchor(s.heading)}-heading`}
              >
                <h2 id={`${anchor(s.heading)}-heading`} className="spec-heading">
                  {s.heading}
                </h2>
                <Markdown source={s.markdown.replace(/^## .*\n?/, '')} path={entry.specPath} />
              </section>
            ))}

            <PageLinks entry={entry} />
          </div>
          <SpecToc items={toc} />
        </div>
      </div>
    </div>
  )
}
