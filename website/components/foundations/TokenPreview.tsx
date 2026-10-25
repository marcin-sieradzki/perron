// A live preview of one token, beside its value: it reads the token's custom property in place, so
// inside a `data-theme` cell it shows that theme's value, as perron.css ships it. The same cases
// Storybook's TokenTable draws, in the site's own markup.
import type { CSSProperties } from 'react'
import { PackageIcon } from '@/components/site/PackageIcon.tsx'
import { cssVar, readToken } from '@/lib/tokens.ts'
import { cssValue, leafOf, valueOf, type TokenRow } from './data.ts'
import { MotionDemo } from './MotionDemo.tsx'

type Style = CSSProperties & Record<`--${string}`, string>

/** Measures longer than this many px draw at 1:8, so a breakpoint fits its cell. */
const LONG = 160

/** The sample a family or weight is set in. */
const SAMPLE = 'Aa Øresund 08:14'

/** A cubic-bezier curve drawn on a unit square, from the token's own four numbers. */
function EasingCurve({ css }: { css: string }) {
  const n = (css.match(/-?[\d.]+/g) ?? []).map(Number)
  if (n.length !== 4) return null
  const [x1, y1, x2, y2] = n
  return (
    <svg className="fd-curve" viewBox="-0.05 -0.05 1.1 1.1" aria-hidden="true">
      <path className="fd-curve-axis" d="M0 1 H1 M0 1 V0" />
      <path className="fd-curve-line" d={`M0 1 C${x1} ${1 - y1} ${x2} ${1 - y2} 1 0`} />
    </svg>
  )
}

export function TokenPreview({ row }: { row: TokenRow }) {
  const value = cssValue(row)
  const { name } = row
  switch (row.type) {
    case 'color':
      return <span className="fd-chip-swatch" style={{ '--fd-fill': value } as Style} />
    case 'shadow':
      return <span className="fd-shadow" style={{ boxShadow: value }} />
    case 'typography':
      return <span className={row.typography!.className}>Linje 5C mod Husum Torv, 08:14</span>
    case 'fontFamily':
      return (
        <span className="perron-typography-heading-md" style={{ fontFamily: value }}>
          {SAMPLE}
        </span>
      )
    case 'fontWeight':
      return (
        <span className="perron-typography-heading-md" style={{ fontWeight: value }}>
          Aa
        </span>
      )
    case 'duration': {
      if (!name.startsWith('duration.')) return null
      // the sheet has its own curve; everything else eases with easing.standard
      const own = `easing.${leafOf(name)}`
      const easing = cssVar(readToken(own) ? own : 'easing.standard')
      return <MotionDemo name={name} duration={value} easing={easing} />
    }
    case 'cubicBezier':
      return <EasingCurve css={valueOf(row)} />
    case 'strokeStyle':
      return (
        <svg className="fd-dash" aria-hidden="true">
          <line x1="0" y1="50%" x2="100%" y2="50%" style={{ strokeDasharray: value }} />
        </svg>
      )
    case 'number':
      if (name.startsWith('opacity.') || name.endsWith('opacity'))
        return <span className="fd-chip-swatch fd-solid" style={{ opacity: value }} />
      if (name.startsWith('font.line-height.'))
        return (
          <span className="fd-leading" style={{ lineHeight: value }}>
            Two lines of
            <br />
            body text
          </span>
        )
      if (name.startsWith('z-index.'))
        return <span className="fd-bar fd-stack" style={{ '--fd-layer': value } as Style} />
      if (name === 'effect.glass-saturate') return <span className="fd-glass-chip" />
      return null
    case 'dimension':
      if (name.startsWith('radius.'))
        return <span className="fd-square" style={{ borderRadius: value }} />
      if (name === 'focus.offset')
        return <span className="fd-square fd-ring" style={{ outlineOffset: value }} />
      if (/^(border\.width|focus\.width|map\.line-width\.)|stroke-width$/.test(name))
        return <span className="fd-stroke" style={{ borderBlockStartWidth: value }} />
      if (name.startsWith('font.size.'))
        return (
          <span className="perron-typography-body" style={{ fontSize: value }}>
            Aa
          </span>
        )
      if (name.startsWith('icon.size.'))
        return (
          <span className="fd-icon-size" style={{ '--perron-icon-size': value } as Style}>
            <PackageIcon name="search" />
          </span>
        )
      if (name.startsWith('map.track-spacing.'))
        return <span className="fd-tracks" style={{ rowGap: value }} />
      if (name === 'effect.glass-blur') return <span className="fd-glass-chip" />
      if (Number.parseFloat(valueOf(row)) > LONG)
        return (
          <span className="fd-scaled">
            <span className="fd-bar" style={{ inlineSize: `calc(${value} / 8)` }} />
            <span className="fd-note">1:8</span>
          </span>
        )
      return <span className="fd-bar" style={{ inlineSize: value }} />
    default:
      return null
  }
}
