// What each card on the components index draws: the preview once with its own defaults, or a few
// times with the props of Components.dc.html's card, such as Delay late, on time and early. Every
// sample goes through getPreview, so a card always draws the shipped component.
import {
  Segment,
  Tab,
  TabsList,
  TabsPanel,
  ToolbarButton,
  ToolbarSeparator,
} from '@/components/perron'
import { PackageIcon } from '@/components/site/PackageIcon.tsx'
import type { PreviewProps } from '@/previews/index.ts'

const SAMPLES: Record<string, PreviewProps[]> = {
  Button: [{ color: 'brand' }, { size: 'small', children: 'Show whole line' }],
  IconButton: [
    {},
    { label: 'Zoom out', children: <PackageIcon name="minus" /> },
    { label: 'Centre the map', children: <PackageIcon name="locate" /> },
  ],
  // the icon buttons alone, as the card shows them: the labelled ones need a wider frame
  Toolbar: [
    {
      children: (
        <>
          <ToolbarButton aria-label="Zoom in" startIcon={<PackageIcon name="plus" />} />
          <ToolbarButton aria-label="Zoom out" startIcon={<PackageIcon name="minus" />} />
          <ToolbarSeparator />
          <ToolbarButton aria-label="Centre the map" startIcon={<PackageIcon name="locate" />} />
        </>
      ),
    },
  ],
  LineBadge: [
    { line: 'm1', children: 'M1' },
    { line: 'm3', children: 'M3' },
    { line: 'c', children: 'C' },
    { line: 'bus', children: '5C' },
  ],
  StationIcon: [{ line: 'm4' }, { variant: 'filled', line: 'a' }, {}],
  Delay: [{ minutes: 4 }, { minutes: 0 }, { minutes: -1 }],
  SeverityLabel: [{ severity: 'delay' }, { severity: 'diversion' }, { severity: 'planned' }],
  // three segments, as the card has room for
  SegmentedControl: [
    {
      children: (
        <>
          <Segment value="all">All</Segment>
          <Segment value="bus">Bus</Segment>
          <Segment value="metro">Metro</Segment>
        </>
      ),
    },
  ],
  FilterChip: [
    { defaultSelected: true },
    { children: 'Planned works', startIcon: undefined, count: undefined },
  ],
  SearchField: [{ hiddenLabel: true }],
  CheckboxGroup: [{ description: undefined }],
  TextArea: [{ description: undefined, rows: 2 }],
  Slider: [{ description: undefined }],
  NumberField: [{ description: undefined }],
  Checkbox: [{ defaultChecked: true }],
  Switch: [{ defaultChecked: true }],
  Text: [
    { variant: 'heading-md', children: 'Nørreport St.' },
    { variant: 'body-sm', emphasis: 'secondary', children: 'Metro, S-tog and bus' },
    { variant: 'data', emphasis: 'tertiary', children: '08:14' },
  ],
  Kbd: [{ children: 'Esc' }, { children: '+' }, { children: '−' }, { children: '↑' }],
  Tag: [{}, { color: 'danger', children: 'Cancelled' }],
  Count: [
    {},
    { color: 'danger', children: 3 },
    { color: 'success', children: 0 },
    { children: undefined },
  ],
  Accordion: [{ defaultValue: [] }],
  Alert: [
    {
      color: 'info',
      title: undefined,
      action: undefined,
      children: 'Departures after 01:00 follow the night timetable.',
    },
  ],
  Tabs: [
    {
      children: (
        <>
          <TabsList aria-label="Stop">
            <Tab value="departures">Departures</Tab>
            <Tab value="lines">Lines</Tab>
          </TabsList>
          <TabsPanel value="departures">The next departures from this stop.</TabsPanel>
          <TabsPanel value="lines">The lines that call at this stop.</TabsPanel>
        </>
      ),
    },
  ],
}

/** The props of each preview a component's card draws, one set per drawing. */
export const cardSamples = (name: string): PreviewProps[] => SAMPLES[name] ?? [{}]

/** Cards whose samples stack: a few marks or lines, one under the other. */
const COLUMN = new Set(['Button', 'Delay', 'SeverityLabel', 'StationIcon', 'Text', 'FilterChip'])

/** Cards whose preview takes the card's width, as it takes its container's in a panel. */
const FILL = new Set([
  'Accordion',
  'Alert',
  'CheckboxGroup',
  'FactList',
  'Field',
  'Fieldset',
  'Meter',
  'NumberField',
  'Progress',
  'RadioGroup',
  'SearchField',
  'Section',
  'Select',
  'Separator',
  'Slider',
  'Stat',
  'Surface',
  'Tabs',
  'TextArea',
  'TextField',
])

/** How a card lays its samples out: in a column, across the card's width, or in a wrapping row. */
export const cardLayout = (name: string) =>
  COLUMN.has(name) ? 'column' : FILL.has(name) ? 'fill' : 'row'
