// The live map behind every page: map-data.ts's drawing, in the map and transit colour tokens, with
// each vehicle's dot in the shape of its data state. Vehicles glide along their lines with SVG
// animateMotion, metros wait at stations, and each report of a pulsing vehicle grows a ring for
// duration.report-pulse. Under prefers-reduced-motion the moving group hides and the still group
// shows each vehicle jumping from report to report. A vehicle with no signal keeps moving on the
// timetable, as Data states asks; only an ageing one, its report too old to move it on, stands
// still.
// A server component: the drawing is static markup, built once, with no script.
import type { CSSProperties } from 'react'
import { tokenNumber } from '../../lib/tokens.ts'
import {
  MOVING,
  PARKS,
  PULSE_GROWTH,
  PULSE_STROKE,
  REPORTS_PER_RUN,
  ROUTES,
  SHUTTLE_PAUSE,
  SIZE,
  STATION_RADIUS,
  STATIONS,
  STILL,
  STREET_WIDTH,
  WAIT,
  WATER,
  type DataState,
  type Mode,
  type MovingVehicle,
  type Route,
} from './map-data.ts'
import { pointAt, reportKeys, runKeys, stationShares, svgList, type Keys } from './motion.ts'
import { MapView, type MapViewName } from './MapView.tsx'
import './map.css'

export type { MapViewName }

export interface MapBackgroundProps {
  /**
   * `full`, the home page's map under the hero; `quiet`, a fainter strip behind a page's title; or
   * `framed`, a map in a page's own frame: whole, with no veil, filling its positioned container,
   * the drawing's middle at the frame's middle, and zoomed by the container's `--map-zoom`. Left
   * out, it follows the route: `full` on `/`, `quiet` everywhere else.
   */
  view?: MapViewName
  /** Prefixes the ids the vehicles' paths refer to; give one if a page draws a second map */
  idPrefix?: string
}

const routeById = new Map(ROUTES.map((r) => [r.id, r]))

function routeOf(id: string): Route {
  const route = routeById.get(id)
  if (!route) throw new Error(`map-data.ts: no route ${id}`)
  return route
}

/** The route's colour as a custom property each dot and ring reads. */
const lineColor = (route: Route) =>
  ({
    '--map-line': `var(--perron-color-transit-${route.color.replaceAll('.', '-')})`,
  }) as CSSProperties

/** The geometry of each data state's shape, from the vehicle-dot tokens. */
function dotGeometry() {
  const radius: Record<Mode, number> = {
    metro: tokenNumber('map.dot-radius.metro'),
    stog: tokenNumber('map.dot-radius.stog'),
    regional: tokenNumber('map.dot-radius.regional'),
    bus: tokenNumber('map.dot-radius.bus'),
  }
  // a ring or rim is pulled in by its inset, so every shape keeps the dot's outer size
  const inset: Record<DataState, number> = {
    live: 0,
    'no-signal': 0,
    ageing: tokenNumber('vehicle-dot.ageing.stroke-inset'),
    estimated: tokenNumber('vehicle-dot.estimated.stroke-inset'),
    timetable: tokenNumber('vehicle-dot.timetable.stroke-inset'),
  }
  return (mode: Mode, state: DataState) => radius[mode] - inset[state]
}

function Dot({ r, state }: { r: number; state: DataState }) {
  return <circle className={`map-dot map-dot-${state}`} r={r} />
}

/** A moving vehicle's keys along its route, with its waits at stations. */
function keysOf(v: MovingVehicle, route: Route): Keys {
  const stops = v.run.kind === 'through' ? stationShares(route.d, v.run.waitsAt, STATIONS) : []
  return runKeys(v.run, { reverse: v.reverse, stops, wait: WAIT, pause: SHUTTLE_PAUSE })
}

export function MapBackground({ view, idPrefix = 'map' }: MapBackgroundProps) {
  const size = dotGeometry()
  const pulse = tokenNumber('duration.report-pulse')
  const pathId = (route: Route) => `${idPrefix}-${route.id}`
  const streets = ROUTES.filter((r) => r.mode === 'bus')
  const lines = ROUTES.filter((r) => r.mode !== 'bus')

  const moving = MOVING.map((v) => {
    const route = routeOf(v.route)
    return { v, route, keys: keysOf(v, route), r: size(route.mode, v.state) }
  })

  const drawing = (
    <svg
      className="map-drawing"
      width="100%"
      height={SIZE.height}
      viewBox={`0 0 ${SIZE.width} ${SIZE.height}`}
      preserveAspectRatio="xMidYMin slice"
      focusable="false"
    >
      <g className="map-water">
        <path d={WATER.sea} />
        <path className="map-harbour" d={WATER.harbour.d} strokeWidth={WATER.harbour.width} />
        {WATER.lakes.map((l) => (
          <ellipse
            key={`${l.cx},${l.cy}`}
            cx={l.cx}
            cy={l.cy}
            rx={l.rx}
            ry={l.ry}
            transform={`rotate(${l.rotate} ${l.cx} ${l.cy})`}
          />
        ))}
      </g>
      <g className="map-parks">
        {PARKS.map((p) => (
          <ellipse key={`${p.cx},${p.cy}`} cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} />
        ))}
      </g>
      <g className="map-streets" strokeWidth={STREET_WIDTH}>
        {streets.map((r) => (
          <path key={r.id} id={pathId(r)} d={r.d} />
        ))}
      </g>
      <g className="map-lines">
        {lines.map((r) => (
          <path
            key={r.id}
            id={pathId(r)}
            className={`map-line map-line-${r.mode}`}
            style={lineColor(r)}
            d={r.d}
          />
        ))}
      </g>
      <g className="map-stations">
        {Object.entries(STATIONS).map(([id, s]) => (
          <circle key={id} cx={s.x} cy={s.y} r={STATION_RADIUS} />
        ))}
      </g>

      <g className="moving">
        {moving.map(({ v, route, keys, r }, i) => {
          const every = v.duration / REPORTS_PER_RUN
          return (
            <g key={i} style={lineColor(route)}>
              <animateMotion
                dur={`${v.duration}s`}
                begin={`${v.offset}s`}
                repeatCount="indefinite"
                calcMode="linear"
                keyTimes={svgList(keys.times)}
                keyPoints={svgList(keys.points)}
              >
                <mpath href={`#${pathId(route)}`} />
              </animateMotion>
              {/* the ring grows PULSE_GROWTH times its dot, fading from full to nothing, as the
                  foundations tile's pulse does */}
              {v.pulses ? (
                <circle className="map-pulse" r={r} strokeWidth={PULSE_STROKE}>
                  <animate
                    attributeName="r"
                    values={`${r};${r * PULSE_GROWTH};${r * PULSE_GROWTH}`}
                    keyTimes={`0;${svgList([pulse / (every * 1000)])};1`}
                    dur={`${every}s`}
                    begin={`${v.offset}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="1;0;0"
                    keyTimes={`0;${svgList([pulse / (every * 1000)])};1`}
                    dur={`${every}s`}
                    begin={`${v.offset}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              ) : null}
              <Dot r={r} state={v.state} />
            </g>
          )
        })}
      </g>

      <g className="still">
        {moving.map(({ v, route, keys, r }, i) => {
          const reports = reportKeys(keys, REPORTS_PER_RUN)
          return (
            <g key={i} style={lineColor(route)}>
              <animateMotion
                dur={`${v.duration}s`}
                begin={`${v.offset}s`}
                repeatCount="indefinite"
                calcMode="discrete"
                keyTimes={svgList(reports.times)}
                keyPoints={svgList(reports.points)}
              >
                <mpath href={`#${pathId(route)}`} />
              </animateMotion>
              <Dot r={r} state={v.state} />
            </g>
          )
        })}
      </g>

      {STILL.map((v, i) => {
        const route = routeOf(v.route)
        const at = pointAt(route.d, v.at)
        return (
          <g key={i} style={lineColor(route)} transform={`translate(${at.x} ${at.y})`}>
            <Dot r={size(route.mode, v.state)} state={v.state} />
          </g>
        )
      })}
    </svg>
  )

  // a framed map follows no route and lays no veil, so it needs no client frame
  if (view === 'framed')
    return (
      <div className="map" data-view="framed" aria-hidden="true">
        <div className="map-canvas">{drawing}</div>
      </div>
    )
  return <MapView view={view}>{drawing}</MapView>
}
