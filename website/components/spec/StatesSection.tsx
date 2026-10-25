// Variants and states: each variant and colour by rest, hover, pressed, focus and disabled, each
// cell the real component through getPreview. Hover, pressed and focus come from the component's
// own stylesheet, its state rules rewritten to the cell's attribute (lib/spec.ts), so a cell shows
// a state with no pointer and no copied value. On a phone, a row picked by variant and colour.
import type { ReactNode } from 'react'
import { getPreview } from '@/previews/index.ts'
import { cellProps, valueLabel, type Matrix, type State } from '../../lib/spec.ts'
import { StatePicker, type PickerRow } from './StatePicker.tsx'

const STATE_LABEL: Record<State, string> = {
  rest: 'Rest',
  hover: 'Hover',
  pressed: 'Pressed',
  focus: 'Focus',
  disabled: 'Disabled',
}

/** The most values an axis can have for a phone to pick it with a segmented control. */
const MAX_SEGMENTS = 4

/** A cell: a specimen, inert so it takes no pointer or focus of its own. */
const Cell = ({ children }: { children: ReactNode }) => (
  <div className="spec-cell" inert>
    {children}
  </div>
)

export function StatesSection({
  name,
  matrix,
  css,
  scope,
  unforced,
  stacked,
}: {
  name: string
  matrix: Matrix
  css: string
  scope: string
  /** Its stylesheet styles states only on parts a cell can't reach */
  unforced: boolean
  /** Its states run down the page at every width, for an entry a panel wide, such as a pattern */
  stacked: boolean
}) {
  const rows: PickerRow[] = matrix.rows.map((row) => ({
    key: row.key,
    label: row.label,
    props: row.props,
    cells: matrix.states.map((state) => (
      <Cell key={state}>{getPreview(name, cellProps(row, state))}</Cell>
    )),
  }))
  const states = matrix.states.map((s) => ({ state: s, label: STATE_LABEL[s] }))
  const pickable =
    matrix.crossed &&
    matrix.axes.length > 0 &&
    matrix.axes.every((a) => a.values.length <= MAX_SEGMENTS)
  const shown = matrix.states.map((s) => STATE_LABEL[s].toLowerCase())
  return (
    <section
      id="states"
      className={`spec-section${stacked ? ' spec-stacked' : ''}`}
      aria-labelledby="states-heading"
    >
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
      <h2 id="states-heading" className="spec-heading">
        Variants and states
      </h2>
      <div className={`spec-panel glass scroll-x spec-states-table ${scope}`}>
        <table className="spec-matrix">
          <thead>
            <tr>
              <td />
              {states.map((s) => (
                <th key={s.state} scope="col" className="spec-overline">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <th scope="row" className="spec-row-label">
                  {row.label}
                </th>
                {row.cells.map((cell, i) => (
                  <td key={states[i].state}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <StatePicker
        className={scope}
        axes={
          pickable
            ? matrix.axes.map((a) => ({
                prop: a.prop,
                label: a.prop === 'color' ? 'Colour' : valueLabel(a.prop),
                values: a.values.map((v) => ({ value: v, label: valueLabel(v) })),
              }))
            : []
        }
        rows={rows}
        states={states}
      />
      {unforced ? (
        <p className="spec-note">
          {name} styles hover, pressed and focus on its inner parts, which a still preview can't
          reach, so this table shows {shown.length > 1 ? shown.join(' and ') : shown[0]} only.
        </p>
      ) : null}
    </section>
  )
}
