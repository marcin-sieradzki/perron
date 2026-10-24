// The factory's state for one component or pattern, `components/<name>/pipeline.yaml`, and the
// rules that move it through the loop of ROADMAP.md, "Phase 4": design, brief, build, review, docs,
// visual. Every gate is checked from the files and by running the checks, never taken on a stage's
// word, and the caps of ADR 0008 stop the loop at `needs-human`: a failed build run (the build
// stage spends its 3 attempts inside one run), a failed docs run, 2 review rounds with a P1, a
// second visual failure. scripts/factory.ts is the command line over it and the only writer.
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse, stringify } from 'yaml'
import {
  codeMapPath,
  exportPath,
  layerOf,
  readBackPath,
  registryEntry,
  THEMES,
  variantName,
  visualPath,
} from './design.ts'
import { folderOf, kebab, type Layer } from './entry.ts'
import { PACKAGE } from './paths.ts'

/** The stages, in the order a component goes through them. */
export const STAGES = ['design', 'brief', 'build', 'review', 'docs', 'visual'] as const
export type Stage = (typeof STAGES)[number]

/** What a stage returns when it ends. */
export const OUTCOMES = ['done', 'failed', 'pending'] as const
export type Outcome = (typeof OUTCOMES)[number]

/** Where the loop stops for the maintainer. */
export type Gate = 'design-approval' | 'pending-questions' | 'needs-human' | 'done'

/**
 * The budgets of ADR 0008 the factory counts: review rounds with a P1, visual failures. The build
 * stage spends its 3 attempts inside one run, so the factory stops at the first failed build run.
 */
export const CAPS = { review: 2, visual: 2 } as const

/** The spec template every spec keeps the sections of. */
export const TEMPLATE = 'docs/components/TEMPLATE.md'

/** One stage's record. Counters outlive a re-run; the rest describes the latest run. */
export interface StageState {
  status?: 'running' | Outcome
  started?: string
  ended?: string
  /** Why the latest run failed, what it asks, or why the stage was sent back */
  failing?: string
  /** brief: the `[PENDING]` questions left in the spec */
  pending?: number
  /** build: runs begun, each a fresh set of the build stage's attempts */
  runs?: number
  /** review: rounds reviewed, and how many of them found a P1 */
  rounds?: number
  p1Rounds?: number
  /** review: the latest round's findings by level */
  findings?: { p1: number; p2: number; p3: number }
  /** visual: failed reports */
  failures?: number
}

/** `components/<name>/pipeline.yaml`. Phase 5.5's scorecard joins it later. */
export interface Pipeline {
  component: string
  layer: Layer
  /** The maintainer's design approval, with the SHA-256 of the read-back it approved */
  approval?: { readBack: string; at: string }
  /** A cap was hit or a stage cannot go on: the maintainer acts, then runs `unblock` */
  needsHuman?: { stage: Stage; reason: string }
  stages: Partial<Record<Stage, StageState>>
}

/** What the rules need from outside: the repo, a way to run a check, and the time. */
export interface Env {
  /** The repo root every path is read from */
  root: string
  /** Runs an npm command such as `npm run check`, from the root */
  run(command: string): { ok: boolean; output: string }
  /** The time now, ISO 8601 */
  now(): string
}

/** What comes next: a stage to run, with its round for review, or the gate the loop waits at. */
export type Next =
  { run: Stage; round?: number; why: string } | { wait: Gate; stage?: Stage; why: string }

/** A command's result: the new pipeline when it was accepted, or why it was refused. */
export type Result = { ok: true; pipeline: Pipeline; said: string } | { ok: false; why: string }

/** The files the loop reads and writes for `<Name>`, by path from the repo root. */
export function filesOf(name: string, layer: Layer) {
  const dir = `${PACKAGE}/src/${folderOf(layer)}/${name}`
  const state = `components/${kebab(name)}`
  return {
    readBack: readBackPath(name),
    codeMap: codeMapPath(name),
    spec: `docs/${folderOf(layer)}/${kebab(name)}.md`,
    code: [`${dir}/${name}.tsx`, `${dir}/${name}.css`, `${dir}/${name}.stories.tsx`],
    stories: `${dir}/${name}.stories.tsx`,
    pipeline: `${state}/pipeline.yaml`,
    review: `${state}/review.md`,
    report: `${visualPath(name)}/report.json`,
    reportMd: `${visualPath(name)}/report.md`,
  }
}

// ---- reading the files -------------------------------------------------------------------------

const read = (env: Pick<Env, 'root'>, rel: string) => readFileSync(join(env.root, rel), 'utf8')
const exists = (env: Pick<Env, 'root'>, rel: string) => existsSync(join(env.root, rel))

/** SHA-256 of a file, hex; empty when it is missing. */
export function sha256(env: Pick<Env, 'root'>, rel: string) {
  return exists(env, rel)
    ? createHash('sha256')
        .update(readFileSync(join(env.root, rel)))
        .digest('hex')
    : ''
}

interface Design {
  properties: Record<string, string[]>
  variants: { props: Record<string, string> }[]
}

function readBack(env: Pick<Env, 'root'>, name: string): Design | undefined {
  try {
    return JSON.parse(read(env, readBackPath(name))) as Design
  } catch {
    return undefined
  }
}

/** The variant names of `<Name>`'s read-back, which are its exports' and stories' names. */
function variantsOf(env: Env, name: string) {
  const design = readBack(env, name)
  return design ? design.variants.map((v) => variantName(design.properties, v.props)) : []
}

const PENDING_MENTION = /`\[PENDING\][^`]*`/g

/**
 * What keeps a spec from being complete: a template section missing or out of order, a template
 * placeholder left, the template's title kept, and the `[PENDING]` questions left (a code span
 * that starts with `[PENDING]` mentions the marker and is not a question).
 */
export function specProblems(spec: string, template: string, name: string) {
  const problems: string[] = []
  const headings = (md: string) => [...md.matchAll(/^## (.+?)\s*$/gm)].map((m) => m[1])
  const wanted = headings(template)
  const have = headings(spec)
  for (const h of wanted) if (!have.includes(h)) problems.push(`has no "## ${h}" section`)
  const order = have.filter((h) => wanted.includes(h))
  const expected = wanted.filter((h) => order.includes(h))
  const swapped = order.findIndex((h, i) => h !== expected[i])
  if (swapped >= 0)
    problems.push(
      `has its sections out of the template order (${order[swapped]} before ${expected[swapped]})`,
    )
  const title = /^# (.+)$/m.exec(spec)?.[1]
  if (title !== name) problems.push(`starts with "# ${title ?? ''}", not "# ${name}"`)
  const text = spec.replace(PENDING_MENTION, '')
  const placeholders = new Set(
    [...template.replace(PENDING_MENTION, '').matchAll(/<[^<>\n]+>/g)].map((m) => m[0]),
  )
  for (const p of placeholders)
    if (text.includes(p)) problems.push(`still has the placeholder ${p}`)
  const pending = text.match(/\[PENDING\]/g)?.length ?? 0
  return { pending, problems }
}

const LEVELS = ['P1', 'P2', 'P3'] as const

/**
 * The findings of a `review.md` by level, counted by their `- **P<level>-<k>.**` prefix, and what
 * keeps it from being round `round` of `<Name>`'s review in the format of
 * `.claude/agents/component-reviewer.md`.
 */
export function reviewFindings(text: string, name: string, round: number) {
  const problems: string[] = []
  const heading = /^# .+$/m.exec(text)?.[0] ?? ''
  const want = `# Review: ${name}, round ${round}`
  if (heading !== want) problems.push(`is headed "${heading}", not "${want}"`)
  const counts = { p1: 0, p2: 0, p3: 0 }
  for (const level of LEVELS) {
    const at = text.search(new RegExp(`^## ${level}\\s*$`, 'm'))
    if (at < 0) {
      problems.push(`has no "## ${level}" section`)
      continue
    }
    const rest = text.slice(at).split('\n').slice(1).join('\n')
    const body = rest.slice(0, rest.search(/^#{1,2} /m) >= 0 ? rest.search(/^#{1,2} /m) : undefined)
    const n = body.match(new RegExp(`^- \\*\\*${level}-\\d+\\.\\*\\*`, 'gm'))?.length ?? 0
    if (!n && body.trim() !== 'None.')
      problems.push(`has a "## ${level}" section that lists no finding and does not say None.`)
    counts[level.toLowerCase() as 'p1' | 'p2' | 'p3'] = n
  }
  return { ...counts, problems }
}

// ---- the YAML file -----------------------------------------------------------------------------

/** `pipeline.yaml`'s text: keys in a fixed order, as prettier formats YAML. */
export function serializePipeline(p: Pipeline) {
  const stages = Object.fromEntries(
    STAGES.filter((s) => p.stages[s] && Object.keys(p.stages[s]!).length).map((s) => [
      s,
      p.stages[s],
    ]),
  )
  const ordered = {
    component: p.component,
    layer: p.layer,
    ...(p.approval && { approval: p.approval }),
    ...(p.needsHuman && { needsHuman: p.needsHuman }),
    stages,
  }
  return `# Written by npm run factory; never by hand.\n${stringify(ordered, { lineWidth: 0, singleQuote: true })}`
}

/** A pipeline from `pipeline.yaml`'s text. */
export function parsePipeline(text: string): Pipeline {
  const p = parse(text) as Pipeline
  return { ...p, stages: p.stages ?? {} }
}

/** The pipeline of `<Name>`, or a fresh one; its layer always follows the registry. */
export function loadPipeline(env: Env, name: string): Pipeline {
  const layer = layerOf(env, name)
  const rel = filesOf(name, layer).pipeline
  const p = exists(env, rel) ? parsePipeline(read(env, rel)) : { component: name, stages: {} }
  return { ...p, component: name, layer }
}

// ---- the rules ---------------------------------------------------------------------------------

const clone = (p: Pipeline): Pipeline => structuredClone(p)
const stageOf = (p: Pipeline, s: Stage) => (p.stages[s] ??= {})
const npm = (name: string, command: string) => `npm run factory -- ${command} ${name}`
/** The review round a run of review is: one past the rounds already reviewed. */
const roundOf = (s: StageState = {}) => (s.rounds ?? 0) + 1

/** Whether the approval stands: none, or given for a read-back that has since changed. */
function approvalProblem(p: Pipeline, env: Env) {
  const files = filesOf(p.component, p.layer)
  if (!p.approval)
    return `the design is not approved; the maintainer approves it in Penpot, then ${npm(p.component, 'approve')}`
  if (p.approval.readBack !== sha256(env, files.readBack))
    return `${files.readBack} changed since the design was approved; the maintainer approves it again with ${npm(p.component, 'approve')}`
  return undefined
}

/** Why `stage` cannot begin now, or nothing. */
function refusal(p: Pipeline, stage: Stage, env: Env): string | undefined {
  if (p.needsHuman)
    return `${p.component} waits at needs-human (${p.needsHuman.stage}): ${p.needsHuman.reason}. Once it is fixed, the maintainer runs ${npm(p.component, 'unblock')}`
  if (stage === 'design') return undefined
  const before = STAGES.slice(0, STAGES.indexOf(stage)).find((s) => p.stages[s]?.status !== 'done')
  if (before) return `${before} is not done`
  const approval = approvalProblem(p, env)
  if (approval) return approval
  const files = filesOf(p.component, p.layer)
  if (stage === 'build') {
    if (!exists(env, files.spec)) return `there is no spec at ${files.spec}`
    const { pending, problems } = specProblems(
      read(env, files.spec),
      read(env, TEMPLATE),
      p.component,
    )
    if (pending) problems.push(`has ${pending} [PENDING] question${pending > 1 ? 's' : ''}`)
    if (problems.length) return `the spec ${files.spec} is not complete: it ${problems.join('; ')}`
  }
  if (stage === 'visual') {
    const missing = missingExports(p, env)
    if (missing.length) return `the exports ${missing.join(', ')} are missing`
  }
  return undefined
}

function missingExports(p: Pipeline, env: Env) {
  return variantsOf(env, p.component)
    .flatMap((v) => THEMES.map((t) => exportPath(p.component, v, t)))
    .filter((rel) => !exists(env, rel))
}

/** What comes next for `p`: the stage to run, or the gate it waits at. Never writes. */
export function next(p: Pipeline, env: Env): Next {
  if (p.needsHuman)
    return { wait: 'needs-human', stage: p.needsHuman.stage, why: p.needsHuman.reason }
  for (const stage of STAGES) {
    if (stage !== 'design') {
      const approval = approvalProblem(p, env)
      if (approval) return { wait: 'design-approval', stage: 'design', why: approval }
    }
    const s = p.stages[stage] ?? {}
    if (s.status === 'done') continue
    const round = stage === 'review' ? { round: roundOf(s) } : {}
    if (s.status === 'running')
      return {
        run: stage,
        ...round,
        why: `${stage} began at ${s.started} and has not ended; run it again`,
      }
    if (s.status === 'pending')
      return {
        wait: 'pending-questions',
        stage,
        why:
          stage === 'brief'
            ? `the spec ${filesOf(p.component, p.layer).spec} has ${s.pending} [PENDING] question${s.pending === 1 ? '' : 's'} for the maintainer`
            : (s.failing ?? `${stage} has questions for the maintainer`),
      }
    const why = s.failing
      ? `${s.status === 'failed' ? 'the last run failed' : 'sent back'}: ${s.failing}`
      : stage === 'design'
        ? `${p.component} has no design yet`
        : `${STAGES[STAGES.indexOf(stage) - 1]} is done`
    return { run: stage, ...round, why }
  }
  return {
    wait: 'done',
    why: `every stage passed; ${p.component}'s PR is ready for the maintainer`,
  }
}

/** Keeps only a stage's counters, for a stage whose latest run no longer counts. */
function counters(s: StageState = {}): StageState {
  const { runs, rounds, p1Rounds, findings, failures } = s
  return Object.fromEntries(
    Object.entries({ runs, rounds, p1Rounds, findings, failures }).filter(
      ([, v]) => v !== undefined,
    ),
  )
}

/** Records `stage` as running, or refuses it. Re-running a stage voids every later one. */
export function begin(p: Pipeline, stage: Stage, env: Env): Result {
  const why = refusal(p, stage, env)
  if (why) return { ok: false, why: `${stage} cannot begin: ${why}` }
  const out = clone(p)
  if (stage === 'design') delete out.approval
  for (const later of STAGES.slice(STAGES.indexOf(stage) + 1))
    if (out.stages[later]) out.stages[later] = counters(out.stages[later])
  const s = (out.stages[stage] = { ...counters(out.stages[stage]), status: 'running' as const })
  s.started = env.now()
  if (stage === 'build') s.runs = (s.runs ?? 0) + 1
  const extra =
    stage === 'build' ? ` (run ${s.runs})` : stage === 'review' ? ` (round ${roundOf(s)})` : ''
  return { ok: true, pipeline: out, said: `began ${stage}${extra}` }
}

/** Records the maintainer's design approval, tied to the read-back's SHA-256 now. */
export function approve(p: Pipeline, env: Env): Result {
  if (p.stages.design?.status !== 'done')
    return { ok: false, why: `cannot approve: design has not passed its gate` }
  const out = clone(p)
  out.approval = { readBack: sha256(env, filesOf(p.component, p.layer).readBack), at: env.now() }
  return { ok: true, pipeline: out, said: `approved the design at ${out.approval.readBack}` }
}

/** Clears a needs-human stop once the maintainer has acted, resetting the cap it hit. */
export function unblock(p: Pipeline): Result {
  if (!p.needsHuman) return { ok: false, why: `${p.component} is not at needs-human` }
  const out = clone(p)
  const stage = out.needsHuman!.stage
  const s = stageOf(out, stage)
  if (stage === 'review') s.p1Rounds = 0
  if (stage === 'visual') s.failures = 0
  delete out.needsHuman
  return { ok: true, pipeline: out, said: `unblocked ${stage}` }
}

/** Sends the component back to build for a fresh run, and voids every run after it. */
function sendBack(p: Pipeline, from: Stage, reason: string) {
  p.stages.build = { ...counters(p.stages.build), failing: reason }
  for (const later of STAGES.slice(STAGES.indexOf('build') + 1, STAGES.indexOf(from)))
    p.stages[later] = counters(p.stages[later])
}

/** The last lines of a command's output, for a one-line reason. */
const tail = (output: string) =>
  output.trim().split('\n').slice(-5).join(' / ').slice(0, 400) || 'no output'

/** The outcome of a stage's gate, checked from the files and the checks. */
type Verdict = { outcome: Outcome; failing?: string; pending?: number }

function designGate(p: Pipeline, env: Env): Verdict {
  const files = filesOf(p.component, p.layer)
  const problems: string[] = []
  if (!exists(env, files.readBack)) problems.push(`there is no read-back at ${files.readBack}`)
  if (!exists(env, files.codeMap)) problems.push(`there is no code map at ${files.codeMap}`)
  if (!problems.length) {
    const missing = missingExports(p, env)
    if (missing.length) problems.push(`the exports ${missing.join(', ')} are missing`)
    const gates = env.run('npm run gates -- penpot')
    if (!gates.ok) problems.push(`npm run gates -- penpot failed: ${tail(gates.output)}`)
  }
  return problems.length ? { outcome: 'failed', failing: problems.join('; ') } : { outcome: 'done' }
}

function briefGate(p: Pipeline, env: Env): Verdict {
  const { spec } = filesOf(p.component, p.layer)
  if (!exists(env, spec)) return { outcome: 'failed', failing: `there is no spec at ${spec}` }
  const { pending, problems } = specProblems(read(env, spec), read(env, TEMPLATE), p.component)
  if (problems.length) return { outcome: 'failed', failing: `the spec ${problems.join('; ')}` }
  return pending ? { outcome: 'pending', pending } : { outcome: 'done' }
}

function buildGate(p: Pipeline, env: Env): Verdict {
  const files = filesOf(p.component, p.layer)
  const problems = files.code.filter((f) => !exists(env, f)).map((f) => `${f} is missing`)
  const entry = registryEntry(env, p.component)
  if (!entry || entry.status === 'designing')
    problems.push(`${PACKAGE}/components.json has no ${p.component} entry past designing`)
  if (exists(env, files.stories)) {
    const exported = new Set(
      [...read(env, files.stories).matchAll(/^export const (\w+)/gm)].map((m) => m[1]),
    )
    const missing = variantsOf(env, p.component).filter((v) => !exported.has(v))
    if (missing.length) problems.push(`${files.stories} exports no story ${missing.join(', ')}`)
  }
  if (problems.length) return { outcome: 'failed', failing: problems.join('; ') }
  const check = env.run('npm run check')
  return check.ok
    ? { outcome: 'done' }
    : { outcome: 'failed', failing: `npm run check failed: ${tail(check.output)}` }
}

function docsGate(p: Pipeline, env: Env): Verdict {
  const problems: string[] = []
  const entry = registryEntry(env, p.component)
  if (entry?.status !== 'stable')
    problems.push(`${p.component}'s entry is ${entry?.status ?? 'missing'}, not stable`)
  const gates = env.run('npm run gates -- docs')
  if (!gates.ok) problems.push(`npm run gates -- docs failed: ${tail(gates.output)}`)
  return problems.length ? { outcome: 'failed', failing: problems.join('; ') } : { outcome: 'done' }
}

/** The visual report written since the stage began, or nothing. */
function freshReport(p: Pipeline, env: Env) {
  const { report } = filesOf(p.component, p.layer)
  if (!exists(env, report)) return undefined
  try {
    const r = JSON.parse(read(env, report)) as {
      component: string
      generatedAt: string
      pass: boolean
      failed?: number
    }
    const started = p.stages.visual?.started ?? ''
    return r.component === p.component && r.generatedAt >= started ? r : undefined
  } catch {
    return undefined
  }
}

/**
 * Ends a running stage: checks its gate from the files (a stage's `done` is a claim, its `failed`
 * and `pending` are taken as said), records the result, and applies the caps and send-backs.
 */
export function end(
  p: Pipeline,
  stage: Stage,
  outcome: Outcome,
  failing: string | undefined,
  env: Env,
): Result {
  if (p.stages[stage]?.status !== 'running')
    return { ok: false, why: `${stage} is not running; begin it first` }
  const out = clone(p)
  const s = stageOf(out, stage)
  const files = filesOf(p.component, p.layer)
  const said = failing ?? `${stage} returned ${outcome}`
  let verdict: Verdict = { outcome, failing: outcome === 'done' ? undefined : said }
  let note = ''
  switch (stage) {
    case 'design':
      if (outcome === 'done') verdict = designGate(p, env)
      break
    case 'brief':
      if (outcome !== 'failed') verdict = briefGate(p, env)
      break
    case 'build':
      if (outcome === 'done') verdict = buildGate(p, env)
      if (verdict.outcome === 'failed')
        out.needsHuman = { stage, reason: `build failed: ${verdict.failing}` }
      break
    case 'review': {
      const round = roundOf(s)
      const found = exists(env, files.review)
        ? reviewFindings(read(env, files.review), p.component, round)
        : { p1: 0, p2: 0, p3: 0, problems: [`${files.review} is missing`] }
      if (found.problems.length) {
        if (outcome === 'done')
          verdict = { outcome: 'failed', failing: `${files.review} ${found.problems.join('; ')}` }
        break
      }
      s.rounds = round
      s.findings = { p1: found.p1, p2: found.p2, p3: found.p3 }
      note = `, round ${round}: ${found.p1} P1, ${found.p2} P2, ${found.p3} P3`
      if (!found.p1) {
        verdict = { outcome: 'done' }
        break
      }
      s.p1Rounds = (s.p1Rounds ?? 0) + 1
      const reason = `review round ${round} found ${found.p1} P1 (${files.review})`
      verdict = { outcome: 'failed', failing: reason }
      if (s.p1Rounds >= CAPS.review)
        out.needsHuman = {
          stage,
          reason: `${CAPS.review} review rounds found a P1; the last: ${reason}`,
        }
      else sendBack(out, stage, reason)
      break
    }
    case 'docs':
      if (outcome === 'done') verdict = docsGate(p, env)
      if (verdict.outcome === 'failed')
        out.needsHuman = { stage, reason: `docs failed: ${verdict.failing}` }
      break
    case 'visual': {
      const report = freshReport(p, env)
      if (!report) {
        if (outcome === 'done')
          verdict = {
            outcome: 'failed',
            failing: `no ${files.report} written since visual began; run npm run visual -- ${p.component}`,
          }
        break
      }
      if (report.pass) {
        verdict = { outcome: 'done' }
        break
      }
      s.failures = (s.failures ?? 0) + 1
      const reason = `the visual report fails (${files.reportMd})`
      verdict = { outcome: 'failed', failing: reason }
      if (s.failures >= CAPS.visual)
        out.needsHuman = {
          stage,
          reason: `visual failed ${CAPS.visual} times; the last: ${reason}`,
        }
      else sendBack(out, stage, reason)
      break
    }
  }
  s.status = verdict.outcome
  s.ended = env.now()
  if (verdict.failing) s.failing = verdict.failing
  else delete s.failing
  if (verdict.pending) s.pending = verdict.pending
  else delete s.pending
  const why = verdict.failing ? `: ${verdict.failing}` : ''
  return { ok: true, pipeline: out, said: `ended ${stage}: ${verdict.outcome}${note}${why}` }
}
