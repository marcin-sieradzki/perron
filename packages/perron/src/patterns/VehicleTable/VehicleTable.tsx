'use client'
// VehicleTable: the vehicles in service as a native table, one row each: the vehicle's line, where
// it is going, how fresh its position is, when it last reported and how late it runs, the map's
// text alternative. A pattern: plain table elements over LineBadge, VehicleDotLabel and Delay,
// never Base UI (CR-1). Its sort is the caller's: it marks the order it is given and reports a
// press on a header, never reordering a row itself (CR-10). Spec: docs/patterns/vehicle-table.md.
import type { ComponentPropsWithRef, CSSProperties, MouseEvent, ReactNode, Ref } from 'react'
import { Delay } from '../../components/Delay/Delay.tsx'
import { LineBadge } from '../../components/LineBadge/LineBadge.tsx'
import type { LineBadgeProps } from '../../components/LineBadge/LineBadge.tsx'
import { VehicleDotLabel } from '../../components/VehicleDotLabel/VehicleDotLabel.tsx'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import { classes, known } from '../../internal/nodes.ts'
import { UnknownValue } from '../../internal/UnknownValue.tsx'
import { delayKnown } from '../../internal/vehicle-states.ts'
import type { VehicleState } from '../../internal/vehicle-states.ts'
import './VehicleTable.css'

/** One vehicle, one row of VehicleTable's `vehicles`. */
export interface VehicleTableVehicle {
  /**
   * The vehicle's own identifier, unique in the array and the same from one update to the next;
   * the row's React key, never shown.
   */
  id: string
  /**
   * The vehicle's line, typed as LineBadge's and VehicleDotLabel's `line`: the badge's colours and
   * the dot's.
   */
  line: LineBadgeProps['line']
  /** The line's short name as riders know it, "5C", "M2" or "A": the badge's label. */
  lineName: ReactNode
  /**
   * Where the vehicle is going, as the operator writes it: "Husum Torv", "Lufthavnen". A caller
   * that opens a vehicle passes a Perron Link here.
   */
  destination: ReactNode
  /**
   * How fresh the vehicle's position is, as Data states names the five states, typed as
   * VehicleDotLabel's `variant` is: the dot's shape and the word beside it. Required. Set on the
   * row as `data-variant`.
   */
  variant: VehicleState
  /**
   * How late the vehicle runs, in minutes, as Delay's `minutes` takes it: positive late, negative
   * early, `0` on time, `null` unknown. Left out, the delay is unknown; a `timetable-only` or
   * `no-signal` vehicle's is always unknown.
   */
  delay?: number | null
  /**
   * Optional. The time the vehicle last reported its position, 24-hour `HH:MM`, such as `'08:14'`,
   * shown in the Last seen column when `lastSeenColumnVisible` is set. Left out, that column shows
   * "—", heard as "Unknown".
   */
  lastSeen?: string
}

/** A column of VehicleTable, as its header's `data-column` and a sort name it. */
export type VehicleTableColumn = 'line' | 'destination' | 'position' | 'last-seen' | 'delay'

/** The order the caller has put `vehicles` in: by which column, and which way. */
export interface VehicleTableSort {
  /** The column the vehicles are sorted by. */
  column: VehicleTableColumn
  /** Which way: `'asc'`, ascending, or `'desc'`, descending, as MUI's TableSortLabel takes it. */
  direction: 'asc' | 'desc'
}

/** The five columns, in order, each with the owned string its header shows (CR-3, CR-5). */
const COLUMNS = [
  ['line', 'lineColumn'],
  ['destination', 'destinationColumn'],
  ['position', 'positionColumn'],
  ['last-seen', 'lastSeenColumn'],
  ['delay', 'delayColumn'],
] as const

/** The `aria-sort` of the sorted column's header, by the sort's direction (CR-10). */
const ARIA_SORT = { asc: 'ascending', desc: 'descending' } as const

/**
 * The sort a press on `column`'s header asks for (CR-10): the other direction when the vehicles are
 * already sorted by it, else ascending.
 */
function nextSort(column: VehicleTableColumn, sort: VehicleTableSort | null | undefined) {
  const flip = sort?.column === column && sort.direction === 'asc'
  return { column, direction: flip ? 'desc' : 'asc' } satisfies VehicleTableSort
}

/**
 * `arrow-down` from packages/perron/icons/, inlined unchanged but for width, height and xmlns, and
 * turned up when ascending; hidden from the ear, since the header's `aria-sort` says it (CR-10).
 */
function SortIcon() {
  return (
    // icons/arrow-down.svg
    <svg
      className="perron-icon pn-VehicleTable-sortIcon"
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 2.2v9.4" />
      <path d="m3.4 8 3.6 3.6L10.6 8" />
    </svg>
  )
}

/**
 * The minutes a vehicle's Delay shows (CR-4): unknown for a timetable-only or no-signal vehicle,
 * whatever `delay` holds, and unknown when `delay` is left out.
 */
function minutesOf({ variant, delay }: VehicleTableVehicle): number | null {
  return delayKnown(variant) ? (delay ?? null) : null
}

export interface VehicleTableProps extends Omit<ComponentPropsWithRef<'table'>, 'children'> {
  /**
   * The vehicles to show, one row each, in this order: each one's line, destination, data state
   * and delay. An empty array shows the header row alone.
   */
  vehicles: ReadonlyArray<VehicleTableVehicle>
  /**
   * The order the caller has put `vehicles` in, which the table marks on that column's header with
   * `aria-sort` and an arrow; it reorders no row. Left out, or `null`, no column is marked.
   */
  sort?: VehicleTableSort | null
  /**
   * Called when a column's header is pressed, with the press's event and the sort it asks for: that
   * column ascending, or the other way when `sort` already names it. Given, every header is a
   * button and says its sort state; the caller sorts `vehicles` and passes the new `sort`.
   */
  onSortChange?: (event: MouseEvent<HTMLButtonElement>, sort: VehicleTableSort) => void
  /**
   * Leaves out the Delay column, for vehicles whose data carries no delay at all
   * @default false
   */
  delayColumnHidden?: boolean
  /**
   * Shows the Last seen column, the time each vehicle last reported, before the Delay column
   * @default false
   */
  lastSeenColumnVisible?: boolean
  /**
   * Overrides "Line", the header of the line column
   * @default The locale's
   */
  lineColumnLabel?: string
  /**
   * Overrides "Destination", the header of the destination column
   * @default The locale's
   */
  destinationColumnLabel?: string
  /**
   * Overrides "Position", the header of the data state column
   * @default The locale's
   */
  positionColumnLabel?: string
  /**
   * Overrides "Delay", the header of the delay column
   * @default The locale's
   */
  delayColumnLabel?: string
  /**
   * Overrides "Last seen", the header of the last-seen column
   * @default The locale's
   */
  lastSeenColumnLabel?: string
  /**
   * Overrides "Unknown", heard in place of "—" for a vehicle with no last-seen time
   * @default The locale's
   */
  unknownLabel?: string
  /**
   * Overrides "Live", the state's word when a vehicle's `variant` is `'live'`; given to every
   * VehicleDotLabel
   * @default The locale's
   */
  liveLabel?: string
  /**
   * Overrides "Ageing", the state's word when a vehicle's `variant` is `'ageing'`; given to every
   * VehicleDotLabel
   * @default The locale's
   */
  ageingLabel?: string
  /**
   * Overrides "Estimated", the state's word when a vehicle's `variant` is `'estimated'`; given to
   * every VehicleDotLabel
   * @default The locale's
   */
  estimatedLabel?: string
  /**
   * Overrides "Timetable only", the state's word when a vehicle's `variant` is
   * `'timetable-only'`; given to every VehicleDotLabel
   * @default The locale's
   */
  timetableOnlyLabel?: string
  /**
   * Overrides "No signal", the state's word when a vehicle's `variant` is `'no-signal'`; given to
   * every VehicleDotLabel
   * @default The locale's
   */
  noSignalLabel?: string
  /**
   * Overrides "min", the unit after each delay's figure; given to every Delay
   * @default The locale's
   */
  minutesUnitLabel?: string
  /**
   * Overrides "min late", heard after the number when late; given to every Delay
   * @default The locale's
   */
  minutesLateLabel?: string
  /**
   * Overrides "min early", heard after the number when early; given to every Delay
   * @default The locale's
   */
  minutesEarlyLabel?: string
  /**
   * Overrides "On time"; given to every Delay
   * @default The locale's
   */
  onTimeLabel?: string
  /**
   * Overrides "Delay unknown", heard in place of "—"; given to every Delay
   * @default The locale's
   */
  delayUnknownLabel?: string
  /** Joined after `pn-VehicleTable` on the root */
  className?: string
  /** Reaches the root */
  style?: CSSProperties
  /** Reaches the root element */
  ref?: Ref<HTMLTableElement>
}

/**
 * The vehicles in service as a table, one row each: the vehicle's line, where it is going, how
 * fresh its position is, optionally when it last reported, and how late it runs. The map's text
 * alternative: its rows are read, never operated, and its headers sort only through the caller.
 */
export function VehicleTable({
  vehicles,
  sort,
  onSortChange,
  delayColumnHidden = false,
  lastSeenColumnVisible = false,
  lineColumnLabel,
  destinationColumnLabel,
  positionColumnLabel,
  delayColumnLabel,
  lastSeenColumnLabel,
  unknownLabel,
  liveLabel,
  ageingLabel,
  estimatedLabel,
  timetableOnlyLabel,
  noSignalLabel,
  minutesUnitLabel,
  minutesLateLabel,
  minutesEarlyLabel,
  onTimeLabel,
  delayUnknownLabel,
  className,
  ref,
  ...rest
}: VehicleTableProps) {
  // CR-5: the column headers, with this instance's *Label props laid over the locale's
  const strings = useOwnedStrings({
    lineColumn: lineColumnLabel,
    destinationColumn: destinationColumnLabel,
    positionColumn: positionColumnLabel,
    delayColumn: delayColumnLabel,
    lastSeenColumn: lastSeenColumnLabel,
    unknown: unknownLabel,
  })
  // CR-3: Last seen only when asked for (CR-11), and Delay unless it is hidden (CR-12)
  const columns = COLUMNS.filter(
    ([column]) =>
      (column !== 'last-seen' || lastSeenColumnVisible) &&
      (column !== 'delay' || !delayColumnHidden),
  )
  // CR-5: every VehicleDotLabel and Delay gets the labels as the table was given them
  const stateLabels = { liveLabel, ageingLabel, estimatedLabel, timetableOnlyLabel, noSignalLabel }
  const delayLabels = {
    minutesUnitLabel,
    minutesLateLabel,
    minutesEarlyLabel,
    onTimeLabel,
    delayUnknownLabel,
  }

  return (
    // CR-2: the rest props first, so the table's own class wins; it owns no name (CR-5)
    <table {...rest} ref={ref} className={classes('pn-VehicleTable', className)}>
      <thead className="pn-VehicleTable-head">
        <tr className="pn-VehicleTable-headerRow">
          {columns.map(([column, key]) => {
            // CR-10: the sorted column says its direction; with a handler, every other says none
            const direction = sort?.column === column ? sort.direction : undefined
            const label = (
              <>
                {strings[key]}
                {direction && <SortIcon />}
              </>
            )
            return (
              <th
                key={column}
                scope="col"
                className="pn-VehicleTable-headerCell"
                data-column={column}
                data-direction={direction}
                data-sortable={onSortChange ? '' : undefined}
                aria-sort={direction ? ARIA_SORT[direction] : onSortChange ? 'none' : undefined}
              >
                {onSortChange ? (
                  <button
                    type="button"
                    className="pn-VehicleTable-sortButton"
                    onClick={(event) => onSortChange(event, nextSort(column, sort))}
                  >
                    {label}
                  </button>
                ) : (
                  label
                )}
              </th>
            )
          })}
        </tr>
      </thead>
      {/* CR-6: with no vehicles, an empty body under the header row */}
      <tbody className="pn-VehicleTable-body">
        {vehicles.map((vehicle) => (
          // CR-2: keyed by the vehicle's id, since vehicles reorder as their data comes in
          <tr key={vehicle.id} className="pn-VehicleTable-row" data-variant={vehicle.variant}>
            {/* CR-3: the line and the destination are the row's headers */}
            <th scope="row" className="pn-VehicleTable-lineCell">
              <LineBadge className="pn-VehicleTable-badge" line={vehicle.line} size="medium">
                {vehicle.lineName}
              </LineBadge>
            </th>
            <th scope="row" className="pn-VehicleTable-destinationCell">
              {vehicle.destination}
            </th>
            <td className="pn-VehicleTable-positionCell">
              <VehicleDotLabel
                className="pn-VehicleTable-status"
                variant={vehicle.variant}
                line={vehicle.line}
                {...stateLabels}
              />
            </td>
            {lastSeenColumnVisible && (
              <td className="pn-VehicleTable-lastSeenCell">
                {/* CR-11: the time as given, or "—", heard as "Unknown" */}
                {known(vehicle.lastSeen) ? (
                  <time className="pn-VehicleTable-lastSeen" dateTime={vehicle.lastSeen}>
                    {vehicle.lastSeen}
                  </time>
                ) : (
                  <UnknownValue label={strings.unknown} />
                )}
              </td>
            )}
            {/* CR-12: no Delay cell where the column is hidden */}
            {!delayColumnHidden && (
              <td className="pn-VehicleTable-delayCell">
                <Delay
                  className="pn-VehicleTable-delay"
                  minutes={minutesOf(vehicle)}
                  {...delayLabels}
                />
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
