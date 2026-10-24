// Installs Perron's packed tarballs in a scratch Vite app, the way an app would get them from npm,
// and fails unless the app builds with perron.css, tokens.ts and PerronProvider and the MCP server
// answers.
// Usage: node scripts/smoke-consumer.ts [folder of .tgz files]
// With no folder it packs both packages first. The release workflow passes the folder that
// `changeset pack` wrote, so the tarballs it checks are the ones it publishes.
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { da } from '../packages/perron/src/locale/da.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const app = mkdtempSync(join(tmpdir(), 'perron-consumer-'))
const run = (cmd: string, args: string[], cwd = app) =>
  execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] })

function fail(message: string): never {
  console.error(`smoke-consumer: ${message}\nThe scratch app is kept at ${app}`)
  process.exit(1)
}

const PACKAGES = ['@mylder/perron', '@mylder/perron-mcp']

/** The tarballs `changeset pack` planned to publish, by package name. */
function planned(dir: string): Map<string, string> {
  const plan: { plan: { kind: string; name: string; tarball?: { path: string } }[][] } = JSON.parse(
    readFileSync(join(dir, 'publish-plan.json'), 'utf8'),
  )
  return new Map(
    plan.plan
      .flat()
      .filter((step) => step.kind === 'publish' && step.tarball)
      .map((step) => [step.name, join(dir, step.tarball!.path)]),
  )
}

try {
  // A release may hold one package only; the other is packed at its current version, as an app
  // would install it beside the new one.
  const packs = process.argv[2] ? planned(resolve(process.argv[2])) : new Map<string, string>()
  const missing = PACKAGES.filter((name) => !packs.has(name))
  if (missing.length) {
    const out = join(app, 'packs')
    mkdirSync(out)
    run(
      'npm',
      ['pack', ...missing.flatMap((name) => ['-w', name]), '--pack-destination', out],
      root,
    )
    for (const f of readdirSync(out))
      packs.set(
        missing.find((name) => new RegExp(`^${name.slice(1).replace('/', '-')}-\\d`).test(f))!,
        join(out, f),
      )
  }

  // The app: one page that loads the stylesheet, reads a token in script and renders a Danish
  // owned string through PerronProvider.
  const version = (name: string) =>
    JSON.parse(readFileSync(join(root, 'node_modules', name, 'package.json'), 'utf8')).version
  writeFileSync(
    join(app, 'package.json'),
    JSON.stringify({ name: 'perron-consumer', private: true, type: 'module' }),
  )
  writeFileSync(
    join(app, 'index.html'),
    '<!doctype html><html><body><div id="app"></div><script type="module" src="/main.ts"></script></body></html>',
  )
  writeFileSync(
    join(app, 'main.ts'),
    `import '@mylder/perron/perron.css'
import { theme } from '@mylder/perron/tokens.ts'
import { PerronProvider, useOwnedStrings } from '@mylder/perron'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'

document.body.style.background = theme.dark['color.surface.warning']

function Next() {
  return createElement('button', null, useOwnedStrings().nextPage)
}
createRoot(document.getElementById('app')!).render(
  createElement(PerronProvider, { locale: 'da' }, createElement(Next)),
)
`,
  )
  run('npm', [
    'install',
    '--no-audit',
    '--no-fund',
    ...packs.values(),
    ...['vite', 'react', 'react-dom'].map((name) => `${name}@${version(name)}`),
  ])
  run(join(app, 'node_modules/.bin/vite'), ['build'])

  // What the build must hold: the tokens, the type roles, the fonts and the value read in script.
  const assets = join(app, 'dist/assets')
  const built = readdirSync(assets)
  const text = (ext: string) =>
    built
      .filter((f) => f.endsWith(ext))
      .map((f) => readFileSync(join(assets, f), 'utf8'))
      .join('\n')
  const tokens: { name: string; values: Record<string, { css: string }> }[] = JSON.parse(
    readFileSync(join(app, 'node_modules/@mylder/perron/data/tokens.json'), 'utf8'),
  )
  const warning = tokens.find((t) => t.name === 'color.surface.warning')!.values.dark.css
  const css = text('.css')
  if (!css.includes('--perron-color-text-primary')) fail('the CSS has no Perron tokens')
  if (!css.includes('.perron-typography-body')) fail('the CSS has no typography classes')
  if (!built.some((f) => f.endsWith('.woff2'))) fail('the build has no fonts')
  if (!text('.js').includes(warning)) fail(`the script lost tokens.ts (no ${warning})`)
  if (!text('.js').includes(da.nextPage))
    fail(`the script lost PerronProvider's dictionaries (no "${da.nextPage}")`)

  // The MCP server, as `npx @mylder/perron-mcp` would start it in the app.
  const client = new Client({ name: 'smoke-consumer', version: '0' })
  await client.connect(
    new StdioClientTransport({
      command: join(app, 'node_modules/.bin/perron-mcp'),
      cwd: app,
      env: process.env as Record<string, string>,
    }),
  )
  const answer = await client.callTool({
    name: 'list_tokens',
    arguments: { query: 'surface warning' },
  })
  await client.close()
  const [first] = (answer.content ?? []) as { text?: string }[]
  if (answer.isError || !first?.text?.includes(warning))
    fail('the MCP server did not answer list_tokens')
  rmSync(app, { recursive: true, force: true })
  console.log(`smoke-consumer: ${[...packs.keys()].join(' and ')} install, build and answer`)
} catch (error) {
  fail(error instanceof Error ? error.message : String(error))
}
