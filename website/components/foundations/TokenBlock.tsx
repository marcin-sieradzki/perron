// One token block of a foundation page, drawn from its rows instead of the markdown table it
// replaces: typography roles as specimens, colours as swatches in each theme, the spacing scale as
// bars, and anything else as rows with a live preview of each token. A themed preview sits in a
// `data-theme` cell, so it reads that theme's value of the custom property in place.
import type { TokenRow, TokenSegment } from './data.ts'
import { cssValue, spaced, words } from './data.ts'
import { TokenPreview } from './TokenPreview.tsx'

function Value({ row, theme }: { row: TokenRow; theme: string }) {
  const { css, alias } = row.values[theme]
  return (
    <span className="fd-value">
      <code>{spaced(css)}</code>
      {alias ? <span className="fd-alias">{alias}</span> : null}
    </span>
  )
}

/** Typography roles: a specimen of each, with its parts. */
function TypeSpecimens({ rows }: { rows: TokenRow[] }) {
  return (
    <div className="fd-types">
      {rows.map((row) => {
        const t = row.typography!
        return (
          <div className="fd-type" key={row.name}>
            <TokenPreview row={row} />
            <p className="fd-type-meta">
              <code>{row.name}</code> {t.family} {t.weight}, {t.size} / {t.lineHeight}, tracking{' '}
              {t.tracking}
              {t.textTransform ? `, ${t.textTransform}` : null}
            </p>
            {row.description ? <p className="fd-type-use">{row.description}</p> : null}
          </div>
        )
      })}
    </div>
  )
}

/** Colours: a swatch per token, split into its themes, each half painted in place. */
function SwatchGrid({ themes, rows }: { themes: string[]; rows: TokenRow[] }) {
  return (
    <ul className="fd-swatch-grid">
      {rows.map((row) => (
        <li key={row.name} className="fd-swatch-card">
          <span className="fd-swatch-split" aria-hidden="true">
            {themes.map((t) => (
              <span
                key={t}
                className="fd-swatch-half"
                {...(themes.length > 1 ? { 'data-theme': t } : {})}
              >
                <span className="fd-swatch-paint" style={{ background: cssValue(row) }} />
              </span>
            ))}
          </span>
          <code className="fd-swatch-token">{row.name}</code>
          <span className="fd-swatch-values">
            {themes.map((t) => (
              <span key={t} className="fd-swatch-value">
                {themes.length > 1 ? <span className="fd-theme-name">{words(t)}</span> : null}
                <Value row={row} theme={t} />
              </span>
            ))}
          </span>
          {row.description ? <span className="fd-use">{row.description}</span> : null}
        </li>
      ))}
    </ul>
  )
}

/** The spacing scale: a bar per step, at the step's own length. */
function ScaleBars({ rows }: { rows: TokenRow[] }) {
  return (
    <ul className="fd-scale">
      {rows.map((row) => {
        const [theme] = Object.keys(row.values)
        return (
          <li key={row.name} className="fd-scale-row">
            <code className="fd-scale-name">{row.name}</code>
            <span className="fd-bar" style={{ inlineSize: cssValue(row) }} />
            <Value row={row} theme={theme} />
          </li>
        )
      })}
    </ul>
  )
}

/** Any other block: a row per token, with a preview in each theme and the reduced motion value. */
function TokenRows({ themes, contexts, rows }: Omit<TokenSegment, 'kind'>) {
  const themed = themes.length > 1
  return (
    <div className="scroll-x fd-table-frame">
      <table className="fd-table">
        <thead>
          <tr>
            <th scope="col">Token</th>
            {themes.map((t) => (
              <th key={t} scope="col">
                {themed ? words(t) : 'Value'}
              </th>
            ))}
            {contexts.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <th scope="row">
                <code>{row.name}</code>
                {row.description ? <span className="fd-use">{row.description}</span> : null}
              </th>
              {themes.map((t) => (
                <td key={t}>
                  <div className="fd-cell" {...(themed ? { 'data-theme': t } : {})}>
                    <TokenPreview row={row} />
                    <Value row={row} theme={t} />
                  </div>
                </td>
              ))}
              {contexts.map((c) => (
                <td key={c}>{row.overrides[c] ? <code>{spaced(row.overrides[c])}</code> : null}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function TokenBlock({ themes, contexts, rows }: Omit<TokenSegment, 'kind'>) {
  if (rows.every((r) => r.typography)) return <TypeSpecimens rows={rows} />
  if (rows.every((r) => r.type === 'color')) return <SwatchGrid themes={themes} rows={rows} />
  if (rows.every((r) => r.name.startsWith('space.'))) return <ScaleBars rows={rows} />
  return <TokenRows themes={themes} contexts={contexts} rows={rows} />
}
