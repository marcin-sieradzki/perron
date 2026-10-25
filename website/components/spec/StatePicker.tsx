'use client'
// The states on a phone, Phone-Button.dc.html's: a segmented control per axis picks one row, and
// its states follow as a list. With nothing to pick, every row is listed under its name.
import { useState, type ReactNode } from 'react'
import { Segment, SegmentedControl } from '@mylder/perron'

export interface PickerRow {
  key: string
  label: string
  /** The row's value of each axis, such as `{ variant: 'solid', color: 'neutral' }` */
  props: Record<string, string>
  /** One cell per state, in the states' order */
  cells: ReactNode[]
}

export interface PickerAxis {
  prop: string
  label: string
  values: { value: string; label: string }[]
}

function States({ row, states }: { row: PickerRow; states: { state: string; label: string }[] }) {
  return (
    <ul className="spec-picker-list">
      {states.map((s, i) => (
        <li key={s.state}>
          <span className="spec-row-label">{s.label}</span>
          {row.cells[i]}
        </li>
      ))}
    </ul>
  )
}

export function StatePicker({
  axes,
  rows,
  states,
  className,
}: {
  axes: PickerAxis[]
  rows: PickerRow[]
  states: { state: string; label: string }[]
  className: string
}) {
  const [picked, setPicked] = useState(rows[0].props)
  if (!axes.length)
    return (
      <div className={`spec-picker ${className}`}>
        {rows.map((row) => (
          <div key={row.key} className="spec-picker-group">
            <span className="spec-overline">{row.label}</span>
            <States row={row} states={states} />
          </div>
        ))}
      </div>
    )
  const row = rows.find((r) => axes.every((a) => r.props[a.prop] === picked[a.prop])) ?? rows[0]
  return (
    <div className={`spec-picker ${className}`}>
      <div className="spec-picker-controls">
        {axes.map((a) => (
          <SegmentedControl
            key={a.prop}
            aria-label={a.label}
            value={picked[a.prop]}
            onChange={(_, value) => setPicked((p) => ({ ...p, [a.prop]: value }))}
          >
            {a.values.map((v) => (
              <Segment key={v.value} value={v.value}>
                {v.label}
              </Segment>
            ))}
          </SegmentedControl>
        ))}
      </div>
      <States row={row} states={states} />
    </div>
  )
}
