// The factory's command line, the only writer of `components/<name>/pipeline.yaml`. The `factory`
// skill drives a component through the loop with it; the rules are in scripts/lib/pipeline.ts.
// Usage: node scripts/factory.ts <command> <Name> … [--json] (npm run factory -- …)
//   next <Name>                                   what comes next; never writes
//   begin <Name> <stage>                          records the stage as running, or refuses (exit 1)
//   end <Name> <stage> <done|failed|pending> [--failing "<check and why>"] [--direction "<finding>"]… [--tooling]
//                                                 checks the stage's gate, records it, prints next;
//                                                 each --direction the notes lack, and a pending run's --failing
//                                                 (its numbered questions, kept though the gate fails it),
//                                                 joins the pipeline's notes, which the PR carries
//   approve <Name>                                the maintainer's design approval
//   defer <Name>                                  runs the loop without design and visual (ADR 0010)
//   unblock <Name> [--to build|review]            clears needs-human once the maintainer has acted; a
//                                                 review cap goes back to build with its findings, or
//                                                 with --to review is reviewed again as it stands
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  approve,
  begin,
  defer,
  end,
  filesOf,
  loadPipeline,
  next,
  OUTCOMES,
  serializePipeline,
  STAGES,
  unblock,
  type Env,
  type Next,
  type Outcome,
  type Result,
  type Stage,
} from './lib/pipeline.ts'

const USAGE = `usage: npm run factory -- next|approve|defer <Name> [--json]
       npm run factory -- unblock <Name> [--to build|review] [--json]
       npm run factory -- begin <Name> <stage> [--json]
       npm run factory -- end <Name> <stage> <done|failed|pending> [--failing "<check and why>"] [--direction "<finding>"]… [--tooling] [--json]
stages: ${STAGES.join(', ')}`

/** What a command prints and its exit code. */
export interface Printed {
  code: number
  out: string
  err: string
}

const nextLines = (n: Next) =>
  'run' in n
    ? `run: ${n.run}${n.round ? `\nround: ${n.round}` : ''}${n.since ? `\nsince: ${n.since}` : ''}\nwhy: ${n.why}${n.fix && n.fix !== n.why.replace(/^[^:]+: /, '') ? `\nfix: ${n.fix}` : ''}`
    : `wait: ${n.wait}${n.stage ? `\nstage: ${n.stage}` : ''}\nwhy: ${n.why}`

/** Runs one factory command over the repo at `env.root`. */
export function factory(argv: string[], env: Env): Printed {
  const json = argv.includes('--json')
  // `--failing` and `--to` once and `--direction` any number of times, each with the word after it
  const valued: Record<string, string[]> = { '--failing': [], '--direction': [], '--to': [] }
  const args: string[] = []
  for (let i = 0; i < argv.length; i++) {
    if (Object.hasOwn(valued, argv[i])) valued[argv[i]].push(argv[++i] ?? '')
    else if (argv[i] !== '--json' && argv[i] !== '--tooling') args.push(argv[i])
  }
  const tooling = argv.includes('--tooling')
  const failing = valued['--failing'].at(-1)
  const direction = valued['--direction'].filter(Boolean)
  const [command, name, stage, outcome] = args
  const refuse = (why: string): Printed =>
    json
      ? { code: 1, out: `${JSON.stringify({ ok: false, why })}\n`, err: '' }
      : { code: 1, out: '', err: `refused: ${why}\n` }
  if (!name || !/^[A-Z][A-Za-z0-9]*$/.test(name))
    return refuse(`a PascalCase name is needed\n${USAGE}`)
  const needsStage = command === 'begin' || command === 'end'
  if (needsStage && !STAGES.includes(stage as Stage))
    return refuse(`"${stage ?? ''}" is not a stage\n${USAGE}`)
  if (command === 'end' && !OUTCOMES.includes(outcome as Outcome))
    return refuse(`"${outcome ?? ''}" is not an outcome: ${OUTCOMES.join(', ')}`)

  const p = loadPipeline(env, name)
  let result: Result
  switch (command) {
    case 'next': {
      const n = next(p, env)
      return {
        code: 0,
        out: json ? `${JSON.stringify({ component: name, ...n })}\n` : `${nextLines(n)}\n`,
        err: '',
      }
    }
    case 'begin':
      result = begin(p, stage as Stage, env)
      break
    case 'end':
      result = end(p, stage as Stage, outcome as Outcome, failing, env, direction, tooling)
      break
    case 'approve':
      result = approve(p, env)
      break
    case 'defer':
      result = defer(p, env)
      break
    case 'unblock': {
      const to = valued['--to'].at(-1)
      if (to !== undefined && !STAGES.includes(to as Stage))
        return refuse(`"${to}" is not a stage\n${USAGE}`)
      result = unblock(p, env, to as Stage | undefined)
      break
    }
    default:
      return refuse(`"${command ?? ''}" is not a command\n${USAGE}`)
  }
  if (!result.ok) return refuse(result.why)
  const file = join(env.root, filesOf(name, result.pipeline.layer).pipeline)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, serializePipeline(result.pipeline))
  const n = next(result.pipeline, env)
  return {
    code: 0,
    out: json
      ? `${JSON.stringify({ ok: true, said: result.said, next: n, ...(result.warnings && { warnings: result.warnings }) })}\n`
      : `${result.said}\n${command === 'begin' ? '' : `${nextLines(n)}\n`}`,
    err: (result.warnings ?? []).map((w) => `warning: ${w}\n`).join(''),
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..')
  const env: Env = {
    root,
    run(command) {
      const [bin, ...rest] = command.split(' ')
      const r = spawnSync(bin, rest, {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      })
      return { ok: r.status === 0, output: `${r.stdout ?? ''}${r.stderr ?? ''}` }
    },
    now: () => new Date().toISOString(),
  }
  const printed = factory(process.argv.slice(2), env)
  process.stdout.write(printed.out)
  process.stderr.write(printed.err)
  process.exit(printed.code)
}
