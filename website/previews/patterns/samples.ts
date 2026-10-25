// The pattern previews' sample data: Mylder-like trips, stops, disruptions and counts, in the
// content-design voice (docs/content-design.md): Copenhagen's own stops and lines, the 24-hour
// clock, "~" before an estimated time. Delays are minutes, which Delay writes as "+2 min" or
// "−1 min" with the true minus. Plain data, so the server previews and the client ones share it.
import type {
  DataStatePanelProps,
  DayProfileChartProps,
  DetailHeaderProps,
  DisruptionCardLine,
  DisruptionCardProps,
  KioskBarProps,
  StopTimelineProps,
} from '@mylder/perron/patterns'

/** A 5C bus to Husum Torv, as its detail panel heads it. */
export const BUS_HEADER = {
  variant: 'line',
  line: 'bus',
  lineName: '5C',
  title: 'Husum Torv',
  subheader: 'Next stop: Nørreport St. ~08:16',
} satisfies DetailHeaderProps

/** A station several lines serve, as its detail panel heads it: a neutral marker, no line. */
export const STATION_HEADER = {
  variant: 'stop',
  title: 'Nørreport St.',
  subheader: 'Metro, S-tog and buses',
} satisfies DetailHeaderProps

/** The station's next departures, as its panel's body says them. */
export const STATION_DEPARTURES = 'Next departures: 5C in 2 min, M1 in 3 min, S-tog A in 4 min.'

/** An M1 train to Vanløse, westbound through the centre, a minute late, next at Nørreport. */
export const METRO_HEADER = {
  variant: 'line',
  line: 'm1',
  lineName: 'M1',
  title: 'Vanløse',
  subheader: 'Next stop: Nørreport ~08:14',
} satisfies DetailHeaderProps

/** The M1 train's stops, in its line's colour. */
export const METRO_TRIP = {
  line: 'm1',
  nextStopIndex: 2,
  stops: [
    { name: 'Christianshavn', time: '08:09', delay: 0 },
    { name: 'Kongens Nytorv', time: '08:11', delay: 1 },
    { name: 'Nørreport', time: '08:13', delay: 1 },
    { name: 'Forum', time: '08:15', delay: 1 },
    { name: 'Frederiksberg', time: '08:17', delay: 0 },
  ],
} satisfies StopTimelineProps

/** The button that opens the M1 train's panel again, as picking the train on the map would. */
export const METRO_TRIGGER = 'Show metro M1'

/** An S-tog A southbound through the centre: on time, then early, then late from Østerport. */
export const STOG_TRIP = {
  line: 'a',
  nextStopIndex: 2,
  stops: [
    { name: 'Svanemøllen', time: '08:07', delay: 0 },
    { name: 'Nordhavn', time: '08:09', delay: -1 },
    { name: 'Østerport', time: '08:11', delay: 2 },
    { name: 'Nørreport', time: '08:14', delay: 3 },
    { name: 'Vesterport', time: '08:16', delay: 3 },
  ],
} satisfies StopTimelineProps

/** The content-design page's own disruption: a signal fault on the F line. */
export const DISRUPTION = {
  severity: 'delay',
  lines: [{ line: 'f', name: 'F' }] satisfies DisruptionCardLine[],
  title: 'Signal fault at Danshøj',
  children: 'Trains between Flintholm and Ny Ellebjerg run slower than planned.',
} satisfies DisruptionCardProps

/** A vehicle list that could not be loaded. */
export const DATA_ERROR = {
  status: 'error',
  description: 'The map still shows the last reports. Try again in a minute.',
} satisfies DataStatePanelProps

/** The action that loads the list again. */
export const DATA_RETRY = 'Try again'

/** The list once it is in: the next departures. */
export const DEPARTURES = [
  '5C to Husum Torv, 08:14',
  '6A to Buddinge St., 08:17',
  '350S to Ballerup St., 08:21',
]

/** Vehicles in service each hour, 00:00 to 23:00: about 90 at night, about 1 260 at each rush. */
const HOURLY = [
  210, 140, 100, 90, 120, 380, 820, 1240, 1260, 1100, 940, 960, 980, 990, 1020, 1180, 1250, 1260,
  1120, 860, 640, 520, 420, 300,
]

export const DAY_PROFILE = {
  label: 'Vehicles in service',
  points: HOURLY.map((count, hour) => ({ time: `${String(hour).padStart(2, '0')}:00`, count })),
} satisfies DayProfileChartProps

/** A city street at close zoom: the scale reads "300 m" over most of its length. */
export const METERS_PER_PIXEL = 4.2

/** A kiosk's clock and three figures about the network. */
export const KIOSK = {
  time: '08:14',
  stats: [
    { label: 'Vehicles on the map', figure: '1\u00A0204' },
    { label: 'Reporting live', figure: '1\u00A0046' },
    { label: 'Average delay', figure: '2\u00A0min' },
  ],
} satisfies KioskBarProps
