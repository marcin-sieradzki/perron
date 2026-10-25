// A stage of the component loop as one plain agent call, for an orchestrator that has no Workflow
// tool, such as a batch slot running as a subagent. It runs .claude/workflows/factory-stage.js
// with a stand-in for `agent` and prints the call that workflow would make: the agent type, when
// it names one, and the prompt, ending with the JSON the agent returns, from the workflow's schema.
// A rerun's `fix`, when the args leave it out, comes from `next` over the pipeline in `dir` (or the
// current directory), before or after the stage's `begin`, so a send-back's build is told what to fix,
// with its `answers` too when the run that was sent back asked first. A review round after the
// first gets `since` the same way: the commit the round before it reviewed.
// With --prompt it prints the prompt alone, as raw text, to hand to the agent as it is; the agent
// type is review's alone, `component-reviewer`.
// With --result it reads the agent's reply from a file and prints its JSON, parsed past the prose,
// fences and stray backslashes an agent leaves around it; with --review too, it writes the result's
// `review` to that file, formatted by Prettier, as the factory skill's step 4 does.
// Usage: node scripts/factory-stage.ts [--prompt] '{"stage":"build","name":"Chip","dir":"…","port":6011}'
//        node scripts/factory-stage.ts --result <reply file> [--review components/<name>/review.md]
import { readFileSync, writeFileSync } from 'node:fs'
import { format, resolveConfig } from 'prettier'
import { fixFor, loadPipeline, next, STAGES, type Env, type Stage } from './lib/pipeline.ts'

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
 * comes next and the args give none, `answers` or not: a rerun after the build's questions still
 * makes the fix its asking run was given, such as a review's findings. A review round after the
 * first gets `since` too, the commit the round before it reviewed, when the args give none.
 */
export function withFix(args: Record<string, unknown>, root: string): Record<string, unknown> {
  const { stage, name } = args
  if (typeof name !== 'string' || !/^[A-Z][A-Za-z0-9]*$/.test(name)) return args
  if (!STAGES.includes(stage as Stage)) return args
  const env: Env = { root, run: () => ({ ok: true, output: '' }), now: () => '' }
  const p = loadPipeline(env, name)
  const fix = args.fix ? undefined : fixFor(p, stage as Stage, env)
  const was = stage === 'review' && !args.since ? next(p, env) : undefined
  const since = was && 'run' in was && was.run === 'review' ? was.since : undefined
  return { ...args, ...(fix && { fix }), ...(since && { since }) }
}

/** The escapes JSON allows after a backslash. */
const ESCAPES = new Set(['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u'])

/**
 * `text` as JSON, or, when JSON refuses it, with its strings mended: a backslash JSON doesn't allow,
 * such as the `\`` a reviewer writes before a Markdown backtick, stands for the character after
 * it, and a raw line break for `\n`, so the review's words come through unchanged. A text that
 * still fails throws JSON.parse's own error.
 */
function lenient(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    // mend the strings and parse again
  }
  let mended = ''
  let inString = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (!inString) {
      if (c === '"') inString = true
      mended += c
    } else if (c === '\\') {
      const after = text[i + 1] ?? ''
      mended += ESCAPES.has(after) ? c + after : after === '\n' ? '\\n' : after
      i++
    } else if (c === '"') {
      inString = false
      mended += c
    } else mended += c === '\n' ? '\\n' : c === '\r' ? '' : c === '\t' ? '\\t' : c
  }
  return JSON.parse(mended)
}

/**
 * The text from the `{` at `start` to the `}` that closes it, braces inside strings left out, or
 * nothing when none closes it.
 */
function closed(reply: string, start: number) {
  let depth = 0
  let inString = false
  for (let i = start; i < reply.length; i++) {
    const c = reply[i]
    if (inString) {
      if (c === '\\') i++
      else if (c === '"') inString = false
    } else if (c === '"') inString = true
    else if (c === '{') depth++
    else if (c === '}' && --depth === 0) return reply.slice(start, i + 1)
  }
  return undefined
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * An agent's reply as the stage's result. Its candidates, in order: each fenced `json` block, then
 * each object from a `{` to the `}` that closes it, so a brace in the prose before or after the
 * JSON, or inside a string of it, is left out. The first that parses (see `lenient`) and holds the
 * stage's `outcome` is the result; with none, the text from the first `{` to the last `}`.
 */
export function parseResult(reply: string): Record<string, unknown> {
  const first = reply.indexOf('{')
  const last = reply.lastIndexOf('}')
  if (first < 0 || last < first) throw new Error('the reply holds no JSON object')
  const fenced = [...reply.matchAll(/^```json[ \t]*\n([\s\S]*?)\n```[ \t]*$/gm)].map((m) => m[1])
  const starts = [...reply.matchAll(/\{/g)].map((m) => m.index)
  for (const text of [...fenced, ...starts]) {
    const candidate = typeof text === 'number' ? closed(reply, text) : text
    if (!candidate) continue
    try {
      const value = lenient(candidate)
      if (isObject(value) && 'outcome' in value) return value
    } catch {
      // not the result: try the next
    }
  }
  const value = lenient(reply.slice(first, last + 1))
  if (!isObject(value)) throw new Error('the reply holds no JSON object')
  return value
}

/**
 * Writes a review round's result, its `review` text unchanged, to `file`, formatted as Prettier
 * formats the repo's Markdown, so `npm run check` passes on it.
 */
export async function writeReview(result: Record<string, unknown>, file: string) {
  if (typeof result.review !== 'string' || !result.review.trim())
    throw new Error('the result holds no review text')
  const config = (await resolveConfig(file)) ?? {}
  writeFileSync(file, await format(result.review, { ...config, filepath: file }))
}

/** What the command prints for `call`: the JSON of the call, or with `prompt` its prompt alone. */
export const printed = (call: StageCall, prompt = false) =>
  prompt ? `${call.prompt}\n` : `${JSON.stringify(call, null, 2)}\n`

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const argv = process.argv.slice(2)
    const at = (flag: string) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : undefined)
    const reply = at('--result')
    if (reply !== undefined) {
      const result = parseResult(readFileSync(reply, 'utf8'))
      const review = at('--review')
      if (review) await writeReview(result, review)
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
      process.exit(0)
    }
    const prompt = argv.includes('--prompt')
    const args = JSON.parse(argv.find((a) => a !== '--prompt') ?? '{}')
    const call = await stageCall(withFix(args, typeof args.dir === 'string' ? args.dir : '.'))
    process.stdout.write(printed(call, prompt))
  } catch (e) {
    process.stderr.write(`${(e as Error).message}\n`)
    process.exit(1)
  }
}
