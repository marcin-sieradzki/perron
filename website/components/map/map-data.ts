// The background map's geometry: one drawing of central Copenhagen, in SVG user units at the map's
// default zoom (1 unit is 1 px when the drawing is not scaled). Land, water, parks and streets, the
// metro and S-tog lines, the stations, and each vehicle with its line, its data state and how it
// runs. Colours and dot sizes are not here: MapBackground takes them from the tokens. This is an
// illustration of the map, not a preview of the vehicle dot component.

export type Mode = 'metro' | 'stog' | 'regional' | 'bus'

/** The five data states of docs/foundations/data-states.md. */
export type DataState = 'live' | 'ageing' | 'estimated' | 'timetable' | 'no-signal'

/** The drawing's size; every coordinate below is inside it. */
export const SIZE = { width: 1440, height: 1240 } as const

/** Water: the Sound on the east, the harbour, and the three lakes, drawn in color.map.water. */
export const WATER = {
  sea: 'M1200 0 C1170 220 1235 400 1195 590 C1165 740 1230 930 1190 1240 L1440 1240 L1440 0 Z',
  harbour: {
    d: 'M770 1240 C830 1080 905 960 965 850 C1015 760 1070 650 1125 560 C1160 500 1185 420 1205 330',
    width: 38,
  },
  lakes: [
    { cx: 560, cy: 500, rx: 70, ry: 20, rotate: -38 },
    { cx: 625, cy: 420, rx: 62, ry: 18, rotate: -38 },
    { cx: 688, cy: 345, rx: 58, ry: 17, rotate: -38 },
  ],
} as const

/** Parks, drawn in color.map.park. */
export const PARKS = [
  { cx: 760, cy: 215, rx: 120, ry: 70 },
  { cx: 880, cy: 470, rx: 36, ry: 26 },
  { cx: 1020, cy: 1000, rx: 150, ry: 120 },
  { cx: 300, cy: 560, rx: 70, ry: 50 },
] as const

/** The width of a street at this zoom, in user units. */
export const STREET_WIDTH = 4

export interface Route {
  id: string
  mode: Mode
  /**
   * The line's colour token after `color.transit.`: `line.m1` for a line, `mode.bus` for a bus.
   */
  color: string
  /** Absolute M, L, C and Z commands only, so motion.ts can measure it */
  d: string
}

/**
 * Every route a vehicle runs on. Metro and S-tog routes are drawn as lines; bus routes run along
 * the streets, which are drawn as streets.
 */
export const ROUTES: Route[] = [
  // metro
  {
    id: 'm1',
    mode: 'metro',
    color: 'line.m1',
    d: 'M40 440 C200 470 330 500 440 520 C540 538 650 530 760 520 C820 515 860 540 900 570 C930 595 955 620 975 650 C955 760 930 900 905 1240',
  },
  {
    id: 'm2',
    mode: 'metro',
    color: 'line.m2',
    d: 'M40 444 C200 474 330 504 440 524 C540 542 650 534 760 524 C818 519 856 544 896 574 C926 599 951 624 971 654 C1030 720 1080 800 1130 900 C1150 950 1170 1010 1180 1080',
  },
  {
    id: 'm3',
    mode: 'metro',
    color: 'line.m3',
    d: 'M900 570 C935 500 950 420 915 365 C880 310 800 285 720 292 C635 300 560 345 505 410 C455 470 450 545 478 610 C512 680 585 715 665 690 C730 670 790 640 835 610 C860 595 885 585 900 570 Z',
  },
  { id: 'm4-north', mode: 'metro', color: 'line.m4', d: 'M1000 60 C975 150 945 260 915 365' },
  {
    id: 'm4-south',
    mode: 'metro',
    color: 'line.m4',
    d: 'M665 690 C630 760 600 830 560 920 C540 970 520 1020 500 1080',
  },
  // S-tog
  {
    id: 'a',
    mode: 'stog',
    color: 'line.a',
    d: 'M1080 0 C1010 140 960 250 918 360 C880 440 820 520 760 600 C700 680 560 760 0 860',
  },
  { id: 'b', mode: 'stog', color: 'line.b', d: 'M760 600 C640 640 400 700 0 760' },
  { id: 'c', mode: 'stog', color: 'line.c', d: 'M760 600 C560 600 300 590 0 600' },
  { id: 'e', mode: 'stog', color: 'line.e', d: 'M760 600 C600 760 420 960 260 1240' },
  {
    id: 'f',
    mode: 'stog',
    color: 'line.f',
    d: 'M640 0 C620 140 600 240 560 330 C500 420 400 470 340 540 C320 650 380 780 470 900 C510 960 540 1080 560 1240',
  },
  // buses, along the streets
  { id: 'bus-west', mode: 'bus', color: 'mode.bus', d: 'M820 560 L0 380' },
  { id: 'bus-southwest', mode: 'bus', color: 'mode.bus', d: 'M820 560 L0 720' },
  { id: 'bus-south', mode: 'bus', color: 'mode.bus', d: 'M820 560 L260 1240' },
  { id: 'bus-north', mode: 'bus', color: 'mode.bus', d: 'M820 560 L560 0' },
  { id: 'bus-northwest', mode: 'bus', color: 'mode.bus', d: 'M820 560 L330 0' },
  { id: 'bus-northeast', mode: 'bus', color: 'mode.bus', d: 'M820 560 L1040 0' },
  { id: 'bus-amager', mode: 'bus', color: 'mode.bus', d: 'M940 640 L1180 1240' },
  { id: 'bus-valby', mode: 'bus', color: 'mode.bus', d: 'M0 980 C400 900 700 860 900 760' },
  { id: 'bus-ring', mode: 'bus', color: 'mode.bus', d: 'M120 0 C260 400 380 800 420 1240' },
]

/** Stations, where the metros wait. */
export const STATIONS = {
  norreport: { x: 760, y: 520 },
  kongensNytorv: { x: 900, y: 570 },
  osterport: { x: 915, y: 365 },
  kobenhavnH: { x: 760, y: 600 },
  christianshavn: { x: 975, y: 650 },
} as const

export type StationId = keyof typeof STATIONS

/** The radius of a station's circle, in user units. */
export const STATION_RADIUS = 5

/**
 * How a vehicle runs: `through` once along its route and round again, waiting at each station of
 * `waitsAt`; `shuttle` to the far end, a pause, and back; `loop` round a closed line.
 */
export type Run =
  { kind: 'through'; waitsAt?: StationId[] } | { kind: 'shuttle' } | { kind: 'loop' }

export interface MovingVehicle {
  route: string
  state: Extract<DataState, 'live' | 'estimated' | 'timetable' | 'no-signal'>
  run: Run
  /** Runs the route from its end to its start */
  reverse?: boolean
  /** Seconds for one run */
  duration: number
  /** Where in its run it starts, in seconds: a negative SVG `begin` */
  offset: number
  /** A live vehicle whose every report pulses once around it */
  pulses?: boolean
}

/** A vehicle that does not move: one whose report is too old to move it on. */
export interface StillVehicle {
  route: string
  state: Extract<DataState, 'ageing'>
  /** Where it was last seen, as a share of its route's length from the start */
  at: number
}

export const MOVING: MovingVehicle[] = [
  // metro: M1 and M2 wait at Nørreport and Kongens Nytorv
  {
    route: 'm1',
    state: 'live',
    run: { kind: 'through', waitsAt: ['norreport', 'kongensNytorv'] },
    duration: 46,
    offset: -8,
    pulses: true,
  },
  {
    route: 'm1',
    state: 'live',
    run: { kind: 'through', waitsAt: ['norreport', 'kongensNytorv'] },
    reverse: true,
    duration: 52,
    offset: -31,
  },
  { route: 'm2', state: 'live', run: { kind: 'shuttle' }, duration: 96, offset: -20, pulses: true },
  { route: 'm2', state: 'live', run: { kind: 'shuttle' }, duration: 96, offset: -66 },
  { route: 'm3', state: 'live', run: { kind: 'loop' }, duration: 64, offset: 0 },
  { route: 'm3', state: 'live', run: { kind: 'loop' }, duration: 64, offset: -21 },
  { route: 'm3', state: 'live', run: { kind: 'loop' }, reverse: true, duration: 64, offset: -43 },
  {
    route: 'm3',
    state: 'estimated',
    run: { kind: 'loop' },
    reverse: true,
    duration: 64,
    offset: -10,
  },
  { route: 'm4-north', state: 'live', run: { kind: 'shuttle' }, duration: 34, offset: -6 },
  { route: 'm4-south', state: 'timetable', run: { kind: 'shuttle' }, duration: 48, offset: -14 },
  // S-tog
  {
    route: 'a',
    state: 'live',
    run: { kind: 'through' },
    duration: 60,
    offset: -12,
    pulses: true,
  },
  { route: 'a', state: 'live', run: { kind: 'through' }, reverse: true, duration: 60, offset: -40 },
  { route: 'b', state: 'live', run: { kind: 'shuttle' }, duration: 50, offset: -25 },
  { route: 'b', state: 'estimated', run: { kind: 'shuttle' }, duration: 50, offset: -2 },
  { route: 'c', state: 'live', run: { kind: 'shuttle' }, duration: 44, offset: -9 },
  { route: 'e', state: 'live', run: { kind: 'shuttle' }, duration: 56, offset: -30 },
  { route: 'f', state: 'live', run: { kind: 'through' }, duration: 70, offset: -22 },
  // buses
  {
    route: 'bus-west',
    state: 'live',
    run: { kind: 'through' },
    reverse: true,
    duration: 84,
    offset: -10,
  },
  { route: 'bus-southwest', state: 'live', run: { kind: 'through' }, duration: 76, offset: -40 },
  // silent, it keeps moving on the timetable from where it was last seen (Data states)
  {
    route: 'bus-southwest',
    state: 'no-signal',
    run: { kind: 'through' },
    duration: 76,
    offset: -12,
  },
  { route: 'bus-north', state: 'live', run: { kind: 'through' }, duration: 52, offset: -5 },
  {
    route: 'bus-northeast',
    state: 'live',
    run: { kind: 'through' },
    reverse: true,
    duration: 58,
    offset: -21,
  },
  { route: 'bus-amager', state: 'live', run: { kind: 'through' }, duration: 66, offset: -33 },
  { route: 'bus-valby', state: 'live', run: { kind: 'through' }, duration: 80, offset: -30 },
  {
    route: 'bus-ring',
    state: 'live',
    run: { kind: 'through' },
    reverse: true,
    duration: 96,
    offset: -45,
  },
  {
    route: 'bus-northwest',
    state: 'timetable',
    run: { kind: 'shuttle' },
    duration: 74,
    offset: -18,
  },
]

export const STILL: StillVehicle[] = [{ route: 'c', state: 'ageing', at: 0.6 }]

/** Reports a vehicle sends per run: under reduced motion it jumps to each in turn. */
export const REPORTS_PER_RUN = 10

/** The share of a run a metro spends at each station it waits at. */
export const WAIT = 0.06

/** The share of a run a shuttle waits at each end. */
export const SHUTTLE_PAUSE = 0.04

/** How far a report's ring grows, as a multiple of the dot's radius. */
export const PULSE_GROWTH = 3

/** The report ring's stroke, in user units. */
export const PULSE_STROKE = 1.4
