// The dry run phase 4 is judged by (ROADMAP.md, "Phase 4: The agent loop"): a made-up component,
// Tally, goes through the factory's command line over a temporary repo, reaches each gate and stops
// there, and every stage whose input is missing or unapproved is refused. The checks the factory
// runs (`npm run check`, `npm run gates -- …`) are scripted, so the test spawns nothing.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { factory } from './factory.ts'
import { parsePipeline, type Env } from './lib/pipeline.ts'

const repo = join(import.meta.dirname, '..')
const template = readFileSync(join(repo, 'docs/components/TEMPLATE.md'), 'utf8')

let root: string
let clock: number
/** Each command the factory ran, and the results still scripted for `npm run check`. */
let ran: string[]
let checks: boolean[]

const env = (): Env => ({
  root,
  run(command) {
    ran.push(command)
    const ok = command === 'npm run check' ? (checks.shift() ?? true) : true
    return { ok, output: ok ? '' : 'lint: Tally.tsx:3 no-unused-vars' }
  },
  now: () => new Date(Date.UTC(2026, 9, 24, 9, 0, clock++)).toISOString(),
})

const write = (rel: string, text: string) => {
  mkdirSync(dirname(join(root, rel)), { recursive: true })
  writeFileSync(join(root, rel), text)
}
const read = (rel: string) => readFileSync(join(root, rel), 'utf8')

/** Runs `npm run factory -- <args>`, split on spaces, with an optional `--failing` text. */
const run = (args: string, failing?: string) =>
  factory([...args.split(' '), ...(failing ? ['--failing', failing] : [])], env())

const variant = (tone: string, fill: string) => ({
  componentId: `id-${tone}`,
  props: { tone },
  exports: { png: 'a'.repeat(64), svg: 'b'.repeat(64) },
  root: {
    name: 'root',
    type: 'board',
    id: `root-${tone}`,
    size: { width: 34, height: 34 },
    fills: ['#ffffff'],
    strokes: [],
    tokens: { fill },
  },
})

/** What the design stage writes: the read-back, the code map and both exports per variant. */
function design(fill = 'color.surface.raised') {
  write(
    'penpot/tally.json',
    JSON.stringify({
      component: 'Tally',
      page: 'Components/Tally',
      fileId: 'f',
      containerId: 'c',
      properties: { tone: ['plain', 'brand'] },
      variants: [variant('plain', fill), variant('brand', 'color.surface.brand')],
    }),
  )
  write(
    'penpot/tally.code-map.json',
    JSON.stringify({
      component: 'Tally',
      properties: { tone: { prop: 'tone', values: { plain: 'plain', brand: 'brand' } } },
      layers: { root: 'root' },
    }),
  )
  for (const v of ['Plain', 'Brand'])
    for (const theme of ['light', 'dark']) write(`penpot/tally/${v}.${theme}.png`, 'png')
}

/** What the brief stage writes: the spec, with every section filled and `extra` at the end. */
function brief(extra = '') {
  const sections = [...template.matchAll(/^## (.+)$/gm)].map((m) => `## ${m[1]}\n\nFilled.\n`)
  write('docs/components/tally.md', `# Tally\n\nA tally counts.\n\n${sections.join('\n')}${extra}`)
}

/** What the build stage writes: the three files and a registry entry with `status`. */
function build(status = 'building') {
  const dir = 'packages/perron/src/components/Tally'
  write(`${dir}/Tally.tsx`, 'export function Tally() {}\n')
  write(`${dir}/Tally.css`, '.pn-Tally {}\n')
  write(`${dir}/Tally.stories.tsx`, 'export const Plain = {}\nexport const Brand = {}\n')
  write(
    'packages/perron/components.json',
    JSON.stringify([
      {
        name: 'Tally',
        layer: 'component',
        category: 'Data',
        status,
        baseUiParts: [],
        penpotPath: 'Components/Tally',
        dependsOn: [],
      },
    ]),
  )
}

/** The reviewer's text, written by the orchestrator, with `p1` P1 findings. */
function review(round: number, p1 = 0) {
  const findings = Array.from(
    { length: p1 },
    (_, i) => `- **P1-${i + 1}.** \`Tally.tsx:${i + 1}\` Breaks the contract.`,
  )
  write(
    'components/tally/review.md',
    `# Review: Tally, round ${round}\n\n## P1\n\n${findings.join('\n') || 'None.'}\n\n## P2\n\nNone.\n\n## P3\n\nNone.\n`,
  )
}

/** The visual stage's report, written now. */
function report(pass: boolean) {
  write(
    'components/tally/visual/report.json',
    JSON.stringify({ component: 'Tally', generatedAt: env().now(), pass }),
  )
}

const pipeline = () => parsePipeline(read('components/tally/pipeline.yaml'))

/** Runs a stage from begin to end, writing its files first. */
function stage(name: string, files: () => void, outcome = 'done', failing?: string) {
  expect(run(`begin Tally ${name}`).code).toBe(0)
  files()
  return run(`end Tally ${name} ${outcome}`, failing)
}

/** Takes Tally through an approved design and a complete spec. */
function throughBrief() {
  stage('design', () => design())
  run('approve Tally')
  stage('brief', () => brief())
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'perron-factory-'))
  clock = 0
  ran = []
  checks = []
  write('docs/components/TEMPLATE.md', template)
  write('packages/perron/components.json', '[]')
})

afterEach(() => rmSync(root, { recursive: true }))

describe('the factory dry run', () => {
  it('stops at design-approval, then at pending-questions, then at needs-human after a failed build run', () => {
    expect(run('next Tally').out).toBe('run: design\nwhy: Tally has no design yet\n')
    expect(run('begin Tally brief')).toMatchObject({
      code: 1,
      err: 'refused: brief cannot begin: design is not done\n',
    })

    // design: its gate runs the penpot check, then waits for the maintainer
    expect(stage('design', () => design()).out).toContain(
      'ended design: done\nwait: design-approval',
    )
    expect(ran).toEqual(['npm run gates -- penpot'])
    expect(run('begin Tally brief').err).toMatch(/brief cannot begin: the design is not approved/)

    // the approval is tied to the read-back: a changed read-back voids it
    expect(run('approve Tally').out).toMatch(/^approved the design at [0-9a-f]{64}\nrun: brief/)
    design('color.surface.inset')
    expect(run('next Tally').out).toMatch(
      /^wait: design-approval\nstage: design\nwhy: penpot\/tally\.json changed since/,
    )
    expect(run('begin Tally brief').err).toMatch(
      /penpot\/tally\.json changed since the design was approved/,
    )
    run('approve Tally')

    // brief: a [PENDING] question left stops it for the maintainer, whatever the stage says
    expect(stage('brief', () => brief('[PENDING] Is the count ever negative?\n')).out).toBe(
      'ended brief: pending\nwait: pending-questions\nstage: brief\nwhy: the spec docs/components/tally.md has 1 [PENDING] question for the maintainer\n',
    )
    expect(run('begin Tally build').err).toBe('refused: build cannot begin: brief is not done\n')
    expect(stage('brief', () => brief()).out).toContain('ended brief: done\nrun: build')

    // build: the stage spends its three attempts inside one run, so a failed run stops the loop
    expect(stage('build', () => build(), 'failed', 'npm run check: 2 lint errors').out).toBe(
      'ended build: failed: npm run check: 2 lint errors\nwait: needs-human\nstage: build\nwhy: build failed: npm run check: 2 lint errors\n',
    )
    expect(run('begin Tally build').err).toMatch(
      /build cannot begin: Tally waits at needs-human \(build\)/,
    )
    run('unblock Tally')

    // a run that says done is checked: a red npm run check is a failed run all the same
    checks = [false]
    expect(stage('build', () => build()).out).toMatch(
      /^ended build: failed: npm run check failed: lint.*\nwait: needs-human\n/,
    )
    expect(ran.filter((c) => c === 'npm run check')).toHaveLength(1)
    expect(pipeline()).toMatchObject({
      needsHuman: { stage: 'build' },
      stages: { build: { status: 'failed', runs: 2 } },
    })

    // the maintainer fixes it and unblocks, and a fresh run begins
    expect(run('unblock Tally').out).toContain('unblocked build\nrun: build')
    expect(stage('build', () => build()).out).toContain('ended build: done\nrun: review')
  })

  it('goes back to build on a P1 and on a failed visual report, and reaches done', () => {
    throughBrief()
    expect(run('begin Tally review').err).toBe('refused: review cannot begin: build is not done\n')
    expect(stage('build', () => build()).out).toContain('run: review')

    // review names its round, in next and in --json
    expect(run('next Tally').out).toBe('run: review\nround: 1\nwhy: build is done\n')
    expect(JSON.parse(run('next Tally --json').out)).toMatchObject({ run: 'review', round: 1 })

    // review round 1 finds a P1: back to build, for a fresh run
    expect(stage('review', () => review(1, 2)).out).toBe(
      'ended review: failed, round 1: 2 P1, 0 P2, 0 P3: review round 1 found 2 P1 (components/tally/review.md)\nrun: build\nwhy: sent back: review round 1 found 2 P1 (components/tally/review.md)\n',
    )
    stage('build', () => build())
    expect(run('next Tally').out).toMatch(/^run: review\nround: 2\n/)

    // a review.md left from round 1 is not round 2's review
    expect(stage('review', () => {}).out).toMatch(
      /ended review: failed: components\/tally\/review\.md is headed "# Review: Tally, round 1", not "# Review: Tally, round 2"/,
    )
    expect(stage('review', () => review(2)).out).toContain(
      'ended review: done, round 2: 0 P1, 0 P2, 0 P3\nrun: docs',
    )

    // docs: the entry must be stable, and the docs check pass; a failed docs run stops the loop
    expect(stage('docs', () => {}).out).toMatch(
      /ended docs: failed: Tally's entry is building, not stable\nwait: needs-human\nstage: docs\nwhy: docs failed: Tally's entry is building, not stable/,
    )
    expect(run('begin Tally docs').err).toMatch(
      /docs cannot begin: Tally waits at needs-human \(docs\)/,
    )
    expect(run('unblock Tally').out).toContain('unblocked docs\nrun: docs')
    expect(stage('docs', () => build('stable')).out).toContain('ended docs: done\nrun: visual')
    expect(ran).toContain('npm run gates -- docs')

    // visual: a failed report sends it back to build once, and the loop runs again from there
    expect(stage('visual', () => report(false)).out).toContain(
      'ended visual: failed: the visual report fails (components/tally/visual/report.md)\nrun: build',
    )
    expect(run('begin Tally visual').err).toBe('refused: visual cannot begin: build is not done\n')
    stage('build', () => build('stable'))
    stage('review', () => review(3))
    stage('docs', () => {})
    expect(stage('visual', () => report(true)).out).toBe(
      "ended visual: done\nwait: done\nwhy: every stage passed; Tally's PR is ready for the maintainer\n",
    )
    expect(pipeline().stages).toMatchObject({
      review: { status: 'done', rounds: 3, p1Rounds: 1 },
      visual: { status: 'done', failures: 1 },
    })
  })

  it('refuses a build once the spec is no longer complete', () => {
    throughBrief()
    brief('[PENDING] Which tone is the default?\n')
    expect(run('begin Tally build').err).toBe(
      'refused: build cannot begin: the spec docs/components/tally.md is not complete: it has 1 [PENDING] question\n',
    )
  })

  it('stops at pending-questions when the design asks the maintainer, and reruns design once answered', () => {
    const out = stage('design', () => {}, 'pending', 'no token holds a 3 px dot radius').out
    expect(out).toBe(
      'ended design: pending: no token holds a 3 px dot radius\nwait: pending-questions\nstage: design\nwhy: no token holds a 3 px dot radius\n',
    )
    expect(run('begin Tally brief').err).toBe('refused: brief cannot begin: design is not done\n')
    expect(stage('design', () => design()).out).toContain('wait: design-approval')
  })

  it('stops at needs-human after two review rounds with a P1', () => {
    throughBrief()
    stage('build', () => build())
    stage('review', () => review(1, 1))
    stage('build', () => build())
    expect(stage('review', () => review(2, 1)).out).toMatch(
      /\nwait: needs-human\nstage: review\nwhy: 2 review rounds found a P1/,
    )
  })

  it('stops at needs-human after a second failed visual report', () => {
    throughBrief()
    const toVisual = () => {
      stage('build', () => build('stable'))
      stage('review', () => review((pipeline().stages.review?.rounds ?? 0) + 1))
      stage('docs', () => {})
    }
    toVisual()
    stage('visual', () => report(false))
    toVisual()
    expect(stage('visual', () => report(false)).out).toMatch(
      /\nwait: needs-human\nstage: visual\nwhy: visual failed 2 times/,
    )
  })

  it('takes no report written before visual began, and no end for a stage not running', () => {
    throughBrief()
    stage('build', () => build('stable'))
    stage('review', () => review(1))
    stage('docs', () => {})
    report(true)
    expect(stage('visual', () => {}).out).toMatch(
      /ended visual: failed: no components\/tally\/visual\/report\.json written since visual began/,
    )
    expect(run('end Tally docs done').err).toBe('refused: docs is not running; begin it first\n')
  })

  it('prints next as JSON for the skill, and never writes on next', () => {
    expect(JSON.parse(run('next Tally --json').out)).toEqual({
      component: 'Tally',
      run: 'design',
      why: 'Tally has no design yet',
    })
    expect(existsSync(join(root, 'components/tally/pipeline.yaml'))).toBe(false)
  })

  it('runs brief to docs without design and visual once the design is deferred', () => {
    expect(run('defer Tally').out).toBe(
      'deferred the design of Tally\nrun: brief\nwhy: the design is deferred\n',
    )
    expect(run('defer Tally').err).toMatch(/already deferred/)
    stage('brief', () => brief())
    // no read-back, so the stories follow the spec and no variant is required
    write('packages/perron/src/components/Tally/Tally.stories.tsx', 'export const Default = {}\n')
    expect(stage('build', () => build()).out).toContain('ended build: done\nrun: review')
    review(1)
    stage('review', () => {})
    expect(stage('docs', () => build('stable')).out).toContain(
      'ended docs: done\nwait: done\nwhy: every stage passed, with the design deferred',
    )
    expect(run('begin Tally visual').err).toMatch(/visual cannot begin: the design is deferred/)
    expect(ran).not.toContain('npm run gates -- penpot')

    // a design run ends the deferral and voids every later stage
    expect(run('begin Tally design').code).toBe(0)
    expect(pipeline().deferred).toBeUndefined()
    expect(pipeline().stages.brief?.status).toBeUndefined()
  })

  it('refuses to defer a design already approved', () => {
    stage('design', () => design())
    run('approve Tally')
    expect(run('defer Tally').err).toMatch(/cannot defer: the design is already approved/)
  })

  it('writes pipeline.yaml with a header and a map per stage', () => {
    stage('design', () => design())
    expect(read('components/tally/pipeline.yaml')).toBe(
      [
        '# Written by npm run factory; never by hand.',
        'component: Tally',
        'layer: component',
        'stages:',
        '  design:',
        '    status: done',
        '    started: 2026-10-24T09:00:00.000Z',
        '    ended: 2026-10-24T09:00:01.000Z',
        '',
      ].join('\n'),
    )
  })
})
