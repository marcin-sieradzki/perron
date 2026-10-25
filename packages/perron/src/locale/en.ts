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
  /** Data state: a GPS report under a minute old. */
  live: 'Live',
  /** Data state: a report 1 to 5 minutes old. */
  ageing: 'Ageing',
  /** Data state: placed from the timetable and the latest delay. */
  estimated: 'Estimated',
  /** Data state: no real-time data at all. */
  timetableOnly: 'Timetable only',
  /** Data state: silent for over 5 minutes. */
  noSignal: 'No signal',
  /** A line's delays: a heading, and the name of the delay kind of disruption. */
  delays: 'Delays',
  /** The name of the diversion kind of disruption: a line running on a changed route. */
  diversions: 'Diversions',
  /** The name of the planned kind of disruption: planned works on a line. */
  plannedWorks: 'Planned works',
  /** The name of the data kind of disruption: a problem with the real-time data feed. */
  dataFeedProblems: 'Data feed problems',
  /** A disruption: said just before the list of lines it affects, heard by screen readers only. */
  affectedLines: 'Affected lines',
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
   * Stat, FactList, Count, Meter, ScaleBar: no data gives the figure, value, count or distance; heard
   * in place of "—", as a meter's value text, or after "Scale" on the map's scale.
   */
  unknown: 'Unknown',
  /** Brand: the brand name, a name and never translated; the wordmark shows it lowercase. */
  brandName: 'Mylder',
  /** A stop timeline: under the stop the vehicle reaches next. */
  nextStop: 'Next stop',
  /** A stop timeline: heard after the name of a stop the vehicle has passed. */
  passed: 'Passed',
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
}

/** The name of one owned string. */
export type OwnedStringKey = keyof typeof en

/** A locale's dictionary: one string for every key of the English one. */
export type OwnedStrings = Record<OwnedStringKey, string>
