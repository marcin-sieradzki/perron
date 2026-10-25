import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { API, apiFiles, propsApi } from '../lib/api.ts'
import check, { breakingChanges, compareApi, latestRelease } from './api-compatibility.ts'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '../..')
const button = (tree: string) =>
  propsApi(root, [`scripts/checks/fixtures/api-compatibility/${tree}/Button.tsx`])

describe('compareApi', () => {
  it('lets the API grow: wider unions, new optional props, a prop made optional', () => {
    expect(compareApi(button('release'), button('grows'))).toEqual([])
  })

  it('takes a nested union written in another order for the same type', () => {
    const api = (type: string) => ({
      Sheet: { extends: [], props: { onClose: { optional: true, type: [type] } } },
    })
    expect(
      compareApi(
        api('(event: MouseEvent | Event, details: D) => void'),
        api('(event: Event | MouseEvent, details: D) => void'),
      ),
    ).toEqual([])
  })

  it('names each prop removed, made required, narrowed, or added as required', () => {
    expect(compareApi(button('release'), button('shrinks'))).toEqual([
      { component: 'Button', prop: 'color', message: 'Button makes color required' },
      {
        component: 'Button',
        prop: 'fullWidth',
        message: 'Button no longer has fullWidth; deprecate a prop, never remove it',
      },
      {
        component: 'Button',
        prop: 'size',
        message: 'Button narrows size from "medium" | "small" to "small"',
      },
      {
        component: 'Button',
        prop: 'variant',
        message: 'Button narrows variant from "contained" | "outlined" to "contained" | "text"',
      },
      { component: 'Button', prop: 'name', message: 'Button adds name as a required prop' },
    ])
  })

  it('names a base the props type dropped, and a component that is gone', () => {
    const before = {
      Button: { extends: ['ButtonHTMLAttributes<HTMLButtonElement>'], props: {} },
      Chip: { extends: [], props: {} },
    }
    expect(compareApi(before, { Button: { extends: [], props: {} } })).toEqual([
      {
        component: 'Button',
        prop: 'extends',
        message: 'ButtonProps no longer extends ButtonHTMLAttributes<HTMLButtonElement>',
      },
      {
        component: 'Chip',
        prop: '*',
        message: 'Chip is gone; deprecate a component, never remove it',
      },
    ])
  })
})

describe('latestRelease', () => {
  it('takes the highest version of @mylder/perron, by number', () => {
    const tags = ['@mylder/perron@0.9.0', '@mylder/perron-mcp@1.0.0', '@mylder/perron@0.10.0']
    expect(latestRelease(tags)).toBe('@mylder/perron@0.10.0')
    expect(latestRelease(['@mylder/perron@1.0.0-next.1', 'v2'])).toBeUndefined()
  })
})

describe('breakingChanges', () => {
  it('reads the rows of the table under "Breaking changes", each with its reason', () => {
    const text = [
      '## Change',
      '',
      '### Breaking changes',
      '',
      '| Component | Prop   | Reason                  |',
      '| --------- | ------ | ----------------------- |',
      '| `Button`  | `size` | Large moved to `scale` |',
      '| `Chip`    | `*`    |                         |',
      '',
      '## Styling',
      '',
      '| Component | Prop | Reason |',
      '| --------- | ---- | ------ |',
      '| `Other`   | `x`  | Not this table |',
    ].join('\n')
    expect(breakingChanges(text, 'README.md')).toEqual({
      rows: [{ component: 'Button', prop: 'size' }],
      problems: [
        { file: 'README.md', line: 8, message: 'the breaking change Chip * needs a reason' },
      ],
    })
  })
})

describe('api-compatibility', () => {
  let dir = ''
  afterEach(() => {
    vi.unstubAllEnvs()
    if (dir) rmSync(dir, { recursive: true, force: true })
  })

  const git = (...args: string[]) =>
    execFileSync(
      'git',
      [
        '-c',
        'user.name=Test',
        '-c',
        'user.email=test@example.com',
        '-c',
        'commit.gpgsign=false',
        ...args,
      ],
      { cwd: dir, stdio: 'pipe' },
    )
  const registry = [
    {
      name: 'Button',
      layer: 'component',
      category: 'Actions',
      status: 'stable',
      baseUiParts: ['Button'],
      penpotPath: 'Components/Button',
      dependsOn: [],
    },
  ]
  const contract = (rows: string[]) =>
    [
      '### Breaking changes',
      '',
      '| Component | Prop | Reason |',
      '| --- | --- | --- |',
      ...rows,
      '',
    ].join('\n')
  /** Puts `tree`'s Button in the repo, with its api.json and the contract's table. */
  const write = (tree: string, rows: string[] = []) => {
    const code = join(dir, 'packages/perron/src/components/Button')
    mkdirSync(code, { recursive: true })
    mkdirSync(join(dir, 'docs/components'), { recursive: true })
    cpSync(join(here, 'fixtures/api-compatibility', tree, 'Button.tsx'), join(code, 'Button.tsx'))
    writeFileSync(join(dir, 'packages/perron/components.json'), JSON.stringify(registry))
    writeFileSync(join(dir, API), apiFiles(dir)[API])
    writeFileSync(join(dir, 'docs/components/README.md'), contract(rows))
  }
  const release = (tree: string, version: string) => {
    write(tree)
    git('add', '-A')
    git('commit', '-q', '-m', version)
    git('tag', `@mylder/perron@${version}`)
  }
  const fresh = () => {
    dir = mkdtempSync(join(tmpdir(), 'perron-api-'))
    git('init', '-q')
  }
  const since = (message: string) => ({
    file: 'packages/perron/src/components/Button/Button.tsx',
    message: `${message} since @mylder/perron@0.10.0. A deliberate break is a row in docs/components/README.md, "Breaking changes"`,
  })

  it('holds each stable component against the latest release tag', () => {
    fresh()
    release('release', '0.9.0')
    release('grows', '0.10.0')
    write('release')
    expect(check.run(dir)).toEqual([
      since('Button no longer has endIcon; deprecate a prop, never remove it'),
      since('Button makes label required'),
      since('Button narrows size from "large" | "medium" | "small" to "medium" | "small"'),
      since(
        'Button narrows variant from "contained" | "outlined" | "text" to "contained" | "outlined"',
      ),
    ])
  })

  it('lets a break listed in the table through, and needs its reason', () => {
    fresh()
    release('grows', '0.10.0')
    write('release', [
      '| `Button` | `endIcon` | Merged into `startIcon` |',
      '| `Button` | `label` | The accessible name is required |',
      '| `Button` | `size` | Large is gone from the design |',
      '| `Button` | `variant` |  |',
    ])
    expect(check.run(dir)).toEqual([
      {
        file: 'docs/components/README.md',
        line: 8,
        message: 'the breaking change Button variant needs a reason',
      },
      since(
        'Button narrows variant from "contained" | "outlined" | "text" to "contained" | "outlined"',
      ),
    ])
  })

  it('passes against a release from before api.json', () => {
    fresh()
    writeFileSync(join(dir, 'README.md'), '# Before\n')
    git('add', '-A')
    git('commit', '-q', '-m', 'before')
    git('tag', '@mylder/perron@0.1.0')
    write('shrinks')
    expect(check.run(dir)).toEqual([])
  })

  it('skips with a warning when the clone has no release tag, and fails in CI', () => {
    fresh()
    write('release')
    vi.stubEnv('CI', '')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(check.run(dir)).toEqual([])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('git fetch --tags'))
    vi.stubEnv('CI', 'true')
    expect(check.run(dir)).toEqual([
      {
        file: API,
        message:
          'no @mylder/perron release tag in this clone; CI checks out with fetch-depth: 0 to bring the tags',
      },
    ])
    warn.mockRestore()
  })

  // a CI runner's margin over vitest's 5 s, as shared-parts' and docs' have
  it('passes on the repo', () => {
    expect(check.run(root)).toEqual([])
  }, 15_000)
})
