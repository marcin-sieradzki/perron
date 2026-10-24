// A token table with a live preview of each token: the preview reads the token's custom property,
// so it shows what perron.css ships, in each theme the token has.
import type { CSSProperties } from 'react'
import type { TokenRow, TokenValue } from '../../scripts/lib/pages.ts'

const SAMPLE = 'Linje 5C mod Husum Torv, 08:14'
const v = (row: TokenRow) => `var(${row.cssVar})`
const title = (s: string) => s[0].toUpperCase() + s.slice(1)

function Preview({ row }: { row: TokenRow }) {
  const value = v(row)
  const { name } = row
  switch (row.type) {
    case 'color':
      return <span className="pd-swatch" style={{ '--pd-fill': value } as CSSProperties} />
    case 'shadow':
      return <span className="pd-shadow" style={{ boxShadow: value }} />
    case 'typography':
      return (
        <span
          className={row.typography!.className}
          style={{ textTransform: row.typography!.textTransform as CSSProperties['textTransform'] }}
        >
          {SAMPLE}
        </span>
      )
    case 'fontFamily':
      return <span style={{ fontFamily: value, fontSize: 20 }}>Aa Øresund 08:14</span>
    case 'fontWeight':
      return <span style={{ fontWeight: value, fontSize: 20 }}>Aa</span>
    case 'duration':
      return <span className="pd-motion" style={{ '--pd-duration': value } as CSSProperties} />
    case 'cubicBezier':
      return <span className="pd-motion" style={{ '--pd-easing': value } as CSSProperties} />
    case 'strokeStyle':
      return <span className="pd-stroke" style={{ borderTopStyle: 'dashed' }} />
    case 'number':
      if (name.startsWith('opacity.'))
        return <span className="pd-swatch pd-solid" style={{ opacity: value }} />
      if (name.startsWith('font.line-height.'))
        return (
          <span className="pd-leading" style={{ lineHeight: value }}>
            Two lines of
            <br />
            body text
          </span>
        )
      return null
    case 'dimension':
      if (name.startsWith('radius.'))
        return <span className="pd-radius" style={{ borderRadius: value }} />
      if (/^(border\.width|focus\.width)/.test(name))
        return <span className="pd-stroke" style={{ borderTopWidth: value }} />
      if (name.startsWith('font.size.')) return <span style={{ fontSize: value }}>Aa</span>
      if (name.startsWith('icon.size.'))
        return <span className="pd-square" style={{ inlineSize: value, blockSize: value }} />
      // long measures drawn at 1:8 so a breakpoint fits the cell
      if (parseFloat(Object.values(row.values)[0].css) > 160)
        return <span className="pd-bar" style={{ inlineSize: `calc(${value} / 8)` }} title="1:8" />
      return <span className="pd-bar" style={{ inlineSize: value }} />
    default:
      return null
  }
}

function Value({ value }: { value: TokenValue }) {
  return (
    <span className="pd-value">
      <code>{value.css}</code>
      {value.alias && <small>{value.alias}</small>}
    </span>
  )
}

export function TokenTable({
  themes,
  contexts,
  rows,
}: {
  themes: string[]
  contexts: string[]
  rows: TokenRow[]
}) {
  const themed = themes.length > 1
  const described = rows.some((r) => r.description)
  if (rows.every((r) => r.typography)) return <TypeTable rows={rows} />
  return (
    <div className="pd-table">
      <table>
        <thead>
          <tr>
            <th>Token</th>
            {themed ? themes.map((t) => <th key={t}>{title(t)}</th>) : <th>Value</th>}
            {contexts.map((c) => (
              <th key={c}>{c}</th>
            ))}
            {described && <th>Use</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td>
                <code>{row.name}</code>
              </td>
              {themes.map((t) => (
                <td key={t}>
                  <div className="pd-cell" {...(themed ? { 'data-theme': t } : {})}>
                    <Preview row={row} />
                    <Value value={row.values[t]} />
                  </div>
                </td>
              ))}
              {contexts.map((c) => (
                <td key={c}>{row.overrides[c] && <code>{row.overrides[c]}</code>}</td>
              ))}
              {described && <td>{row.description}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Typography roles: a specimen of each, with its parts. */
function TypeTable({ rows }: { rows: TokenRow[] }) {
  return (
    <div className="pd-types">
      {rows.map((row) => {
        const t = row.typography!
        return (
          <div className="pd-type" key={row.name}>
            <Preview row={row} />
            <p>
              <code>{row.name}</code> {t.family} {t.weight}, {t.size} / {t.lineHeight}, tracking{' '}
              {t.tracking}
              {t.textTransform && `, ${t.textTransform}`}
            </p>
            {row.description && <p>{row.description}</p>}
          </div>
        )
      })}
    </div>
  )
}
