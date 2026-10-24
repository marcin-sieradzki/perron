// The visual stage: opens each variant's story in Chromium, in light and dark, measures every part
// against the read-back (size within 1 px, each bound token on its value in that theme), diffs the
// root's screenshot against Penpot's export, and writes `components/<name>/visual/report.md`,
// `report.json` and a diff PNG per variant and theme. The comparison is in scripts/lib/visual.ts.
// Usage: node scripts/visual.ts <Name> [--url <storybook>] (npm run visual -- <Name>)
// Without --url it uses the Storybook at http://localhost:6006 when one answers, or builds one.
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { dirname, extname, join, normalize, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, type Page } from 'playwright'
import * as prettier from 'prettier'
import { base, theme as themed } from '../packages/perron/tokens/generated/tokens.ts'
import type { CodeMap, ReadBack } from './checks/penpot.ts'
import {
  codeMapPath,
  exportPath,
  layerOf,
  readBackPath,
  storyTitle,
  THEMES,
  variantName,
  visualPath,
  type Theme,
} from './lib/design.ts'
import {
  compare,
  expectations,
  drivenStates,
  pixelDiff,
  renderReport,
  type Interaction,
  type Measured,
  type Report,
  type Run,
} from './lib/visual.ts'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Where the stories come from: a running Storybook's URL, or a config dir to build one from. */
export type Storybook = string | { build: string }

export interface VisualOptions {
  /** The tree that holds `penpot/` */
  root: string
  name: string
  storybook: Storybook
  /** The folder the report goes in; `components/<name>/visual` under `root` by default */
  out?: string
}

/** A token's CSS value in a theme, from the built tokens. */
const tokenValue = (theme: Theme) => (token: string) =>
  (themed[theme] as Record<string, string>)[token] ?? (base as Record<string, string>)[token]

const TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
}

/** Serves `dir` on a free local port until `close` is called. */
async function serve(dir: string) {
  const server = createServer((req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname))
    const file = join(dir, path === '/' ? 'index.html' : path)
    if (!file.startsWith(dir) || !existsSync(file)) {
      res.writeHead(404).end()
      return
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
    res.end(readFileSync(file))
  })
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done))
  const { port } = server.address() as { port: number }
  return { url: `http://127.0.0.1:${port}`, close: () => server.close() }
}

/** Runs `use` with a Storybook URL: the one given, or one built from a config dir and served. */
async function withStorybook<T>(storybook: Storybook, use: (url: string) => Promise<T>) {
  if (typeof storybook === 'string') return use(storybook.replace(/\/$/, ''))
  const dir = mkdtempSync(join(tmpdir(), 'perron-visual-'))
  const built = spawnSync(
    join(repoRoot, 'node_modules/.bin/storybook'),
    ['build', '-c', storybook.build, '-o', dir, '--quiet'],
    { cwd: repoRoot, encoding: 'utf8' },
  )
  if (built.status !== 0) throw new Error(`storybook build failed:\n${built.stdout}${built.stderr}`)
  const server = await serve(dir)
  try {
    return await use(server.url)
  } finally {
    server.close()
    rmSync(dir, { recursive: true })
  }
}

/** The story ids under `title`, by export name, from Storybook's index. */
async function storyIds(url: string, title: string) {
  const index = (await (await fetch(`${url}/index.json`)).json()) as {
    entries: Record<string, { type: string; id: string; title: string; exportName?: string }>
  }
  return new Map(
    Object.values(index.entries)
      .filter((e) => e.type === 'story' && e.title === title && e.exportName)
      .map((e) => [e.exportName!, e.id]),
  )
}

/**
 * Drives the interactions on the root of a story at rest: a hover, keyboard focus (Tab until the
 * root or something in it has focus), or a press held down. Returns what lets a press go.
 */
async function drive(page: Page, selector: string, interactions: Interaction[]) {
  const root = page.locator(selector).first()
  let release = async () => {}
  for (const interaction of interactions) {
    if (interaction === 'hover') await root.hover()
    if (interaction === 'focus') {
      let focused = false
      for (let i = 0; i < 50 && !focused; i++) {
        await page.keyboard.press('Tab')
        focused = await root.evaluate((el) => el.contains(document.activeElement))
      }
      if (!focused) throw new Error(`Tab never reached ${selector}`)
    }
    if (interaction === 'press') {
      const box = await root.boundingBox()
      if (!box) throw new Error(`${selector} has no box to press`)
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      release = () => page.mouse.up()
    }
  }
  return release
}

/** Each selector's box and computed styles, looked for inside the root first. */
function measure(page: Page, rootSelector: string, wanted: Record<string, string[]>) {
  return page.evaluate(
    (arg) => {
      const root = document.querySelector(arg.rootSelector)
      const out: Record<string, unknown> = {}
      for (const [selector, properties] of Object.entries(arg.wanted)) {
        const el =
          selector === arg.rootSelector
            ? root
            : (root?.querySelector(selector) ?? document.querySelector(selector))
        if (!el) continue
        const box = el.getBoundingClientRect()
        const style = getComputedStyle(el)
        out[selector] = {
          width: box.width,
          height: box.height,
          styles: Object.fromEntries(properties.map((p) => [p, style.getPropertyValue(p)])),
        }
      }
      return out
    },
    { rootSelector, wanted },
  ) as Promise<Measured>
}

const sha = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex')

/** Measures every variant of `name` in both themes and writes the report; returns it. */
export async function runVisual(o: VisualOptions): Promise<Report> {
  for (const rel of [readBackPath(o.name), codeMapPath(o.name)])
    if (!existsSync(join(o.root, rel)))
      throw new Error(`there is no ${rel}; the design stage writes it`)
  const design = JSON.parse(readFileSync(join(o.root, readBackPath(o.name)), 'utf8')) as ReadBack
  const map = JSON.parse(readFileSync(join(o.root, codeMapPath(o.name)), 'utf8')) as CodeMap
  const out = o.out ?? join(o.root, visualPath(o.name))
  const title = storyTitle(o.name, layerOf({ root: o.root }, o.name))
  const rootSelector = `.pn-${o.name}`
  mkdirSync(out, { recursive: true })
  const stale: string[] = []
  const report = await withStorybook(o.storybook, async (url) => {
    const ids = await storyIds(url, title)
    const browser = await chromium.launch()
    const runs: Run[] = []
    try {
      for (const v of design.variants) {
        const variant = variantName(design.properties, v.props)
        const light = join(o.root, exportPath(o.name, variant, 'light'))
        if (existsSync(light) && sha(light) !== v.exports.png) stale.push(variant)
        for (const theme of THEMES) {
          const id = ids.get(variant)
          const run: Run = { variant, theme, story: id ?? '', pass: false, rows: [] }
          runs.push(run)
          if (!id) {
            run.error = `${title} has no story exported as ${variant}`
            continue
          }
          const list = expectations(o.name, v.root, map, tokenValue(theme))
          const wanted: Record<string, string[]> = {}
          for (const e of list) (wanted[e.selector] ??= []).push(...e.properties)
          const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
          try {
            // embed mode renders the story without its play, which may close what it opened
            await page.goto(`${url}/iframe.html?id=${id}&viewMode=story&embed=true`)
            await page.waitForSelector(rootSelector, { timeout: 15_000 })
            await page.evaluate(
              (t) => document.documentElement.setAttribute('data-theme', t),
              theme,
            )
            await page.evaluate(() => document.fonts.ready)
            const release = await drive(page, rootSelector, drivenStates(map, v.props))
            run.rows = compare(list, await measure(page, rootSelector, wanted))
            run.pass = run.rows.every((r) => r.pass)
            const expected = join(o.root, exportPath(o.name, variant, theme))
            if (existsSync(expected)) {
              const shot = await page
                .locator(rootSelector)
                .first()
                .screenshot({ omitBackground: true })
              const { percent, diff } = pixelDiff(readFileSync(expected), shot)
              const file = `${variant}.${theme}.diff.png`
              writeFileSync(join(out, file), diff)
              run.pixelDiff = percent
              run.diffImage = file
            }
            await release()
          } catch (e) {
            run.error = (e as Error).message.split('\n')[0]
          } finally {
            await page.close()
          }
        }
      }
    } finally {
      await browser.close()
    }
    return { url, runs }
  })
  const result: Report = {
    component: o.name,
    generatedAt: new Date().toISOString(),
    storybook: typeof o.storybook === 'string' ? report.url : `a build of ${o.storybook.build}`,
    pass: report.runs.every((r) => r.pass),
    stale,
    runs: report.runs,
  }
  const write = async (file: string, text: string) => {
    const options = await prettier.resolveConfig(join(repoRoot, 'package.json'))
    writeFileSync(file, await prettier.format(text, { ...options, filepath: file }))
  }
  await write(join(out, 'report.json'), JSON.stringify(result, null, 2))
  await write(join(out, 'report.md'), renderReport(result))
  return result
}

/** The Storybook to use: `--url`, else a dev server on 6006 when one answers, else a build. */
async function pickStorybook(args: string[]): Promise<Storybook> {
  const at = args.indexOf('--url')
  if (at >= 0) return args[at + 1]
  try {
    const res = await fetch('http://localhost:6006/index.json', {
      signal: AbortSignal.timeout(1000),
    })
    if (res.ok) return 'http://localhost:6006'
  } catch {
    // no dev server
  }
  return { build: '.storybook' }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  const name = args.find((a) => /^[A-Z][A-Za-z0-9]*$/.test(a))
  if (!name) {
    console.error('usage: npm run visual -- <Name> [--url <storybook>]')
    process.exit(1)
  }
  const report = await runVisual({
    root: repoRoot,
    name,
    storybook: await pickStorybook(args),
  }).catch((e: Error) => {
    console.error(e.message)
    process.exit(1)
  })
  const failed = report.runs.filter((r) => !r.pass)
  const where = relative(process.cwd(), join(repoRoot, visualPath(name), 'report.md'))
  console.log(
    report.pass
      ? `${name} passes in all ${report.runs.length} stories; see ${where}`
      : `${name} fails in ${failed.map((r) => `${r.variant} (${r.theme})`).join(', ')}; see ${where}`,
  )
  if (report.stale.length) console.log(`stale light exports: ${report.stale.join(', ')}`)
  process.exit(report.pass ? 0 : 1)
}
