// Perron's icon and logo files with their manifests, icons/icons.json and logos/logos.json, which
// group the files into categories and say what each one is for. `root` is the package's folder.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

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
  const files = readdirSync(join(root, dir))
    .filter((f) => f.endsWith('.svg'))
    .map((f) => f.slice(0, -'.svg'.length))
  const manifest = JSON.parse(readFileSync(join(root, dir, `${dir}.json`), 'utf8')) as Record<
    string,
    Record<string, Omit<T, 'name' | 'category' | 'svg'>>
  >
  const entries = Object.entries(manifest).flatMap(([category, list]) =>
    Object.entries(list).map(([name, meta]) => {
      if (!files.includes(name))
        throw new Error(`${dir}/${dir}.json lists ${name}, which has no file`)
      const svg = readFileSync(join(root, dir, `${name}.svg`), 'utf8')
      return { ...meta, name, category, svg } as T
    }),
  )
  const unlisted = files.filter((f) => !entries.some((e) => e.name === f))
  if (unlisted.length) throw new Error(`${dir}/${dir}.json does not list ${unlisted.join(', ')}`)
  return entries
}

export const readIcons = (root: string) => read<Icon>(root, 'icons')
export const readLogos = (root: string) => read<Logo>(root, 'logos')

/** The square grid an icon is drawn on, from its viewBox. */
export function iconGrid(svg: string) {
  const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg)
  return m && m[1] === m[2] ? Number(m[1]) : undefined
}
