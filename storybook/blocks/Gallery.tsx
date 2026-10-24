// The icon and logo files, drawn from the SVGs themselves, grouped as their manifests group them.
import type { CSSProperties } from 'react'
import type { Icon, Logo } from '../../scripts/lib/assets.ts'
import { cssVarName } from '../../scripts/lib/tokens.ts'

const title = (s: string) => s[0].toUpperCase() + s.slice(1)
// the files are this repository's own, checked by the build for style and colour
const svg = (markup: string) => ({ __html: markup })

export function IconGallery({
  categories,
}: {
  categories: { name: string; items: (Icon & { px: string })[] }[]
}) {
  return categories.map((c) => (
    <section key={c.name}>
      <h3>{c.name}</h3>
      <ul className="pd-gallery">
        {c.items.map((i) => (
          <li key={i.name}>
            <span
              className="pd-icon"
              style={{ '--perron-icon-size': `var(${cssVarName(i.size)})` } as CSSProperties}
              dangerouslySetInnerHTML={svg(i.svg + i.svg)}
            />
            <code>{i.name}</code>
            <small>
              {i.size}, {i.px.replace('px', ' px')}
            </small>
            <span>{i.use}</span>
          </li>
        ))}
      </ul>
    </section>
  ))
}

export function LogoGallery({ categories }: { categories: { name: string; items: Logo[] }[] }) {
  return categories.map((c) => (
    <section key={c.name}>
      <h3>{c.name}</h3>
      <ul className="pd-gallery pd-logos">
        {c.items.map((l) => (
          <li key={l.name}>
            <span className="pd-logo" data-theme={l.theme} dangerouslySetInnerHTML={svg(l.svg)} />
            <strong>{l.label}</strong>
            <code>logos/{l.name}.svg</code>
            <small>{title(l.theme)} theme</small>
            <span>{l.use}</span>
          </li>
        ))}
      </ul>
    </section>
  ))
}
