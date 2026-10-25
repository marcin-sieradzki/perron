// The props table in MUI's layout, as Storybook's PropsTable draws it: name, type, default and
// description, one row per prop api.json gives the entry, with defaults and descriptions from its
// spec. On a phone, the same rows as a list.
import { Markdown } from '@/components/site/Markdown.tsx'
import type { ComponentApi } from '../../lib/api.ts'
import type { RegistryEntry } from '../../lib/registry.ts'
import { propRows, type SpecPropRow } from '../../lib/spec.ts'

export function PropsTable({
  entry,
  api,
  spec,
}: {
  entry: RegistryEntry
  api: ComponentApi
  spec: SpecPropRow[]
}) {
  const rows = propRows(api, spec)
  const md = (source: string) => <Markdown source={source} path={entry.specPath} inline />
  return (
    <section id="props" className="spec-section" aria-labelledby="props-heading">
      <h2 id="props-heading" className="spec-heading">
        Props
      </h2>
      <div className="spec-panel glass scroll-x spec-props-table">
        <table className="spec-props">
          <thead>
            <tr className="spec-overline">
              <th scope="col">Name</th>
              <th scope="col">Type</th>
              <th scope="col">Default</th>
              <th scope="col">Description</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <td className="spec-prop-name">
                  <code>{row.name}</code>
                  {row.required ? (
                    <abbr className="spec-required" title="Required">
                      *
                    </abbr>
                  ) : null}
                </td>
                <td className="spec-prop-type">
                  <code>{row.type}</code>
                </td>
                <td className="spec-prop-default">{row.default ? md(row.default) : '—'}</td>
                <td className="spec-prop-description">{md(row.description)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl className="spec-panel spec-props-list">
        {rows.map((row) => (
          <div key={row.name}>
            <dt>
              <code>
                {row.name}
                {row.required ? <span className="spec-required"> (required)</span> : null}
              </code>
              <span>
                {row.type}, default {row.default ? md(row.default) : '—'}
              </span>
            </dt>
            <dd>{md(row.description)}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
