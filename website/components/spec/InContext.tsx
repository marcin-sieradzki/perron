// The entry in context: a framed map, the layout's own drawing, with a component in a glass sheet
// over it, as a station's panel would hold it, or a pattern on the map by itself. On a phone the
// sheet is an opaque bottom sheet and its actions fill its width.
import { MapBackground } from '@/components/map/MapBackground.tsx'
import { StationIcon } from '@/components/perron'
import { getPreview, type PreviewProps } from '@/previews/index.ts'
import type { ComponentApi } from '../../lib/api.ts'
import type { RegistryEntry } from '../../lib/registry.ts'
import { unionValues } from '../../lib/spec.ts'

/** The quieter action beside the main one: a station's sheet closes back to the map. */
const SECOND_ACTION = 'Back to the map'

/**
 * What the sheet draws: an action with a brand colour as the panel's main action, its words the
 * example its spec's intro quotes, beside the quieter variant with words of its own, so the two
 * never share a name; anything else at its defaults.
 */
function contextProps(api: ComponentApi, intro: string): PreviewProps[] {
  if (!unionValues(api, 'color').includes('brand')) return [{}]
  const labelled = 'children' in api.props
  const example = /"([^"]+)"/.exec(intro)?.[1]
  const main = { color: 'brand', ...(example && labelled ? { children: example } : {}) }
  if (!unionValues(api, 'variant').includes('outline')) return [main]
  return [main, { variant: 'outline', ...(labelled ? { children: SECOND_ACTION } : {}) }]
}

export function InContext({
  entry,
  api,
  intro,
}: {
  entry: RegistryEntry
  api: ComponentApi
  intro: string
}) {
  const map = <MapBackground view="framed" idPrefix="spec-context" />
  if (entry.layer === 'pattern')
    return (
      <section aria-label={`${entry.name} in context`} className="spec-context">
        {map}
        <div className="spec-sheet-free">{getPreview(entry.name)}</div>
      </section>
    )
  return (
    <section aria-label={`${entry.name} in context`} className="spec-context">
      {map}
      <div className="spec-sheet glass floating">
        <span className="spec-sheet-handle" aria-hidden="true" />
        <p className="spec-station">
          <StationIcon size="large" />
          Kongens Nytorv
        </p>
        <p className="spec-sheet-text">Metro M1, M2 and M3.</p>
        <div className="spec-sheet-actions">
          {contextProps(api, intro).map((props, i) => (
            <div key={i} className="spec-sheet-action">
              {getPreview(entry.name, props)}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
