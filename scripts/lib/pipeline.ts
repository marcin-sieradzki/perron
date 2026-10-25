// The factory's state for one component or pattern, `components/<name>/pipeline.yaml`, and the
// rules that move it through the loop of ROADMAP.md, "Phase 4": design, brief, build, review, docs,
// visual. Every gate is checked from the files and by running the checks, never taken on a stage's
// word, and the caps of ADR 0008 stop the loop at `needs-human`: a failed build run (the build
// stage spends its 3 attempts inside one run; one rerun when the spec was revised in or after it), a
// third build run in a row that asks, a second review round to find a P1 (a third, when the round finds
// only P2s), a second failed docs run, a second visual failure. Short of its cap,
// a review round with a P1 or a P2, a docs failure or a visual failure sends the component back
// to build, and `next` names what the rerun fixes. A deferred design (ADR 0010) takes design and visual out of the loop until
// a design run begins. scripts/factory.ts is the command line over it and the only writer.
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
import { CONTRACT } from '../checks/lib.ts'
import { readPropRules } from '../checks/props.ts'
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
 * The budgets of ADR 0008 the factory counts: review rounds with a P1 or a P2, docs and visual
 * failures. A P2 is fixed before merge, as a P1 is, so either sends the component back to build.
 * A round counts toward `review` when it finds a P1, and toward `reviewP2` whatever it finds: a
 * round with only P2s, usually a line or a sentence to fix, gets one round more before the loop
 * stops, where a P1 in the second round stops it. The build stage spends its 3 attempts inside one run, so the factory stops at the first failed
 * build run. A docs failure is a fault in a source the build wrote (code, types, JSDoc, stories)
 * or the spec, so the first goes back to build, as a review's P1 does. A build whose fix is a
 * decision the spec leaves open returns `pending` with its questions and waits at
 * `pending-questions`, like any stage that asks; one whose fix is the shared tooling's, the
 * read-back's or a token's returns `failed`, and that stops the loop, but once: when the spec
 * was revised since that run began, whether before or after it ended, as when the brief's answer is
 * what the build could not do, the build runs again from the revised spec (`respec`); the answers a
 * run after the build's questions writes in are its own, not a revision. A build that keeps asking stops too: the third
 * build run in a row to end `pending` waits at `needs-human` (`buildAsked`), since in an unattended
 * run every question is answered and the build would otherwise ask and rerun without end; a build
 * that passes its gate starts the count again, so a send-back's rerun may ask afresh.
 */
export const CAPS = {
  review: 2,
  reviewP2: 3,
  docs: 2,
  visual: 2,
  buildAsked: 3,
  respec: 1,
} as const

/** The spec template every spec keeps the sections of. */
export const TEMPLATE = 'docs/components/TEMPLATE.md'

/** One stage's record. Counters outlive a re-run; the rest describes the latest run. */
export interface StageState {
  status?: 'running' | Outcome
  started?: string
  ended?: string
  /** Why the latest run failed, what it asks, or why the stage was sent back */
  failing?: string
  /** While running: the `fix` `next` gave when it began, so `next` still gives it after `begin` */
  fix?: string
  /** brief: the `[PENDING]` questions left in the spec */
  pending?: number
  /** build: runs begun, each a fresh set of the build stage's attempts */
  runs?: number
  /** build: the SHA-256 of the spec as the latest run left it, its own answers written in */
  spec?: string
  /**
   * build: the SHA-256 of the spec when the latest run began, unless that run answers the build's
   * questions, whose answers it writes in, so a revision made before the run ended counts too
   */
  begun?: string
  /**
   * build: runs in a row that ended `pending` (a run that passes its gate clears it), and failed
   * runs rerun because the spec changed since
   */
  asked?: number
  respecs?: number
  /** review: rounds reviewed, and how many of them found a P1 or a P2 and sent the component back */
  rounds?: number
  sentBack?: number
  /**
   * review: the commit the latest round reviewed, HEAD when it ended; the next round raises a new
   * P1 or P2 only on a line changed since it, or a regression that change causes
   */
  reviewed?: string
  /** review: the latest round's findings by level */
  findings?: { p1: number; p2: number; p3: number }
  /**
   * review: the one round `unblock` granted past a cap; that round, or any after it, that finds a P1
   * or a P2 stops the loop again
   */
  granted?: number
  /**
   * Set by `unblock` on a stage that reruns itself: the stop's reason, which the maintainer has
   * acted on, so the rerun's `fix` is what fails now, never that reason again
   */
  acted?: string
  /** docs: failed runs; visual: failed reports */
  failures?: number
}

/**
 * One line the PR carries, kept across reruns: a Direction finding a stage returned, the questions
 * a stage asked (answered by the maintainer, or in an unattended run by their recommended answers,
 * so the PR's "Decisions to confirm"), or a `needs-human` stop that `unblock` cleared.
 */
export interface Note {
  stage: Stage
  at: string
  direction?: string
  questions?: string
  /**
   * The stop's reason. At a review cap `unblock` grants one more round (the stage's `granted`); at
   * any other cap it resets the count, so the runs after it start again
   */
  unblocked?: string
}

/** `components/<name>/pipeline.yaml`. Phase 5.5's scorecard joins it later. */
export interface Pipeline {
  component: string
  layer: Layer
  /** The maintainer's design approval, with the SHA-256 of the read-back it approved */
  approval?: { readBack: string; at: string }
  /** The design is deferred (ADR 0010): the loop runs from the spec, without design and visual */
  deferred?: { at: string }
  /** A cap was hit or a stage cannot go on: the maintainer acts, then runs `unblock` */
  needsHuman?: { stage: Stage; reason: string }
  stages: Partial<Record<Stage, StageState>>
  /** What the PR carries, in the order it happened; never voided by a rerun */
  notes?: Note[]
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
  | {
      run: Stage
      round?: number
      why: string
      /**
       * On a rerun, what it fixes first, to pass to the stage as `fix`: the reason it was sent
       * back or failed, with a review's P1 and P2 findings word for word, or the answers to carry
       */
      fix?: string
      /** review after a round: the commit that round reviewed, to pass to the stage as `since` */
      since?: string
    }
  | { wait: Gate; stage?: Stage; why: string }

/** A command's result: the new pipeline when it was accepted, or why it was refused. */
export type Result =
  | {
      ok: true
      pipeline: Pipeline
      said: string
      /** `end`'s message for the stage's commit, from the gate's outcome: `Chip: review failed, round 1: …` */
      commit?: string
      /** What the command took but the orchestrator should fix next time, for stderr */
      warnings?: string[]
    }
  | { ok: false; why: string }

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

/** The stages `p` goes through: all of them, or all but design and visual once it is deferred. */
const stagesOf = (p: Pipeline): readonly Stage[] =>
  p.deferred ? STAGES.filter((s) => s !== 'design' && s !== 'visual') : STAGES

/**
 * The variant names of `<Name>`'s read-back, which are its exports' and stories' names; none for a
 * deferred design, whose stories follow the spec.
 */
function variantsOf(env: Env, name: string, deferred = false) {
  const design = deferred ? undefined : readBack(env, name)
  return design ? design.variants.map((v) => variantName(design.properties, v.props)) : []
}

const PENDING_MENTION = /`\[PENDING\][^`]*`/g
/** A `[PENDING]` line answered but not rewritten: still labelled, or still carrying its recommendation. */
const ANSWER_LEFT = /^[\s>*|-]*answered\b|\bRecommended:/i
const CODE_SPAN = /`[^`\n]+`/g

/** Whether a line of a spec or the template is a table row, where the template's slots are cells. */
const isRow = (line: string) => line.trimStart().startsWith('|')

/**
 * The template's slots in one line: each code span, keyed by the kind of line (a table row or
 * prose) and its **context**, the words before it in its cell, or in prose since the last code
 * span, at most 24 characters. A slot is the template's own only where its context is too.
 */
function spanKeys(line: string) {
  const row = isRow(line)
  const keys: { span: string; key: string }[] = []
  let from = 0
  for (const m of line.matchAll(CODE_SPAN)) {
    let before = line.slice(from, m.index)
    if (row) before = before.slice(before.lastIndexOf('|') + 1)
    const context = before.trim().slice(-24)
    keys.push({ span: m[0], key: `${row ? 'row' : 'prose'}\n${context}\n${m[0]}` })
    from = m.index + m[0].length
  }
  return keys
}

/**
 * Where a template placeholder left in `spec` would show: its text outside the `[PENDING]`
 * questions, whose words are the maintainer's to answer, and outside its code spans, which can hold
 * angle brackets as code (`[data-delay='<value>']`), but for a code span that is one of the
 * template's own slots: the same span, on the same kind of line, after the same words. So a cell
 * left as `<key>Label` is a slot, and prose or a cell naming the contract's `<key>Label` or
 * `pn-<Name>-<part>` is not.
 */
function unfilledText(spec: string, template: string) {
  const slots = new Set(template.split('\n').flatMap((line) => spanKeys(line).map((k) => k.key)))
  return spec
    .replace(PENDING_MENTION, '')
    .split('\n')
    .filter((line) => !line.includes('[PENDING]'))
    .map((line) => {
      const keys = spanKeys(line)
      let i = 0
      return line.replace(CODE_SPAN, (span) => (slots.has(keys[i++].key) ? span : ''))
    })
    .join('\n')
}

/**
 * What keeps a spec from being complete: a template section missing or out of order, a template
 * placeholder left, the template's title kept, an answer not written as the decision, and the
 * `[PENDING]` questions left (a code span
 * that starts with `[PENDING]` mentions the marker and is not a question).
 */
export function specProblems(
  spec: string,
  template: string,
  name: string,
  banned: Record<string, string> = {},
) {
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
  const placeholders = new Set(
    [...template.replace(PENDING_MENTION, '').matchAll(/<(?!!--)[^<>\n]+>/g)].map((m) => m[0]),
  )
  const unfilled = unfilledText(spec, template)
  for (const p of placeholders)
    if (unfilled.includes(p)) problems.push(`still has the placeholder ${p}`)
  for (const prop of propNames(spec))
    if (banned[prop])
      problems.push(
        `has a Props row for \`${prop}\`, a name the contract's "Names from other libraries" bans; use ${banned[prop]}`,
      )
  spec.split('\n').forEach((line, i) => {
    if (!line.includes('[PENDING]') && ANSWER_LEFT.test(line.replace(CODE_SPAN, '')))
      problems.push(
        `has an answer left as its question or under an "Answered" label at line ${i + 1}; write the decision in place of the line, as a statement (component-brief, "Facts and decisions")`,
      )
  })
  const pending = spec.replace(PENDING_MENTION, '').match(/\[PENDING\]/g)?.length ?? 0
  return { pending, problems }
}

/** The prop each row of the spec's Props tables names: the first code span of its first cell. */
function propNames(spec: string) {
  const props = /^## Props\s*$([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(spec)?.[1] ?? ''
  return [...props.matchAll(/^\|\s*`([^`]+)`/gm)].map((m) => m[1])
}

/** The names the contract's "Names from other libraries" table bans, when the contract is there. */
function bannedNames(env: Env) {
  return exists(env, CONTRACT) ? readPropRules(read(env, CONTRACT)).banned : {}
}

const LEVELS = ['P1', 'P2', 'P3'] as const

/** The text under a review's `## <level>` heading, up to the next heading; none without one. */
function levelSection(text: string, level: (typeof LEVELS)[number]) {
  const at = text.search(new RegExp(`^## ${level}\\s*$`, 'm'))
  if (at < 0) return undefined
  const rest = text.slice(at).split('\n').slice(1).join('\n')
  const end = rest.search(/^#{1,2} /m)
  return rest.slice(0, end >= 0 ? end : undefined)
}

/** A review's P1 and P2 findings, word for word: what the build's rerun fixes first. */
export function blockingFindings(text: string) {
  return (['P1', 'P2'] as const)
    .map((level) => levelSection(text, level)?.trim() ?? '')
    .filter((body) => body && body !== 'None.')
    .join('\n')
}

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
    const body = levelSection(text, level)
    if (body === undefined) {
      problems.push(`has no "## ${level}" section`)
      continue
    }
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
    ...(p.deferred && { deferred: p.deferred }),
    ...(p.needsHuman && { needsHuman: p.needsHuman }),
    stages,
    ...(p.notes?.length && { notes: p.notes }),
  }
  return `# Written by npm run factory; never by hand.\n${stringify(ordered, { lineWidth: 0, singleQuote: true })}`
}

/** A pipeline from `pipeline.yaml`'s text. */
export function parsePipeline(text: string): Pipeline {
  const p = parse(text) as Pipeline
  // A pipeline written before P2s sent a component back counted its P1 rounds as `p1Rounds`.
  const review = p.stages?.review as (StageState & { p1Rounds?: number }) | undefined
  if (review?.p1Rounds !== undefined) {
    review.sentBack ??= review.p1Rounds
    delete review.p1Rounds
  }
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
  if (p.deferred) return undefined
  const files = filesOf(p.component, p.layer)
  if (!p.approval)
    return `the design is not approved; the maintainer approves it in Penpot, then ${npm(p.component, 'approve')}`
  if (p.approval.readBack !== sha256(env, files.readBack))
    return `${files.readBack} changed since the design was approved; the maintainer approves it again with ${npm(p.component, 'approve')}`
  return undefined
}

/** Why `stage` cannot begin now, or nothing. */
function refusal(p: Pipeline, stage: Stage, env: Env): string | undefined {
  if (p.needsHuman && !(stage === 'build' && respecRerun(p, env)))
    return `${p.component} waits at needs-human (${p.needsHuman.stage}): ${p.needsHuman.reason}. Once it is fixed, the maintainer runs ${npm(p.component, 'unblock')}`
  if (stage === 'design') return undefined
  const stages = stagesOf(p)
  if (!stages.includes(stage))
    return `the design is deferred, so there are no exports to compare; a design run ends the deferral`
  const before = stages.slice(0, stages.indexOf(stage)).find((s) => p.stages[s]?.status !== 'done')
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
      bannedNames(env),
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

/** The `[PENDING]` questions left in the spec at `spec`, or nothing when it cannot be read. */
function specPending(env: Env, spec: string) {
  if (!exists(env, spec) || !exists(env, TEMPLATE)) return undefined
  return specProblems(read(env, spec), read(env, TEMPLATE), '').pending
}

/**
 * What a rerun fixes first: the reason it was sent back or failed, and for a review's send-back
 * that round's P1 and P2 findings from review.md, word for word.
 */
function fixOf(p: Pipeline, failing: string, env: Env) {
  const { review } = filesOf(p.component, p.layer)
  const round = /^review round (\d+) found/.exec(failing)?.[1]
  if (!round || !exists(env, review)) return failing
  const text = read(env, review)
  if (reviewFindings(text, p.component, Number(round)).problems.length) return failing
  return `${failing}. Fix each of its P1 and P2 findings at the line it names:\n${blockingFindings(text)}`
}

/**
 * The fix of a rerun after `unblock`: the stop's reason is the maintainer's, already acted on, so
 * the rerun fixes only what fails now, never that reason or an earlier failure again.
 */
const actedOn = (stage: Stage, reason: string) =>
  `${stage} stopped at needs-human (${reason}), and the maintainer has acted on it, so that reason is not this run's to fix. Fix only what fails now: run npm run check first and fix each failure at the line it names, then do the skill's other steps.`

/**
 * The fix of a failed build's rerun from a revised spec: the revision is the answer to the failure,
 * and may take another way than the one the failure recommends (VehicleTable's spec gave a `calc()`
 * over tokens where its failed run asked for a new token), so the rerun builds what the spec says
 * now and fixes only what fails now, never that failure or its recommendation again.
 */
const respecced = (reason: string, spec: string) =>
  `The last build run stopped (${reason}), and ${spec} has been revised since that run began to answer it, so that failure and any fix it recommends are not this run's to make. Build what ${spec} says now: read its revision (git log -p -- ${spec}) and change the code to match, then run npm run check and fix each failure at the line it names, and do the skill's other steps.`

/** The fix of a brief run that carries the answers written in `spec` through it. */
const carryAnswers = (spec: string) =>
  `The maintainer's answers are written in ${spec} in place of their [PENDING] lines: rewrite any still worded as a question or labelled, then carry each one into every section it touches (component-brief, "Run again"), and run its steps 3 to 5 again.`

/**
 * What a failed brief's rerun is told of the questions its run asked, returning `pending` before
 * its gate failed it: none for another stage or a run that asked none. With the answers written in
 * the spec since, it carries them through as well; with the questions still there, it keeps them.
 */
function askedBefore(p: Pipeline, stage: Stage, env: Env) {
  const s = p.stages[stage]
  if (stage !== 'brief' || s?.status !== 'failed') return ''
  const asked = p.notes?.find((n) => n.stage === 'brief' && n.at === s.ended && n.questions)
  if (!asked) return ''
  const { spec } = filesOf(p.component, p.layer)
  const then = specPending(env, spec)
    ? `Keep each [PENDING] line in ${spec}, and return the questions again, with any the fix adds.`
    : carryAnswers(spec)
  return `\nThe failed run returned pending, with these questions:\n${asked.questions}\n${then}`
}

/**
 * Whether a failed build's needs-human stop gives way to one rerun: the spec was revised since the
 * failed run began, before it ended or after (a run that answers the build's questions counts from
 * its end, its answers being its own), and no earlier failure since the last `unblock` was rerun
 * that way.
 */
function respecRerun(p: Pipeline, env: Env) {
  const s = p.stages.build
  if (p.needsHuman?.stage !== 'build' || s?.status !== 'failed' || !s.spec) return false
  if ((s.respecs ?? 0) >= CAPS.respec) return false
  const now = sha256(env, filesOf(p.component, p.layer).spec)
  return s.spec !== now || (s.begun ?? s.spec) !== now
}

/** What comes next for `p`: the stage to run, or the gate it waits at. Never writes. */
export function next(p: Pipeline, env: Env): Next {
  if (p.needsHuman && respecRerun(p, env)) {
    const { spec } = filesOf(p.component, p.layer)
    return {
      run: 'build',
      why: `the last run failed, and ${spec} has changed since it began; run the build again from the revised spec`,
      fix: respecced(p.needsHuman.reason, spec),
    }
  }
  if (p.needsHuman)
    return { wait: 'needs-human', stage: p.needsHuman.stage, why: p.needsHuman.reason }
  const stages = stagesOf(p)
  for (const stage of stages) {
    if (stage !== 'design') {
      const approval = approvalProblem(p, env)
      if (approval) return { wait: 'design-approval', stage: 'design', why: approval }
    }
    const s = p.stages[stage] ?? {}
    if (s.status === 'done') continue
    const round =
      stage === 'review' ? { round: roundOf(s), ...(s.reviewed && { since: s.reviewed }) } : {}
    if (s.status === 'running')
      return {
        run: stage,
        ...round,
        why: `${stage} began at ${s.started} and has not ended; run it again`,
        ...(s.fix && { fix: s.fix }),
      }
    if (s.status === 'pending') {
      if (stage !== 'brief')
        return {
          wait: 'pending-questions',
          stage,
          why: s.failing ?? `${stage} has questions for the maintainer`,
        }
      // the brief that asked runs again once every answer is written in the spec
      const { spec } = filesOf(p.component, p.layer)
      const left = specPending(env, spec) ?? s.pending ?? 0
      if (!left)
        return {
          run: stage,
          why: `the answers are written in ${spec}; run the brief again to carry them through the spec`,
          fix: carryAnswers(spec),
        }
      return {
        wait: 'pending-questions',
        stage,
        why: `the spec ${spec} has ${left} [PENDING] question${left === 1 ? '' : 's'} for the maintainer`,
      }
    }
    const why = s.failing
      ? `${s.status === 'failed' ? 'the last run failed' : 'sent back'}: ${s.failing}`
      : stage === 'design'
        ? `${p.component} has no design yet`
        : stage === stages[0]
          ? `the design is deferred`
          : `${stages[stages.indexOf(stage) - 1]} is done`
    const fix = s.acted
      ? actedOn(stage, s.acted)
      : s.failing && fixOf(p, s.failing, env) + askedBefore(p, stage, env)
    return { run: stage, ...round, why, ...(fix && { fix }) }
  }
  return {
    wait: 'done',
    why: p.deferred
      ? `every stage passed, with the design deferred; ${p.component}'s PR is ready`
      : `every stage passed; ${p.component}'s PR is ready for the maintainer`,
  }
}

/** Keeps only a stage's counters, for a stage whose latest run no longer counts. */
function counters(s: StageState = {}): StageState {
  const { runs, asked, respecs, rounds, sentBack, reviewed, findings, granted, failures } = s
  return Object.fromEntries(
    Object.entries({
      runs,
      asked,
      respecs,
      rounds,
      sentBack,
      reviewed,
      findings,
      granted,
      failures,
    }).filter(([, v]) => v !== undefined),
  )
}

/**
 * The fix a run of `stage` starts from, given `was`, the answer of `next`: the one `next` gives for
 * it, or, while it waits on its questions, the fix the run that asked was given, which its rerun
 * with the answers still has to make.
 */
function fixIn(p: Pipeline, stage: Stage, was: Next) {
  if ('run' in was) return was.run === stage ? was.fix : undefined
  return was.wait === 'pending-questions' && was.stage === stage ? p.stages[stage]?.fix : undefined
}

/** The fix a run of `stage` begins with now, as `begin` records it: `next`'s, or the asking run's. */
export const fixFor = (p: Pipeline, stage: Stage, env: Env) => fixIn(p, stage, next(p, env))

/**
 * Why `stage` is not what `was`, the answer of `next`, names: a stage it doesn't run or wait on,
 * which would begin without the `fix` `next` gives (a build begun where `next` says review). A
 * design run may always begin, since it ends a deferral; once every stage is done, any may.
 */
function notNext(stage: Stage, was: Next): string | undefined {
  if (stage === 'design') return undefined
  const named = 'run' in was ? was.run : was.wait === 'pending-questions' ? was.stage : undefined
  if (!named || named === stage) return undefined
  return `next names ${named} (${was.why}); begin ${named}`
}

/**
 * Records `stage` as running, or refuses it: one whose inputs are missing, or one that `next`
 * does not name. Re-running a stage voids every later one.
 */
export function begin(p: Pipeline, stage: Stage, env: Env): Result {
  const why = refusal(p, stage, env)
  if (why) return { ok: false, why: `${stage} cannot begin: ${why}` }
  // the fix a rerun was sent back with outlives `begin`, which clears the reason it comes from
  const was = next(p, env)
  const skipped = notNext(stage, was)
  if (skipped) return { ok: false, why: `${stage} cannot begin: ${skipped}` }
  const fix = fixIn(p, stage, was)
  const out = clone(p)
  if (stage === 'build' && respecRerun(p, env)) {
    const reason = out.needsHuman!.reason
    delete out.needsHuman
    out.stages.build!.respecs = (out.stages.build!.respecs ?? 0) + 1
    ;(out.notes ??= []).push({
      stage,
      at: env.now(),
      unblocked: `${reason}; rerun once because the spec changed since that run began`,
    })
  }
  if (stage === 'design') {
    delete out.approval
    delete out.deferred
  }
  for (const later of STAGES.slice(STAGES.indexOf(stage) + 1))
    if (out.stages[later]) out.stages[later] = counters(out.stages[later])
  const s = (out.stages[stage] = { ...counters(out.stages[stage]), status: 'running' as const })
  s.started = env.now()
  if (fix) s.fix = fix
  if (stage === 'build') {
    s.runs = (s.runs ?? 0) + 1
    // a run after the build's questions writes their answers in, which are not a revision
    const { spec } = filesOf(p.component, p.layer)
    if (!s.asked && exists(env, spec)) s.begun = sha256(env, spec)
  }
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

/**
 * Defers the design (ADR 0010): brief, build, review and docs run from the spec alone, and a
 * later design run ends the deferral and voids the stages after it.
 */
export function defer(p: Pipeline, env: Env): Result {
  if (p.stages.design?.status === 'running')
    return { ok: false, why: `cannot defer: design is running; end it first` }
  if (p.approval) return { ok: false, why: `cannot defer: the design is already approved` }
  if (p.deferred) return { ok: false, why: `the design of ${p.component} is already deferred` }
  const out = clone(p)
  out.deferred = { at: env.now() }
  return { ok: true, pipeline: out, said: `deferred the design of ${p.component}` }
}

/**
 * Clears a needs-human stop once the maintainer has acted, and notes the stop for the PR and a later
 * review round. A review cap gets exactly one more round (`granted`), whose P1 or P2 stops the loop
 * again; any other cap starts its count again. A stage that reruns itself records the reason as
 * `acted`, so `next` gives its rerun what fails now as its fix, not the reason the maintainer fixed.
 */
export function unblock(p: Pipeline, env: Env, to?: Stage): Result {
  if (!p.needsHuman) return { ok: false, why: `${p.component} is not at needs-human` }
  const stage = p.needsHuman.stage
  if (to && !(stage === 'review' && (to === 'build' || to === 'review')))
    return {
      ok: false,
      why: `--to ${to} is for a review cap, to build (the default) or review; ${p.component} stopped at ${stage}`,
    }
  const out = clone(p)
  ;(out.notes ??= []).push({ stage, at: env.now(), unblocked: out.needsHuman!.reason })
  const s = stageOf(out, stage)
  if (stage === 'review') s.granted = roundOf(s)
  // a review cap goes back to build with the cap round's findings as its fix, then review again;
  // `--to review` reviews again as it stands, once the maintainer has fixed the code by hand
  const capped = stage === 'review' && s.status === 'failed' && s.failing
  if (capped && to !== 'review') {
    sendBack(out, 'review', s.failing!)
    out.stages.review = counters(s)
  } else if (s.status === 'failed') s.acted = out.needsHuman!.reason
  if (stage === 'docs' || stage === 'visual') s.failures = 0
  if (stage === 'build') {
    delete s.asked
    delete s.respecs
  }
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
  const { pending, problems } = specProblems(
    read(env, spec),
    read(env, TEMPLATE),
    p.component,
    bannedNames(env),
  )
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
    const missing = variantsOf(env, p.component, !!p.deferred).filter((v) => !exported.has(v))
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
  // The whole check, not the docs gate alone: a gate that main changed since the build ran fails
  // here, and goes back to build with the docs stage's own faults.
  if (!problems.length) {
    const check = env.run('npm run check')
    if (!check.ok) problems.push(`npm run check failed: ${tail(check.output)}`)
  }
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

/** The words of a finding, for comparing two: lower case, three letters or more, punctuation out. */
const findingWords = (text: string) =>
  new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, ' ')
      .split(' ')
      .filter((w) => w.length > 2),
  )

/** How much of the shorter finding's words the other holds, from 0 to 1. */
function overlap(a: string, b: string) {
  const [x, y] = [findingWords(a), findingWords(b)]
  let shared = 0
  for (const w of x) if (y.has(w)) shared++
  return shared / Math.max(1, Math.min(x.size, y.size))
}

/**
 * The Direction findings of `direction` that no note in `notes` (nor an earlier one of the list)
 * already says: a rerun returns the earlier run's findings again, often reworded, so a finding
 * whose words are four fifths or more another's is that one again.
 */
export function newDirection(direction: string[], notes: Note[] = []) {
  const known = notes.flatMap((n) => (n.direction ? [n.direction] : []))
  const fresh: string[] = []
  for (const d of direction)
    if (![...known, ...fresh].some((k) => overlap(k, d) >= 0.8)) fresh.push(d)
  return fresh
}

/** Questions numbered from 1, as a stage returns them: `1. …` or `1) …`. */
const NUMBERED = /(^|\s)1[.)]\s/

/**
 * Ends a running stage: checks its gate from the files (a stage's `done` is a claim, its `failed`
 * and `pending` are taken as said), records the result, and applies the caps and send-backs. The
 * run's Direction findings the notes don't already hold, and a `pending` run's questions, join the
 * notes the PR carries.
 */
export function end(
  p: Pipeline,
  stage: Stage,
  outcome: Outcome,
  failing: string | undefined,
  env: Env,
  direction: string[] = [],
  tooling = false,
): Result {
  if (tooling && !(stage === 'docs' && outcome === 'failed'))
    return { ok: false, why: '--tooling is for a docs run that failed on shared tooling' }
  // component-docs starts a shared-tooling failure "Shared tooling:", so it stops without the flag
  if (stage === 'docs' && outcome === 'failed' && /^shared tooling\b/i.test(failing ?? ''))
    tooling = true
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
      // A brief that asked stays pending though its answers were written before it ended, so
      // `next` runs it again to carry each one through the spec (component-brief, "Run again").
      if (outcome === 'pending' && verdict.outcome === 'done') verdict = { outcome: 'pending' }
      break
    case 'build':
      if (outcome === 'done') verdict = buildGate(p, env)
      // the spec as the run left it: answers it wrote in are its own, not a revision (respecRerun)
      s.spec = sha256(env, files.spec)
      if (verdict.outcome === 'done') delete s.asked
      if (verdict.outcome === 'failed')
        out.needsHuman = { stage, reason: `build failed: ${verdict.failing}` }
      if (verdict.outcome === 'pending') {
        s.asked = (s.asked ?? 0) + 1
        if (s.asked >= CAPS.buildAsked)
          out.needsHuman = {
            stage,
            reason: `${s.asked} build runs in a row ended with questions; the last asked: ${said}`,
          }
      }
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
      // the reviewer is read-only and the round's commit comes after `end`, so HEAD is what it read
      const head = env.run('git rev-parse HEAD')
      const sha = head.output.trim()
      if (head.ok && /^[0-9a-f]{40}$/.test(sha)) s.reviewed = sha
      note = `, round ${round}: ${found.p1} P1, ${found.p2} P2, ${found.p3} P3`
      if (!found.p1 && !found.p2) {
        verdict = { outcome: 'done' }
        break
      }
      s.sentBack = (s.sentBack ?? 0) + 1
      const levels = [found.p1 && `${found.p1} P1`, found.p2 && `${found.p2} P2`].filter(Boolean)
      const reason = `review round ${round} found ${levels.join(' and ')} (${files.review})`
      verdict = { outcome: 'failed', failing: reason }
      if (s.granted && round >= s.granted)
        out.needsHuman = {
          stage,
          reason: `review round ${round} found a P1 or a P2 after unblock granted one round past the cap (round ${s.granted}): ${reason}`,
        }
      else if (found.p1 && s.sentBack >= CAPS.review)
        out.needsHuman = {
          stage,
          reason: `${s.sentBack} review rounds found a P1 or a P2, the last a P1: ${reason}`,
        }
      else if (s.sentBack >= CAPS.reviewP2)
        out.needsHuman = {
          stage,
          reason: `${s.sentBack} review rounds found a P1 or a P2; the last: ${reason}`,
        }
      else sendBack(out, stage, reason)
      break
    }
    case 'docs': {
      if (outcome === 'done') verdict = docsGate(p, env)
      if (verdict.outcome !== 'failed') break
      // shared tooling is the maintainer's to change: a build rerun could not fix it
      if (tooling) {
        out.needsHuman = { stage, reason: `docs failed on shared tooling: ${verdict.failing}` }
        break
      }
      s.failures = (s.failures ?? 0) + 1
      const reason = `docs failed: ${verdict.failing}`
      if (s.failures >= CAPS.docs)
        out.needsHuman = { stage, reason: `docs failed ${CAPS.docs} times; the last: ${reason}` }
      else sendBack(out, stage, reason)
      break
    }
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
  const at = env.now()
  s.status = verdict.outcome
  s.ended = at
  // a run that asks keeps its fix, such as a review's findings, for the rerun with the answers
  if (verdict.outcome !== 'pending') delete s.fix
  if (verdict.failing) s.failing = verdict.failing
  else delete s.failing
  if (verdict.pending) s.pending = verdict.pending
  else delete s.pending
  // a run's questions are kept though its gate failed it, so its rerun and the PR still have them
  const asked = outcome === 'pending' && failing
  const notes = [
    ...newDirection(direction, p.notes).map((d) => ({ stage, at, direction: d })),
    ...(asked ? [{ stage, at, questions: failing }] : []),
  ]
  if (notes.length) (out.notes ??= []).push(...notes)
  const why = verdict.failing ? `: ${verdict.failing}` : ''
  const warnings =
    outcome === 'pending' && !NUMBERED.test(failing ?? '')
      ? [
          `${stage} ended pending without its numbered questions in --failing ("1. <question> Recommended: <answer>. 2. …"), so the notes, the rerun and the PR's Decisions to confirm lack them; give them on the next end`,
        ]
      : []
  return {
    ok: true,
    pipeline: out,
    said: `ended ${stage}: ${verdict.outcome}${note}${why}`,
    commit: `${p.component}: ${stage} ${verdict.outcome}${note}`,
    ...(warnings.length && { warnings }),
  }
}
