// Each stable pattern's preview, by registry name: the pattern from '@mylder/perron/patterns'
// with sample data in the content-design voice (patterns/samples.ts), and the page's `props` laid
// over it, so a page can ask for any variant or state. A preview with state or a portal is a
// client component of its own in patterns/. A preview draws no backdrop: the page's frame gives
// the glass ones the map.
import {
  DayProfileChart,
  DetailHeader,
  DisruptionCard,
  KioskBar,
  ScaleBar,
  StopTimeline,
} from '@mylder/perron/patterns'
import { PackageIcon } from '@/components/site/PackageIcon.tsx'
import type { Previews } from './index.ts'
import { DataStatePanelPreview } from './patterns/DataStatePanelPreview.tsx'
import { DetailPanelPreview } from './patterns/DetailPanelPreview.tsx'
import {
  BUS_HEADER,
  DAY_PROFILE,
  DISRUPTION,
  KIOSK,
  METERS_PER_PIXEL,
  STATION_HEADER,
  STOG_TRIP,
} from './patterns/samples.ts'

export const patternPreviews: Previews = {
  DetailHeader: (props) => (
    <DetailHeader {...(props?.variant === 'stop' ? STATION_HEADER : BUS_HEADER)} {...props} />
  ),
  DetailPanel: (props) => <DetailPanelPreview {...props} />,
  StopTimeline: (props) => <StopTimeline {...STOG_TRIP} {...props} />,
  DisruptionCard: (props) => <DisruptionCard {...DISRUPTION} {...props} />,
  DataStatePanel: (props) => (
    <DataStatePanelPreview errorIcon={<PackageIcon name="signal-off" />} {...props} />
  ),
  DayProfileChart: (props) => <DayProfileChart {...DAY_PROFILE} {...props} />,
  ScaleBar: (props) => <ScaleBar metersPerPixel={METERS_PER_PIXEL} {...props} />,
  KioskBar: (props) => <KioskBar {...KIOSK} {...props} />,
}
