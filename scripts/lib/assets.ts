// Perron's icon and logo files with their manifests, icons/icons.json and logos/logos.json, which
// group the files into categories and say what each one is for. Both live in the package's folder.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PACKAGE } from './paths.ts'

export interface Asset {
  /** File name without `.svg` */
  name: string
  category: string
  use: string
  svg: string
}
export interface Icon extends Asset {
  /** The `icon.size` token the icon renders at */
  size: string
}
export interface Logo extends Asset {
  label: string
  /** The theme whose ground the file is drawn for */
  theme: string
}

function read<T extends Asset>(root: string, dir: string): T[] {
  const at = join(root, PACKAGE, dir)
  const manifestName = `${PACKAGE}/${dir}/${dir}.json`
  const files = readdirSync(at)
    .filter((f) => f.endsWith('.svg'))
    .map((f) => f.slice(0, -'.svg'.length))
  const manifest = JSON.parse(readFileSync(join(at, `${dir}.json`), 'utf8')) as Record<
    string,
    Record<string, Omit<T, 'name' | 'category' | 'svg'>>
  >
  const entries = Object.entries(manifest).flatMap(([category, list]) =>
    Object.entries(list).map(([name, meta]) => {
      if (!files.includes(name)) throw new Error(`${manifestName} lists ${name}, which has no file`)
      const svg = readFileSync(join(at, `${name}.svg`), 'utf8')
      return { ...meta, name, category, svg } as T
    }),
  )
  const unlisted = files.filter((f) => !entries.some((e) => e.name === f))
  if (unlisted.length) throw new Error(`${manifestName} does not list ${unlisted.join(', ')}`)
  return entries
}

/** The icons, from the repo at `root`. */
export const readIcons = (root: string) => read<Icon>(root, 'icons')
/** The logos, from the repo at `root`. */
export const readLogos = (root: string) => read<Logo>(root, 'logos')

/** The square grid an icon is drawn on, from its viewBox. */
export function iconGrid(svg: string) {
  const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg)
  return m && m[1] === m[2] ? Number(m[1]) : undefined
}
