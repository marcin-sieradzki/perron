// The overview a showcase story lays its examples out in (docs/components/README.md, "Stories"):
// one example per cell, each named, so a reader compares the variants, sizes or states of a
// component side by side in one story, and the story's `play` tests every cell.
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
}

/**
 * Every row by every column, `render` drawing each cell: the row's name at its start and each
 * column's name over it. With no `columns`, the rows stack, each name over its cell, so a wide
 * example, such as a field or a panel, keeps the width it is given. Each cell carries its row's
 * and column's names, for `cellOf`.
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
  if (!columns)
    return (
      <div style={{ display: 'grid', gap: 'var(--perron-space-400)' }}>
        {rows.map((r) => (
          <div key={r.label} style={{ display: 'grid', gap: 'var(--perron-space-100)' }}>
            <span style={name}>{r.label}</span>
            <div data-row={r.label} data-column="">
              {render(r.value, undefined as C)}
            </div>
          </div>
        ))}
      </div>
    )
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `max-content repeat(${columns.length}, max-content)`,
        gap: 'var(--perron-space-200) var(--perron-space-400)',
        alignItems: 'center',
      }}
    >
      <span />
      {columns.map((c) => (
        <span key={c.label} style={name}>
          {c.label}
        </span>
      ))}
      {rows.map((r) => (
        <Fragment key={r.label}>
          <span style={name}>{r.label}</span>
          {columns.map((c) => (
            <div key={c.label} data-row={r.label} data-column={c.label}>
              {render(r.value, c.value)}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  )
}

/** The cell of a showcase in `canvas`, by its row's name and, in a grid, its column's. */
export function cellOf(canvas: HTMLElement, row: string, column = '') {
  const cell = [...canvas.querySelectorAll<HTMLElement>('[data-row]')].find(
    (c) => c.dataset.row === row && c.dataset.column === column,
  )
  if (!cell) throw new Error(`the showcase has no cell ${row}${column ? `, ${column}` : ''}`)
  return cell
}

/** A story's parts a showcase cell takes: the args it adds, its own render, and its play. */
interface CellStory<A> {
  args?: Partial<A>
  render?: (args: A, context: never) => ReactNode
  play?: (context: never) => Promise<void> | void
}

/**
 * A showcase story made of stories: each cell renders one of `cells` with the story's args and its
 * own over them, by its own `render` or by `render`, stacked and named. Its `play` runs each cell's
 * `play` in turn, with that cell as the canvas and the cell's args, each spy cleared first and focus
 * just before the cell, so a cell tests what it tested as a story of its own.
 */
export function showcase<A extends object>(
  cells: readonly { label: string; story: CellStory<A> }[],
  render: (args: A) => ReactNode,
) {
  const argsOf = (args: A, story: CellStory<A>) => ({ ...args, ...story.args }) as A
  return {
    render: (args: A, context: unknown) => (
      <Showcase
        rows={cells.map((c) => ({ label: c.label, value: c.story }))}
        render={(story) =>
          story.render
            ? story.render(argsOf(args, story), context as never)
            : render(argsOf(args, story))
        }
      />
    ),
    play: async (context: { args: A; canvasElement: HTMLElement }) => {
      for (const { label, story } of cells) {
        if (!story.play) continue
        const args = argsOf(context.args, story)
        for (const value of Object.values(args))
          (value as { mockClear?: () => void } | undefined)?.mockClear?.()
        const cell = cellOf(context.canvasElement, label)
        // focus starts just before the cell, as it would before a story of its own, so Tab
        // reaches the cell first and Shift+Tab leaves it
        const start = document.createElement('span')
        start.tabIndex = 0
        cell.before(start)
        start.focus()
        try {
          await story.play({ ...context, args, canvasElement: cell } as never)
        } finally {
          start.remove()
        }
      }
    },
  }
}
