// Sizes, each with the size token its stylesheet sets, and the entry with its start and end icons,
// side by side in two glass panels.
import { Markdown } from '@/components/site/Markdown.tsx'
import { PackageIcon } from '@/components/site/PackageIcon.tsx'
import { getPreview } from '@/previews/index.ts'
import type { ComponentApi } from '../../lib/api.ts'
import type { RegistryEntry } from '../../lib/registry.ts'
import { unionValues, valueLabel, type SizeSpec, type SpecPropRow } from '../../lib/spec.ts'

/** The icons the panel draws: one that names a place on the map, one that leads on. */
const ICON = { startIcon: 'locate', endIcon: 'chevron-right' } as const

export function SizesAndIcons({
  entry,
  api,
  spec,
  sizes,
  icons,
}: {
  entry: RegistryEntry
  api: ComponentApi
  spec: SpecPropRow[]
  sizes: SizeSpec[]
  icons: readonly ('startIcon' | 'endIcon')[]
}) {
  // the start icon on the main action, the end icon on the quieter variant, as the mockup pairs them
  const iconProps = {
    startIcon: unionValues(api, 'color').includes('brand') ? { color: 'brand' } : {},
    endIcon: unionValues(api, 'variant').includes('outline') ? { variant: 'outline' } : {},
  }
  const note = spec.find((r) => r.names.includes(icons[0] ?? ''))?.description
  return (
    <div className="spec-pair">
      {sizes.length ? (
        <section id="sizes" className="spec-section spec-panel glass spec-padded">
          <h2 className="spec-heading">Sizes</h2>
          <div className="spec-row">
            {sizes.map((s) => (
              <div key={s.value} className="spec-sample">
                <div className="spec-cell" inert>
                  {getPreview(entry.name, { size: s.value })}
                </div>
                <span className="spec-sample-name">{valueLabel(s.value)}</span>
                {s.token ? (
                  <span className="spec-sample-token">
                    {s.token}
                    {s.measure ? ` · ${s.measure}` : ''}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}
      {icons.length ? (
        <section id="icons" className="spec-section spec-panel glass spec-padded">
          <h2 className="spec-heading">With icons</h2>
          <div className="spec-row spec-row-tight">
            {icons.map((prop) => (
              <div key={prop} className="spec-cell" inert>
                {getPreview(entry.name, {
                  ...iconProps[prop],
                  [prop]: <PackageIcon name={ICON[prop]} />,
                })}
              </div>
            ))}
          </div>
          {note ? (
            <p className="spec-caption">
              <Markdown source={note} path={entry.specPath} inline />
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
