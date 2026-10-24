// The files the docs site serves beside Storybook, for agents: a Markdown twin of every page at its
// path in the repo, `llms.txt` with one line per page, and an `AGENTS.md` for apps that install
// Perron. The twins keep their repo paths, so their links to each other and to the package's icons
// and logos work unchanged on the site.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { headingOf, PAGES } from './pages.ts'
import { PACKAGE } from './paths.ts'

/** Where GitHub Pages serves the site. */
export const SITE = 'https://marcin-sieradzki.github.io/perron/'

/** The page AGENTS.md takes its rules from, and the section that holds them. */
const RULES = { path: 'docs/foundations/README.md', heading: 'Using the tokens' }

/** The page's opening sentence: the first paragraph of prose, with links reduced to their text. */
function summary(path: string, markdown: string) {
  const para = markdown.split(/\n\n+/).find((block) => /^[\p{L}\p{N}"“[]/u.test(block.trim()))
  if (!para) throw new Error(`${path} has no opening paragraph`)
  const text = para.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\s+/g, ' ')
  return /^.+?[.!?](?=\s|$)/.exec(text)?.[0] ?? text
}

function section(path: string, markdown: string, heading: string) {
  const at = markdown.indexOf(`\n## ${heading}\n`)
  if (at < 0) throw new Error(`${path} has no "## ${heading}" section`)
  const body = markdown.slice(at + heading.length + 5)
  const end = body.indexOf('\n## ')
  return (end < 0 ? body : body.slice(0, end)).trim()
}

/** Every file the site adds to the Storybook build, keyed by path inside the site. */
export function buildSite(root: string) {
  const out: Record<string, string> = {}
  const read = (path: string) => readFileSync(join(root, path), 'utf8')
  for (const path of PAGES) out[path] = read(path)
  for (const dir of ['icons', 'logos'])
    for (const file of readdirSync(join(root, PACKAGE, dir)))
      if (file.endsWith('.svg'))
        out[`${PACKAGE}/${dir}/${file}`] = read(`${PACKAGE}/${dir}/${file}`)

  const pages = PAGES.map((path) => ({ path, ...headingOf(path, out[path]) }))
  const groups = [...new Set(pages.map((p) => p.group))]
  const list = (level: string) =>
    groups
      .map((g) => {
        const lines = pages
          .filter((p) => p.group === g)
          .map((p) => `- [${p.title}](${SITE}${p.path}): ${summary(p.path, out[p.path])}`)
        return `${level} ${g}\n\n${lines.join('\n')}`
      })
      .join('\n\n')

  out['llms.txt'] = `# Perron

> Perron is the design system of Mylder, published on npm as \`@mylder/perron\`: design tokens, fonts, icons and the Mylder mark, with one page of rules per foundation. Each link is the Markdown twin of a page in the Storybook at ${SITE}.

${list('##')}

## Optional

- [AGENTS.md](${SITE}AGENTS.md): install Perron in an app, and the rules an agent follows there
`

  out['AGENTS.md'] = `# Perron

This app uses Perron, Mylder's design system, from the npm package \`@mylder/perron\`. Read this before you style a screen or write a word a rider sees.

## Install

\`\`\`sh
npm install @mylder/perron
\`\`\`

## Rules

${section(RULES.path, out[RULES.path], RULES.heading)}

Every word on screen follows [Content design](${SITE}docs/content-design.md).

## Where to look

Read the page for each choice before you make it: a colour, a type role, a space, an icon. Each link is Markdown; the same pages, drawn live, are in the [Storybook](${SITE}).

${list('###')}
`
  return out
}
