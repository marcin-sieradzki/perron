// The icon and logo files, drawn from the SVGs themselves and grouped as their manifests group
// them: each icon at its own size and at three times it, to read the strokes; each logo on the
// ground of the theme it is drawn for.
import type { CSSProperties } from 'react'
import { galleryId } from '@/lib/anchors.ts'
import { cssVar } from '@/lib/tokens.ts'
import type { Segment } from '@/lib/foundations.ts'
import { spaced, words } from './data.ts'

type Icons = Extract<Segment, { kind: 'icons' }>['categories']
type Logos = Extract<Segment, { kind: 'logos' }>['categories']

// the files are this repository's own, checked by the build for grid, stroke and colour
const svg = (markup: string, className = '') => ({
  __html: markup.replace('<svg ', `<svg class="${className}" focusable="false" `),
})

export function IconGallery({ categories }: { categories: Icons }) {
  return categories.map((c) => (
    <section key={c.name} className="fd-gallery-group" aria-labelledby={galleryId('icons', c.name)}>
      <h3 id={galleryId('icons', c.name)} className="fd-gallery-title">
        {c.name}
      </h3>
      <ul className="fd-gallery">
        {c.items.map((icon) => (
          <li key={icon.name} className="fd-gallery-item">
            <span
              className="fd-gallery-icon"
              aria-hidden="true"
              style={{ '--perron-icon-size': cssVar(icon.size) } as CSSProperties}
              dangerouslySetInnerHTML={svg(icon.svg + icon.svg, 'perron-icon')}
            />
            <code>{icon.name}</code>
            <span className="fd-note">
              {icon.size}, {spaced(icon.px)}
            </span>
            <span className="fd-use">{icon.use}</span>
          </li>
        ))}
      </ul>
    </section>
  ))
}

export function LogoGallery({ categories }: { categories: Logos }) {
  return categories.map((c) => (
    <section key={c.name} className="fd-gallery-group" aria-labelledby={galleryId('logos', c.name)}>
      <h3 id={galleryId('logos', c.name)} className="fd-gallery-title">
        {c.name}
      </h3>
      <ul className="fd-gallery fd-gallery-logos">
        {c.items.map((logo) => (
          <li key={logo.name} className="fd-gallery-item">
            <span
              className="fd-gallery-logo"
              data-theme={logo.theme}
              role="img"
              aria-label={logo.label}
              dangerouslySetInnerHTML={svg(logo.svg)}
            />
            <span className="fd-gallery-label">{logo.label}</span>
            <code>logos/{logo.name}.svg</code>
            <span className="fd-note">{words(logo.theme)} theme</span>
            <span className="fd-use">{logo.use}</span>
          </li>
        ))}
      </ul>
    </section>
  ))
}
