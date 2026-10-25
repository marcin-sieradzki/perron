// Each stable component's preview, by registry name: the component from '@mylder/perron' with
// the content its spec's stories use, and the caller's props spread over those defaults, so
// `getPreview('Button', { variant: 'outline', size: 'small' })` draws exactly that Button. An
// overlay previews as its trigger, closed; a preview with state is a client component in
// ./components/. A component that draws with a designing one has no preview here.
import type { ComponentType, ReactNode } from 'react'
import {
  Accordion,
  AccordionItem,
  Alert,
  Attribution,
  Brand,
  Button,
  Checkbox,
  CheckboxGroup,
  Count,
  Delay,
  Dialog,
  EmptyState,
  FactList,
  Field,
  Fieldset,
  FilterChip,
  HighlightChip,
  IconButton,
  Kbd,
  LineBadge,
  Link,
  LinkButton,
  MapControls,
  Menu,
  MenuItem,
  Meter,
  NormalService,
  NumberField,
  Popover,
  Progress,
  Radio,
  RadioGroup,
  SearchField,
  Section,
  Segment,
  SegmentedControl,
  Select,
  Separator,
  SeverityLabel,
  Sheet,
  Slider,
  Stat,
  StationIcon,
  Surface,
  Switch,
  Tab,
  Tabs,
  TabsList,
  TabsPanel,
  Tag,
  Text,
  TextArea,
  TextField,
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
  Tooltip,
  VehicleDot,
  type StationIconProps,
  type VehicleDotProps,
} from '@mylder/perron'
import { PackageIcon } from '@/components/site/PackageIcon.tsx'
import type { Preview, PreviewProps, Previews } from './index.ts'
import { AlertDialogPreview } from './components/AlertDialogPreview.tsx'
import { MapTooltipPreview } from './components/MapTooltipPreview.tsx'
import { ToastPreview } from './components/ToastPreview.tsx'
import { dictionaries } from '../../packages/perron/src/locale/index.ts'
import './components/previews.css'

/** A preview that draws `Component` with `defaults`, then the caller's props over them. */
function drawn<P extends object>(Component: ComponentType<P>, defaults: Partial<P> = {}): Preview {
  return (props?: PreviewProps) => <Component {...(defaults as P)} {...(props as Partial<P>)} />
}

/** A preview that draws its own layout round the component, given the caller's props. */
const framed = (draw: (props: PreviewProps) => ReactNode): Preview => {
  return (props?: PreviewProps) => draw(props ?? {})
}

const icon = (name: string) => <PackageIcon name={name} />

/** The stop each line's StationIcon stands for, so a marker sits beside a stop on its line. */
const STOP_ON: Record<string, string> = {
  m1: 'Kongens Nytorv',
  m2: 'Kongens Nytorv',
  m3: 'København H',
  m4: 'København H',
  a: 'Østerport',
  b: 'Valby',
  c: 'Valby',
  e: 'Østerport',
  f: 'Flintholm',
  h: 'Østerport',
  bus: 'Nørrebros Runddel',
  regional: 'Høje Taastrup',
}

const en = dictionaries.en

/** Each data state's word, the dot's own name in English, written beside it as its spec asks. */
const STATE_WORD: Record<NonNullable<VehicleDotProps['variant']>, string> = {
  live: en.live,
  ageing: en.ageing,
  estimated: en.estimated,
  'timetable-only': en.timetableOnly,
  'no-signal': en.noSignal,
}

/** The type role of the text each VehicleDot size sits beside, as its spec's Sizes story sets it. */
const DOT_TEXT: Record<NonNullable<VehicleDotProps['size']>, string> = {
  small: 'perron-typography-caption',
  medium: 'perron-typography-label',
  large: 'perron-typography-heading-md',
}

/**
 * Shorter content for a preview drawn many times side by side, such as a spec page's variants by
 * states, so its five state columns fit beside each other as Button.dc.html sets them.
 */
export const compactProps: Record<string, PreviewProps> = {
  Button: { children: 'Show line' },
}

export const componentPreviews: Previews = {
  // Actions
  Button: drawn(Button, { children: 'Show departures' }),
  IconButton: drawn(IconButton, { label: 'Zoom in', children: icon('plus') }),
  LinkButton: drawn(LinkButton, { children: 'Back to the map', href: '/' }),
  Toolbar: drawn(Toolbar, {
    'aria-label': 'Map controls',
    children: (
      <>
        <ToolbarButton aria-label="Zoom in" startIcon={icon('plus')} />
        <ToolbarButton aria-label="Zoom out" startIcon={icon('minus')} />
        <ToolbarSeparator />
        <ToolbarGroup>
          <ToolbarButton>Show whole line</ToolbarButton>
          <ToolbarButton color="brand">Show departures</ToolbarButton>
        </ToolbarGroup>
      </>
    ),
  }),

  // Transit
  LineBadge: drawn(LineBadge, { line: 'm2', children: 'M2' }),
  StationIcon: framed((props) => {
    const line = (props as StationIconProps).line
    return (
      <span className="preview-row perron-typography-label">
        <StationIcon variant="outlined" {...props} />
        <span>{line ? STOP_ON[line] : 'Nørreport'}</span>
      </span>
    )
  }),
  // the dot beside its state's word, so the dot is hidden and the state is heard once
  VehicleDot: framed((props) => {
    const { variant = 'live', size = 'medium' } = props as Partial<VehicleDotProps>
    return (
      <span className={`preview-row ${DOT_TEXT[size]}`}>
        <VehicleDot line="m1" aria-hidden {...props} />
        <span>{STATE_WORD[variant]}</span>
      </span>
    )
  }),
  Delay: drawn(Delay, { minutes: 0 }),
  SeverityLabel: drawn(SeverityLabel, { severity: 'delay' }),
  NormalService: drawn(NormalService),

  // Inputs
  SegmentedControl: drawn(SegmentedControl, {
    'aria-label': 'Mode',
    defaultValue: 'all',
    children: (
      <>
        <Segment value="all">All</Segment>
        <Segment value="bus">Bus</Segment>
        <Segment value="s-tog">S-tog</Segment>
        <Segment value="metro">Metro</Segment>
      </>
    ),
  }),
  FilterChip: drawn(FilterChip, { children: 'Delays', startIcon: icon('warning'), count: 3 }),
  HighlightChip: drawn(HighlightChip, { children: 'Line 5C' }),
  SearchField: drawn(SearchField, {
    label: 'Search lines and stops',
    placeholder: 'Line or stop, such as 5C',
    items: [
      { value: 'stop-norreport', label: 'Nørreport St.', description: 'Metro, S-tog and bus' },
      { value: 'stop-norrebro', label: 'Nørrebro St.', description: 'S-tog and bus' },
      { value: 'stop-norrebros-runddel', label: 'Nørrebros Runddel', description: 'Bus' },
      { value: 'stop-nordhavn', label: 'Nordhavn St.', description: 'S-tog' },
      { value: 'line-5c', label: '5C', description: 'Bus, Husum Torv to Lufthavnen' },
    ],
  }),
  // Field frames a Base UI control that registers with it; Switch is one Perron ships alone
  Field: drawn(Field, {
    label: 'Use my location',
    description: 'The map shows the stops near you',
    children: <Switch />,
  }),
  // a Checkbox centres its box in a stretched row, so the column holds each at its own width
  Fieldset: drawn(Fieldset, {
    className: 'preview-start',
    legend: 'Show on the map',
    children: (
      <>
        <Checkbox name="modes" value="bus" defaultChecked>
          Bus
        </Checkbox>
        <Checkbox name="modes" value="metro">
          Metro
        </Checkbox>
        <Checkbox name="modes" value="s-tog">
          S-tog
        </Checkbox>
      </>
    ),
  }),
  TextField: drawn(TextField, { label: 'Stop name', description: 'As written on the stop sign' }),
  TextArea: drawn(TextArea, {
    label: 'What happened',
    description: 'Say where and when, such as the stop and the time',
    placeholder: 'Such as the 5C waited at Nørreport for 10 minutes',
  }),
  NumberField: drawn(NumberField, {
    label: 'Departures to show',
    description: 'From 1 to 20',
    min: 1,
    max: 20,
    defaultValue: 8,
  }),
  Checkbox: drawn(Checkbox, { children: 'Show planned works on the map' }),
  CheckboxGroup: drawn(CheckboxGroup, {
    label: 'Show on map',
    description: 'The map shows vehicles of the ticked modes only',
    defaultValue: ['bus'],
    children: (
      <>
        <Checkbox value="bus">Bus</Checkbox>
        <Checkbox value="metro">Metro</Checkbox>
        <Checkbox value="s-tog">S-tog</Checkbox>
      </>
    ),
  }),
  RadioGroup: drawn(RadioGroup, {
    label: 'Theme',
    defaultValue: 'system',
    children: (
      <>
        <Radio value="system">Match the system</Radio>
        <Radio value="light">Light</Radio>
        <Radio value="dark">Dark</Radio>
      </>
    ),
  }),
  // a visible label round the switch names it, as its spec asks where there is room
  Switch: framed((props) => (
    <label className="preview-row perron-typography-body-sm">
      <Switch {...props} />
      Show vehicle trails
    </label>
  )),
  Select: drawn(Select, {
    label: 'Transport mode',
    placeholder: 'Choose a transport mode',
    items: [
      { value: 'metro', label: 'Metro' },
      { value: 's-tog', label: 'S-tog' },
      { value: 'bus', label: 'Bus' },
      { value: 'regional', label: 'Regional train' },
      { value: 'harbour-bus', label: 'Harbour bus' },
    ],
  }),
  Slider: drawn(Slider, {
    label: 'Trail length',
    description: 'Minutes of movement drawn behind each vehicle',
    min: 0,
    max: 10,
    defaultValue: 5,
  }),

  // Display
  Text: drawn(Text, {
    children:
      'Signal fault at Danshøj. Trains between Flintholm and Ny Ellebjerg run slower than planned.',
  }),
  Kbd: drawn(Kbd, { children: 'Esc' }),
  Tag: drawn(Tag, { children: 'Night bus' }),
  Count: drawn(Count, { children: 12 }),
  Stat: drawn(Stat, { label: 'Reporting live', children: '412' }),
  FactList: drawn(FactList, {
    items: [
      { label: 'Operator', value: 'Movia' },
      { label: 'Vehicle', value: '8412' },
      { label: 'Speed', value: '32 km/h' },
      { label: 'Last report', value: '08:14' },
    ],
  }),
  Brand: drawn(Brand),
  Meter: drawn(Meter, { label: 'Reporting live', value: 82, color: 'success' }),

  // Overlays: each its trigger, closed
  Dialog: drawn(Dialog, {
    trigger: <Button>Show keys</Button>,
    title: 'Keys',
    description: 'Move around the map without a mouse.',
    children: 'Keys: + and − zoom, arrows pan, Esc closes panels.',
  }),
  Sheet: drawn(Sheet, {
    trigger: <Button>Show stop</Button>,
    title: 'Nørreport St.',
    children: (
      <>
        <p>Lines 5C, 6A and 350S stop here, and the M1, M2 and S-trains.</p>
        <p>
          Signal fault at Danshøj. Trains between Flintholm and Ny Ellebjerg run slower than
          planned.
        </p>
      </>
    ),
  }),
  MapTooltip: (props) => <MapTooltipPreview {...props} />,
  Tooltip: drawn(Tooltip, {
    trigger: <IconButton label="Zoom in">{icon('plus')}</IconButton>,
    children: 'Zoom in',
  }),
  Popover: drawn(Popover, {
    trigger: <Button>About the data</Button>,
    title: 'About the data',
    description: 'Where the positions on the map come from.',
    children: 'Each vehicle reports its position by GPS. A dot shows how old its last report is.',
  }),
  Menu: drawn(Menu, {
    trigger: <Button>Map options</Button>,
    children: (
      <>
        <MenuItem startIcon={icon('locate')}>Centre the map</MenuItem>
        <MenuItem startIcon={icon('plus')}>Zoom in</MenuItem>
        <MenuItem startIcon={icon('minus')}>Zoom out</MenuItem>
      </>
    ),
  }),
  AlertDialog: (props) => <AlertDialogPreview {...props} />,

  // Layout
  Surface: drawn(Surface, { children: 'Next train to Lufthavnen in 3 min' }),
  Section: drawn(Section, {
    title: 'Departures',
    action: (
      <LinkButton href="#departures" variant="outline" size="small">
        All departures
      </LinkButton>
    ),
    children: (
      <ul className="preview-list perron-typography-label">
        <li>5C Husum Torv 08:14</li>
        <li>5C Lufthavnen 08:17</li>
        <li>350S Ballerup St. 08:21</li>
      </ul>
    ),
  }),
  Separator: framed((props) => (
    <span className="preview-stack perron-typography-body">
      <span>Line 5C to Husum Torv</span>
      <Separator {...props} />
      <span>Next departure in 4 min</span>
    </span>
  )),
  Accordion: drawn(Accordion, {
    defaultValue: ['shapes'],
    children: [
      <AccordionItem key="shapes" value="shapes" title="What the dot shapes mean">
        The shape says how sure we are about where a vehicle is. A solid dot is live, a fainter dot
        is ageing, a ring is estimated and a dashed ring is timetable only.
      </AccordionItem>,
      <AccordionItem key="freshness" value="freshness" title="How fresh the data is">
        A live dot has a GPS report under a minute old. A report 1 to 5 minutes old makes it ageing.
      </AccordionItem>,
      <AccordionItem key="silent" value="silent" title="When a vehicle goes silent">
        After 5 minutes without a report, a vehicle turns grey and stays where it was last seen.
      </AccordionItem>,
    ],
  }),

  // Map
  Attribution: drawn(Attribution, {
    children: (
      <>
        Map data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>
      </>
    ),
  }),
  MapControls: drawn(MapControls),

  // Feedback
  EmptyState: drawn(EmptyState, {
    icon: icon('search'),
    title: 'No matches for Nørrebro st',
    children: 'Try a line number such as 5C.',
    action: <Button variant="outline">Clear search</Button>,
  }),
  Alert: drawn(Alert, {
    color: 'danger',
    title: 'Could not load departures',
    children: 'The real-time feed stopped answering at 08:02. Departures show the timetable only.',
    action: (
      <Button size="small" variant="outline">
        Try again
      </Button>
    ),
  }),
  Progress: drawn(Progress, { label: 'Exporting the report', value: 9, max: 20 }),
  // a toast floats in the layout's region, so it previews as an overlay does: its trigger, closed
  Toast: (props) => <ToastPreview {...props} />,

  // Navigation
  Tabs: drawn(Tabs, {
    children: (
      <>
        <TabsList aria-label="Stop">
          <Tab value="departures">Departures</Tab>
          <Tab value="lines">Lines</Tab>
          <Tab value="disruptions" count={2}>
            Disruptions
          </Tab>
        </TabsList>
        <TabsPanel value="departures">The next departures from this stop.</TabsPanel>
        <TabsPanel value="lines">The lines that call at this stop.</TabsPanel>
        <TabsPanel value="disruptions">The disruptions on this stop&apos;s lines.</TabsPanel>
      </>
    ),
  }),
  Link: drawn(Link, { children: 'Show all departures', href: '#departures' }),
}
