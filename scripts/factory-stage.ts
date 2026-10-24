// A stage of the component loop as one plain agent call, for an orchestrator that has no Workflow
// tool, such as a batch slot running as a subagent. It runs .claude/workflows/factory-stage.js
// with a stand-in for `agent` and prints the call that workflow would make: the agent type, when
// it names one, and the prompt, ending with the JSON the agent returns, from the workflow's schema.
// A rerun's `fix`, when the args leave it out, comes from `next` over the pipeline in `dir` (or the
// current directory), so a send-back's build is told what to fix.
// Usage: node scripts/factory-stage.ts '{"stage":"build","name":"Chip","dir":"…","port":6011}'
import { readFileSync } from 'node:fs'
import { loadPipeline, next, type Env } from './lib/pipeline.ts'

export interface StageCall {
  /** The agent type to start, such as `component-reviewer`; none for a skill's stage */
  agentType?: string
  /** The whole prompt for a fresh agent, the return shape included */
  prompt: string
}

const SOURCE = readFileSync(
  new URL('../.claude/workflows/factory-stage.js', import.meta.url),
  'utf8',
).replace('export const meta', 'const meta')

// a workflow body is an async function body with `args`, `agent`, `phase` and `log` in scope
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor

/** The one agent call the factory-stage workflow makes for `args`. */
export async function stageCall(args: Record<string, unknown>): Promise<StageCall> {
  let call: StageCall | undefined
  const agent = async (prompt: string, opts: { agentType?: string; schema?: unknown }) => {
    call = {
      ...(opts.agentType && { agentType: opts.agentType }),
      prompt:
        `${prompt}\n\nEnd the run by returning only one JSON object, with no prose around it, ` +
        `that matches this JSON Schema:\n${JSON.stringify(opts.schema, null, 2)}`,
    }
    return undefined
  }
  const body = new AsyncFunction('args', 'agent', 'phase', 'log', SOURCE)
  await body(
    args,
    agent,
    () => {},
    () => {},
  )
  if (!call) throw new Error(`factory-stage made no agent call for ${JSON.stringify(args)}`)
  return call
}

/**
 * `args` with the `fix` that `next` gives for `stage` over the repo at `root`, when `stage` is what
 * comes next and the args give none.
 */
export function withFix(args: Record<string, unknown>, root: string): Record<string, unknown> {
  const { stage, name } = args
  if (args.fix || typeof name !== 'string' || !/^[A-Z][A-Za-z0-9]*$/.test(name)) return args
  const env: Env = { root, run: () => ({ ok: true, output: '' }), now: () => '' }
  const n = next(loadPipeline(env, name), env)
  return 'run' in n && n.run === stage && n.fix ? { ...args, fix: n.fix } : args
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const args = JSON.parse(process.argv[2] ?? '{}')
    const call = await stageCall(withFix(args, typeof args.dir === 'string' ? args.dir : '.'))
    process.stdout.write(`${JSON.stringify(call, null, 2)}\n`)
  } catch (e) {
    process.stderr.write(`${(e as Error).message}\n`)
    process.exit(1)
  }
}
