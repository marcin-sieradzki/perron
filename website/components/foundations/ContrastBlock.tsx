// A contrast block: each colour on each background, in each theme, painted with the live custom
// properties inside a `data-theme` cell, with the ratio the build measured. A ratio under the
// block's minimum says so in words.
import type { ContrastSegment } from './data.ts'
import { shortName, words } from './data.ts'

export function ContrastBlock({
  minimum,
  themes,
  backgrounds,
  rows,
}: Omit<ContrastSegment, 'kind'>) {
  return (
    <div className="scroll-x fd-table-frame">
      <table className="fd-table fd-contrast">
        <caption className="fd-contrast-caption">
          The ratio each pair reaches, against the minimum of {minimum}:1.
        </caption>
        <thead>
          <tr>
            <td />
            {themes.map((t) => (
              <th key={t} scope="colgroup" colSpan={backgrounds.length}>
                {words(t)}
              </th>
            ))}
          </tr>
          <tr>
            <th scope="col">Colour</th>
            {themes.flatMap((t) =>
              backgrounds.map((b) => (
                <th key={t + b.name} scope="col">
                  on {shortName(b.name)}
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <th scope="row">
                <code>{row.name}</code>
              </th>
              {themes.flatMap((t) =>
                backgrounds.map((b) => {
                  const ratio = row.ratios[t][b.name]
                  const miss = ratio < minimum
                  return (
                    <td key={t + b.name}>
                      <div
                        className="fd-contrast-cell"
                        data-theme={t}
                        data-miss={miss || undefined}
                        style={{ background: `var(${b.cssVar})`, color: `var(${row.cssVar})` }}
                      >
                        <span className="fd-contrast-sample" aria-hidden="true">
                          Aa
                        </span>
                        <span className="fd-contrast-ratio">
                          {ratio.toFixed(2)}:1{miss ? ', under' : null}
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
