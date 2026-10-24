// The English owned strings: the source dictionary. Its keys are every string a component owns,
// and the Danish, Swedish and Norwegian dictionaries are typed against it.

/** Every owned string in English, the default locale. */
export const en = {
  /** A button that closes a dialog, panel or notice. */
  close: 'Close',
  /** A button that clears a field or a filter. */
  clear: 'Clear',
  /** Announced while content loads. */
  loading: 'Loading',
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
  /** The heading over a line's delays. */
  delays: 'Delays',
  /** A line with no delays or disruptions. */
  runningNormally: 'Running normally',
  /** A link that shows a vehicle, stop or line on the map. */
  showOnMap: 'Show on map',
}

/** The name of one owned string. */
export type OwnedStringKey = keyof typeof en

/** A locale's dictionary: one string for every key of the English one. */
export type OwnedStrings = Record<OwnedStringKey, string>
