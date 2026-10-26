// The English owned strings: the source dictionary. Its keys are every string a component owns,
// and the Danish, Swedish and Norwegian dictionaries are typed against it.

/** Every owned string in English, the default locale. */
export const en = {
  /** A button that closes a dialog, panel or notice. */
  close: 'Close',
  /** A button that clears a field or a filter. */
  clear: 'Clear',
  /** The title of a data view's message while its data loads, also announced. */
  loading: 'Loading',
  /** The title of a data view's message when its data came back with nothing in it, also announced. */
  noData: 'No data to show',
  /** The title of a data view's message when its data could not be loaded, also announced. */
  loadFailed: 'Could not load the data',
  /** Pagination: the button to the page before. */
  previousPage: 'Previous page',
  /** Pagination: the button to the page after. */
  nextPage: 'Next page',
  /** Data state: a GPS report younger than the app's live threshold. */
  live: 'Live',
  /** Data state: a report past the live threshold, under the ageing one. */
  ageing: 'Ageing',
  /** Data state: placed from the timetable and the latest delay. */
  estimated: 'Estimated',
  /** Data state: no real-time data at all. */
  timetableOnly: 'Timetable only',
  /** Data state: silent past the ageing threshold, moved on by the timetable. */
  noSignal: 'No signal',
  /**
   * Data state key: what a live vehicle means, as in "Reported by the vehicle in the last 2.5 min".
   * `{liveThreshold}` is the app's live threshold, written by `secondsDuration` or `minutesDuration`.
   */
  liveDescription: 'Reported by the vehicle in the last {liveThreshold}',
  /**
   * Data state key: what an ageing vehicle means, as in "Last reported 2.5 min to 5 min ago".
   * `{liveThreshold}` and `{ageingThreshold}` are the app's two thresholds.
   */
  ageingDescription: 'Last reported {liveThreshold} to {ageingThreshold} ago',
  /** Data state key: what an estimated vehicle means. */
  estimatedDescription: 'Placed from the timetable and the latest delay',
  /** Data state key: what a timetable-only vehicle means. */
  timetableOnlyDescription: 'No real-time data, placed from the timetable alone',
  /**
   * Data state key: what a vehicle with no signal means, as in "Moved on by the timetable, with no
   * report for over 5 min". `{ageingThreshold}` is the app's ageing threshold.
   */
  noSignalDescription: 'Moved on by the timetable, with no report for over {ageingThreshold}',
  /**
   * Data state key: a threshold under 2 min, inside the live, ageing and no-signal sentences, as in
   * "60 s", joined by a no-break space. `{seconds}` is its whole seconds.
   */
  secondsDuration: '{seconds}\u00A0s',
  /**
   * Data state key: a threshold of 2 min or more, inside the live, ageing and no-signal sentences,
   * as in "2.5 min", joined by a no-break space. `{minutes}` is its minutes, to one decimal place.
   */
  minutesDuration: '{minutes}\u00A0min',
  /** A line's delays: a heading, and the name of the delay kind of disruption. */
  delays: 'Delays',
  /** The name of the diversion kind of disruption: a line running on a changed route. */
  diversions: 'Diversions',
  /** The name of the planned kind of disruption: planned works on a line. */
  plannedWorks: 'Planned works',
  /** The name of the data kind of disruption: a problem with the real-time data feed. */
  dataFeedProblems: 'Data feed problems',
  /**
   * The name of the neutral kind of disruption: a service notice whose message does not say which of
   * the other kinds it is.
   */
  serviceNotice: 'Service notice',
  /** A disruption: said just before the list of lines it affects, heard by screen readers only. */
  affectedLines: 'Affected lines',
  /**
   * A disruption: the stops it affects, as in "Affects Nørreport and Kongens Nytorv". `{stops}` is
   * the stop names, joined by `stopListEnd` or `moreStops`.
   */
  affectsStops: 'Affects {stops}',
  /**
   * A list of stops: joins the last stop to those before it, as in "Nørreport, Kongens Nytorv and
   * Christianshavn". `{stops}` is the names before the last, comma-separated; `{stop}` the last.
   */
  stopListEnd: '{stops} and {stop}',
  /**
   * A list of stops cut short: the names shown, then how many more, as in "Nørreport, Kongens
   * Nytorv and 3 more". `{count}` is always 2 or more.
   */
  moreStops: '{stops} and {count} more',
  /** A disruption on a stretch of line: its two ends, as in "Between Hellerup and Klampenborg". */
  betweenStops: 'Between {from} and {to}',
  /** A disruption's time: when it starts, with no end given, as in "From 08:03". */
  fromTime: 'From {time}',
  /** A disruption's time: when it ends, with no start given, as in "Until 22:00". */
  untilTime: 'Until {time}',
  /** A disruption's time: its start and its end, as in "24 to 25 October" or "06:00 to 22:00". */
  timeRange: '{from} to {to}',
  /** A line with no delays or disruptions. */
  runningNormally: 'Running normally',
  /** A link that shows a vehicle, stop or line on the map. */
  showOnMap: 'Show on map',
  /** Delay: the unit after a signed figure, as in "+3 min". */
  minutesUnit: 'min',
  /** Delay: heard after the number when a vehicle runs late, as in "3 min late". */
  minutesLate: 'min late',
  /** Delay: heard after the number when a vehicle runs early, as in "1 min early". */
  minutesEarly: 'min early',
  /** Delay: a vehicle or departure running to the timetable. */
  onTime: 'On time',
  /** Delay: no real-time data says how late a vehicle runs; heard in place of "—". */
  delayUnknown: 'Delay unknown',
  /**
   * Stat, FactList, Count, Meter, ScaleBar, VehicleTable, ReportStrip, DataStateKey: no data gives
   * the figure, value, count, distance, last-seen time or threshold; heard in place of "—", as a
   * meter's value text, after "Scale" on the map's scale, or in place of a data state key's whole
   * sentence when a threshold it holds is unknown.
   */
  unknown: 'Unknown',
  /** Brand: the brand name, a name and never translated; the wordmark shows it lowercase. */
  brandName: 'Mylder',
  /**
   * A departure's countdown: shown and announced in place of the minutes when it leaves in under 45
   * seconds.
   */
  now: 'Now',
  /**
   * A departure, or a trip's stop, that won't be served: shown and announced in place of its data
   * state, its times struck through.
   */
  cancelled: 'Cancelled',
  /**
   * A line that runs to an interval: the minutes between departures, as in "Every 3 min". `{minutes}`
   * is the whole minutes.
   */
  every: 'Every {minutes} min',
  /**
   * A line that runs to an interval that varies: the fewest and the most minutes between
   * departures, as in "Every 3 to 4 min". `{from}` and `{to}` are the whole minutes, `{from}` the
   * smaller.
   */
  everyRange: 'Every {from} to {to} min',
  /** A stop timeline: under the stop the vehicle reaches next. */
  nextStop: 'Next stop',
  /** A stop timeline: heard after the name of a stop the vehicle has passed. */
  passed: 'Passed',
  /**
   * A stop timeline: a stop's expected time, heard in place of the "~" and the time the eye reads,
   * as in "08:13, Expected 08:16". `{time}` is the expected time.
   */
  expectedTime: 'Expected {time}',
  /**
   * A departure row: its timetabled time, struck through before the expected time, heard in place
   * of the struck time the eye reads, as in "Timetabled 08:14 08:16". `{time}` is the timetabled
   * time.
   */
  timetabledTime: 'Timetabled {time}',
  /** A vehicle table: the header of the column of each vehicle's line. */
  lineColumn: 'Line',
  /** A vehicle table: the header of the column of where each vehicle is going. */
  destinationColumn: 'Destination',
  /** A vehicle table: the header of the column of how fresh each vehicle's position is, its data state. */
  positionColumn: 'Position',
  /** A vehicle table: the header of the column of how late each vehicle runs. */
  delayColumn: 'Delay',
  /** A vehicle table: the header of the column of the time each vehicle last reported its position. */
  lastSeenColumn: 'Last seen',
  /** The map's bar of zoom and centre buttons: the toolbar's name. */
  mapControls: 'Map controls',
  /** The map's button that zooms in by one step. */
  zoomIn: 'Zoom in',
  /** The map's button that zooms out by one step. */
  zoomOut: 'Zoom out',
  /** The map's button that moves and zooms the map to show the whole network. */
  centerMap: 'Centre the map',
  /** The map's scale: heard before the distance its bar spans, as in "Scale 300 m". */
  scale: 'Scale',
  /** The map's scale: the unit after a distance under a kilometre, as in "300 m". */
  metersUnit: 'm',
  /** The map's scale: the unit after a distance of a kilometre or more, as in "2 km". */
  kilometersUnit: 'km',
  /** A search field's list: shown and announced when no suggestion matches the words typed. */
  noMatches: 'No matches',
  /** A field's label: after the words of a field the person may leave empty, as in "Stop name (optional)". */
  optional: '(optional)',
  /** A number field's button that steps the number up by one step; heard as its name, never seen. */
  increase: 'Increase',
  /** A number field's button that steps the number down by one step; heard as its name, never seen. */
  decrease: 'Decrease',
  /** A number field's input: heard in place of its role, after its name, never seen. */
  numberField: 'Number field',
  /** A range slider: the name of its lower thumb, heard as "Minimum, slider, 4". */
  minimum: 'Minimum',
  /** A range slider: the name of its upper thumb, heard as "Maximum, slider, 12". */
  maximum: 'Maximum',
  /**
   * Progress: heard after the task's name, in place of the figure, while how far the task has got
   * is not known.
   */
  inProgress: 'In progress',
  /** The region at the bottom of the screen that holds the toasts. */
  notifications: 'Notifications',
  /** A source line: the time of a source's data, as in "Rejseplanen · updated 08:14:05". */
  sourceUpdated: 'updated {time}',
  /** A source line: first in the line while the panel takes no updates. */
  sourcePaused: 'Paused',
  /**
   * A source line: the time of a source's data when the app judges it may be out of date, as in
   * "Vehicle positions · updated 08:09:40, may be out of date".
   */
  sourceOutOfDate: 'updated {time}, may be out of date',
  /**
   * A source line: the app's own words of what a source's time is of, when the app judges it may
   * be out of date, as in "Rejseplanen · departures 08:14:20, may be out of date". `{label}` is the
   * caller's label, its time filled in.
   */
  sourceLabelOutOfDate: '{label}, may be out of date',
  /**
   * A status line: the time of the data a screen shows, first in its line, as in "Updated
   * 08:14:05". `{time}` is the caller's time, or "—" while it is unknown.
   */
  topBarUpdated: 'Updated {time}',
  /**
   * A status line: the time of the data a screen shows when the app judges it may be out of date,
   * as in "Updated 08:09:40, may be out of date".
   */
  topBarUpdatedOutOfDate: 'Updated {time}, may be out of date',
  /** A group of filters, such as a top bar's chips: its name, heard as the group is entered. */
  topBarFilters: 'Filters',
}

/** The name of one owned string. */
export type OwnedStringKey = keyof typeof en

/** A locale's dictionary: one string for every key of the English one. */
export type OwnedStrings = Record<OwnedStringKey, string>
