// The overview grid a showcase story lays its examples out in (docs/components/README.md,
// "Stories"): one example per cell, each row and column named, so a reader compares the variants,
// sizes or states of a component side by side in one story.
import { Fragment, type CSSProperties, type ReactNode } from 'react'
import { typography } from './stories.ts'

/** One row or column of a showcase: what a reader sees it named, and the value it stands for. */
export interface Axis<T> {
  label: string
  value: T
}

/** An axis whose values are strings, labelled as they read in sentence case. */
export const axis = <T extends string>(values: readonly T[]): Axis<T>[] =>
  values.map((value) => ({
    label: (value[0].toUpperCase() + value.slice(1)).replace(/-/g, ' '),
    value,
  }))

const name: CSSProperties = {
  ...typography('label-sm'),
  color: 'var(--perron-color-text-secondary)',
  alignSelf: 'center',
}

/**
 * Every row by every column, `render` drawing each cell: the row's name at its start and each
 * column's name over it. With no `columns`, one cell per row.
 */
export function Showcase<R, C = undefined>({
  rows,
  columns,
  render,
}: {
  rows: readonly Axis<R>[]
  columns?: readonly Axis<C>[]
  render: (row: R, column: C) => ReactNode
}) {
  const cols = columns ?? [{ label: '', value: undefined as C }]
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `max-content repeat(${cols.length}, max-content)`,
        gap: 'var(--perron-space-200) var(--perron-space-400)',
        alignItems: 'center',
      }}
    >
      {columns && (
        <>
          <span />
          {columns.map((c) => (
            <span key={c.label} style={name}>
              {c.label}
            </span>
          ))}
        </>
      )}
      {rows.map((r) => (
        <Fragment key={r.label}>
          <span style={name}>{r.label}</span>
          {cols.map((c) => (
            <div key={c.label}>{render(r.value, c.value)}</div>
          ))}
        </Fragment>
      ))}
    </div>
  )
}
