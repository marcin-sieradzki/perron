// VehicleTable: the vehicles in service as a native table, one row each: the vehicle's line, where
// it is going, how fresh its position is and how late it runs, the map's text alternative. A
// pattern: plain table elements over LineBadge, VehicleDotLabel and Delay, never Base UI (CR-1).
// Spec: docs/patterns/vehicle-table.md.
import type { ComponentPropsWithRef, CSSProperties, ReactNode, Ref } from 'react'
import { Delay } from '../../components/Delay/Delay.tsx'
import { LineBadge } from '../../components/LineBadge/LineBadge.tsx'
import type { LineBadgeProps } from '../../components/LineBadge/LineBadge.tsx'
import { VehicleDotLabel } from '../../components/VehicleDotLabel/VehicleDotLabel.tsx'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import { classes } from '../../internal/nodes.ts'
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
}

/** The four columns, in order, each with the owned string its header shows (CR-3, CR-5). */
const COLUMNS = [
  ['line', 'lineColumn'],
  ['destination', 'destinationColumn'],
  ['position', 'positionColumn'],
  ['delay', 'delayColumn'],
] as const

/**
 * The minutes a vehicle's Delay shows (CR-4): unknown for a timetable-only or no-signal vehicle,
 * whatever `delay` holds, and unknown when `delay` is left out.
 */
function minutesOf({ variant, delay }: VehicleTableVehicle): number | null {
  if (variant === 'timetable-only' || variant === 'no-signal') return null
  return delay ?? null
}

export interface VehicleTableProps extends Omit<ComponentPropsWithRef<'table'>, 'children'> {
  /**
   * The vehicles to show, one row each, in this order: each one's line, destination, data state
   * and delay. An empty array shows the header row alone.
   */
  vehicles: ReadonlyArray<VehicleTableVehicle>
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
 * fresh its position is and how late it runs. The map's text alternative; read, never operated.
 */
export function VehicleTable({
  vehicles,
  lineColumnLabel,
  destinationColumnLabel,
  positionColumnLabel,
  delayColumnLabel,
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
  })
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
          {COLUMNS.map(([column, key]) => (
            <th
              key={column}
              scope="col"
              className="pn-VehicleTable-headerCell"
              data-column={column}
            >
              {strings[key]}
            </th>
          ))}
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
            <td className="pn-VehicleTable-delayCell">
              <Delay
                className="pn-VehicleTable-delay"
                minutes={minutesOf(vehicle)}
                {...delayLabels}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
