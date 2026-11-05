// Where the docs site is served. GitHub Pages serves it as the repository's project site, under the
// repository's name; a host that serves it at its root, such as Vercel, names its own address in
// PERRON_SITE_URL at build time (vercel.json). next.config.ts passes the address on to the browser
// bundles and prefixes every route and asset with the base path; code that builds a URL by hand,
// such as a fetch, adds it itself.

/**
 * GitHub Pages' project site: the site's address unless its host names another, and the one the
 * data `@mylder/perron` ships links to, so that file is the same whichever host builds the site.
 */
export const PAGES_SITE = 'https://marcin-sieradzki.github.io/perron/'

/** The site's address, ending in a slash: the root that llms.txt, AGENTS.md and Storybook links use. */
export const SITE = process.env.PERRON_SITE_URL || PAGES_SITE
if (!SITE.endsWith('/')) throw new Error(`PERRON_SITE_URL must end in a slash: ${SITE}`)

/** The path the site is served under, without its trailing slash: `/perron`, or `` at a root. */
export const BASE_PATH = new URL(SITE).pathname.replace(/\/$/, '')
