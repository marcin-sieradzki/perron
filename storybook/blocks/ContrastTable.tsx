// Each colour on each background, in each theme, drawn from the live custom properties, with the
// ratio the build measured. A ratio under the page's minimum is marked.
import type { ContrastRow } from '../../scripts/lib/pages.ts'

const title = (s: string) => s[0].toUpperCase() + s.slice(1)
const leaf = (name: string) => name.slice(name.lastIndexOf('.') + 1)

export function ContrastTable({
  minimum,
  themes,
  backgrounds,
  rows,
}: {
  minimum: number
  themes: string[]
  backgrounds: { name: string; cssVar: string }[]
  rows: ContrastRow[]
}) {
  return (
    <div className="pd-table">
      <table>
        <thead>
          <tr>
            <th>Colour</th>
            {themes.flatMap((t) =>
              backgrounds.map((b) => (
                <th key={t + b.name}>
                  {title(t)} {leaf(b.name)}
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td>
                <code>{row.name}</code>
              </td>
              {themes.flatMap((t) =>
                backgrounds.map((b) => {
                  const ratio = row.ratios[t][b.name]
                  const miss = ratio < minimum
                  return (
                    <td key={t + b.name}>
                      <div
                        className="pd-contrast"
                        data-theme={t}
                        data-miss={miss || undefined}
                        style={{ background: `var(${b.cssVar})`, color: `var(${row.cssVar})` }}
                      >
                        <span aria-hidden="true">Aa</span>
                        <span className="pd-ratio">
                          {ratio.toFixed(2)}:1{miss && ' miss'}
                        </span>
                      </div>
                    </td>
                  )
                }),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
