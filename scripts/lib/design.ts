// The names that follow from a design read back from Penpot (penpot/README.md, "Read-back"): each
// variant's name, which is also its story's export name, its PNG exports, and the Storybook title
// its stories sit under. The factory and the visual stage both pair files by these names.
import { kebab, type Layer } from './entry.ts'

/** The two themes every design is exported and compared in. */
export const THEMES = ['light', 'dark'] as const
export type Theme = (typeof THEMES)[number]

/** `extra-large` → `ExtraLarge`. */
const pascal = (value: string) =>
  value
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('')

/**
 * A variant's name: its property values in the read-back's property order, each in PascalCase,
 * joined, such as `SolidHover`. A component without variants has one variant, `Default`.
 */
export function variantName(properties: Record<string, string[]>, props: Record<string, string>) {
  return Object.keys(properties).length
    ? Object.keys(properties)
        .map((p) => pascal(props[p] ?? ''))
        .join('')
    : 'Default'
}

/** The read-back of `<Name>`, by path from the repo root. */
export const readBackPath = (name: string) => `penpot/${kebab(name)}.json`

/** The code map of `<Name>`, by path from the repo root. */
export const codeMapPath = (name: string) => `penpot/${kebab(name)}.code-map.json`

/** A variant's PNG export in one theme, by path from the repo root. */
export const exportPath = (name: string, variant: string, theme: Theme) =>
  `penpot/${kebab(name)}/${variant}.${theme}.png`

/** The Storybook title of an entry's stories: `Components/<Name>` or `Patterns/<Name>`. */
export const storyTitle = (name: string, layer: Layer) =>
  `${layer === 'component' ? 'Components' : 'Patterns'}/${name}`
