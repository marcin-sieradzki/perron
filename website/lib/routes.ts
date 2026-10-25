// Which repo file each site route shows, and the other way round: a doc's relative link, such as
// `../foundations/motion.md#durations`, becomes the route that shows that file, or a link to the
// repository on GitHub when the site has no page for it.
import { readFileSync } from 'node:fs'
import { posix } from 'node:path'
import { CONTENT_DESIGN, CONTENTS, FOUNDATION_PATHS, foundationSlug } from './foundations.ts'
import { readEntries } from './registry.ts'
import { githubUrl, repoFileExists, repoPath } from './repo.ts'

/** Files outside docs/ that a route shows. */
const PAGES_OF: Record<string, string> = {
  'packages/perron/README.md': '/get-started',
  'packages/mcp/README.md': '/agents',
  'packages/perron/CHANGELOG.md': '/releases',
  'packages/mcp/CHANGELOG.md': '/releases',
}

/**
 * The route that shows a repo file, by its path from the repo root, or undefined when the site has
 * no page for it: the Contents page is `/foundations`, each foundation page and Content design is
 * `/foundations/<slug>`, each spec page `/components/<slug>` or `/patterns/<slug>`.
 */
export function siteRoute(path: string): string | undefined {
  if (path === CONTENTS) return '/foundations'
  if (path === CONTENT_DESIGN || FOUNDATION_PATHS.includes(path))
    return `/foundations/${foundationSlug(path)}`
  const entry = readEntries().find((e) => e.hasSpec && e.specPath === path)
  return entry?.route ?? PAGES_OF[path]
}

const EXTERNAL = /^([a-z][a-z0-9+.-]*:|\/\/)/i

/** A link's path with its escapes decoded, `%20` as a space, or as it is when one is malformed. */
export function decodePath(target: string) {
  try {
    return decodeURI(target)
  } catch {
    return target
  }
}

/**
 * A link's target, relative to the doc at `from` or from the repo root when it starts with `/`,
 * as a path from the repo root, and its `#anchor` (with the `#`).
 */
export function resolve(href: string, from: string) {
  const at = href.indexOf('#')
  const target = decodePath(at < 0 ? href : href.slice(0, at))
  const hash = at < 0 ? '' : href.slice(at)
  const path = target.startsWith('/')
    ? posix.normalize(target.slice(1))
    : posix.normalize(posix.join(posix.dirname(from), target))
  return { path: target.endsWith('/') ? `${path}/` : path, hash }
}

/**
 * Where a link in the doc at `from` should go on the site: a URL or a bare `#anchor` as it is, a
 * repo file to the route that shows it, and any other repo file or folder to GitHub.
 */
export function siteHref(href: string, from: string): string {
  if (!href || href.startsWith('#') || EXTERNAL.test(href)) return href
  const { path, hash } = resolve(href, from)
  const route = siteRoute(path)
  return route ? `${route}${hash}` : `${githubUrl(path)}${hash}`
}

const MEDIA: Record<string, string> = { '.svg': 'image/svg+xml', '.png': 'image/png' }

/**
 * An image's `src` in the doc at `from`: a repo SVG or PNG inlined as a data URL, so the page needs
 * no request to another site; anything else as it is.
 */
export function assetSrc(src: string, from: string): string {
  if (!src || EXTERNAL.test(src)) return src
  const { path } = resolve(src, from)
  const type = MEDIA[posix.extname(path)]
  if (!type || !repoFileExists(path)) return src
  return `data:${type};base64,${readFileSync(repoPath(path)).toString('base64')}`
}
