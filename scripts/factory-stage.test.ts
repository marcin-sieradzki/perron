// The factory's stage workflow, .claude/workflows/factory-stage.js, run with stand-ins for the
// Workflow tool's globals: each stage starts one agent on the right skill or agent type, and a
// stage it has no agent for is refused.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseResult, printed, stageCall, withFix, writeReview } from './factory-stage.ts'

interface Call {
  prompt: string
  opts: { agentType?: string; schema?: { properties: Record<string, unknown> } }
}

const SOURCE = readFileSync(
  new URL('../.claude/workflows/factory-stage.js', import.meta.url),
  'utf8',
).replace('export const meta', 'const meta')

// a workflow body is an async function body with `args`, `agent`, `phase` and `log` in scope
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor

async function run(args: unknown) {
  const calls: Call[] = []
  const agent = async (prompt: string, opts: Call['opts']) => {
    calls.push({ prompt, opts })
    return opts.agentType ? { review: '# Review: Chip, round 2' } : { outcome: 'done', summary: '' }
  }
  const body = new AsyncFunction('args', 'agent', 'phase', 'log', SOURCE)
  const result = await body(
    args,
    agent,
    () => {},
    () => {},
  )
  return { result, calls }
}

describe('factory-stage', () => {
  it.each([
    ['design', 'component-design'],
    ['brief', 'component-brief'],
    ['build', 'component-build'],
    ['docs', 'component-docs'],
  ])('runs %s from its skill, in one agent', async (stage, skill) => {
    const { result, calls } = await run({ stage, name: 'Chip' })
    expect(calls).toHaveLength(1)
    expect(calls[0].prompt).toContain(`.claude/skills/${skill}/SKILL.md`)
    expect(calls[0].prompt).toContain('Chip')
    expect(result).toMatchObject({ outcome: 'done' })
  })

  it('passes the answers to a stage run again after its questions, whoever gave them', async () => {
    const { calls } = await run({ stage: 'design', name: 'Chip', answers: '1. Yes' })
    expect(calls[0].prompt).toContain("Answers to your last run's questions")
    expect(calls[0].prompt).toContain('1. Yes')
    expect(calls[0].prompt).not.toContain('The maintainer answered')
  })

  it('scopes a later review round to what changed since the commit the round before read', async () => {
    const { calls } = await run({ stage: 'review', name: 'Chip', round: 2, since: 'abc123' })
    expect(calls[0].prompt).toContain('reviewed commit abc123')
    expect(calls[0].prompt).toContain('`git diff abc123`')
    expect((await run({ stage: 'review', name: 'Chip' })).calls[0].prompt).not.toContain('since')
  })

  it("puts a rerun's fix first in its prompt", async () => {
    const { calls } = await run({ stage: 'build', name: 'Chip', fix: 'docs failed: Chip.tsx:4' })
    expect(calls[0].prompt).toMatch(/This run is a rerun[^\n]*:\ndocs failed: Chip\.tsx:4\n/)
    expect((await run({ stage: 'build', name: 'Chip' })).calls[0].prompt).not.toContain('rerun')
  })

  it('runs review as the reviewer agent and returns its review.md', async () => {
    const { result, calls } = await run({ stage: 'review', name: 'Chip', round: 2 })
    expect(calls[0].opts.agentType).toBe('component-reviewer')
    expect(calls[0].prompt).toContain('round 2')
    expect(result).toMatchObject({ outcome: 'done', review: '# Review: Chip, round 2' })
  })

  it('tells a stage where the factory records its outcome', async () => {
    const { calls } = await run({ stage: 'build', name: 'DatePicker' })
    expect(calls[0].prompt).toContain('components/date-picker/pipeline.yaml')
    expect(calls[0].prompt).toContain(
      'return in `direction` only the findings they do not already say',
    )
  })

  it('refuses visual, which the factory runs without an agent, a stage the loop does not have, or no name', async () => {
    await expect(run({ stage: 'visual', name: 'Chip' })).rejects.toThrow(/stage, name/)
    await expect(run({ stage: 'ship', name: 'Chip' })).rejects.toThrow(/stage, name/)
    await expect(run({ stage: 'build' })).rejects.toThrow(/stage, name/)
  })

  it('pins every agent to its worktree and Storybook port when a batch gives them', async () => {
    const { calls } = await run({ stage: 'build', name: 'Chip', dir: '/wt/chip', port: 6011 })
    expect(calls[0].prompt).toMatch(/^Work only in the worktree \/wt\/chip: .*STORYBOOK_PORT=6011/)
    // the Perron MCP runs from the main checkout, so its tools are told which project to read
    expect(calls[0].prompt).toContain("give the Perron MCP's tools `dir: '/wt/chip'`")
  })
})

describe('stageCall, for an orchestrator without the Workflow tool', () => {
  it("gives the workflow's prompt and agent type, ending with the JSON shape to return", async () => {
    const build = await stageCall({ stage: 'build', name: 'Chip', dir: '/wt/chip', port: 6011 })
    expect(build.agentType).toBeUndefined()
    expect(build.prompt).toMatch(/^Work only in the worktree \/wt\/chip: /)
    expect(build.prompt).toContain('.claude/skills/component-build/SKILL.md')
    expect(build.prompt).toMatch(/returning only one JSON object[\s\S]*"outcome"/)

    const review = await stageCall({ stage: 'review', name: 'Chip', round: 2 })
    expect(review.agentType).toBe('component-reviewer')
    expect(review.prompt).toMatch(/round 2[\s\S]*"review"/)
  })

  it('prints the call as JSON, or with --prompt the prompt alone as raw text', async () => {
    const build = await stageCall({ stage: 'build', name: 'Chip' })
    expect(JSON.parse(printed(build))).toEqual(build)
    expect(printed(build, true)).toBe(`${build.prompt}\n`)
  })

  it('refuses what the workflow refuses', async () => {
    await expect(stageCall({ stage: 'visual', name: 'Chip' })).rejects.toThrow(/stage, name/)
  })
})

describe('withFix, for a stage the factory sent back', () => {
  it("takes the fix from next over the worktree's pipeline when the args give none", () => {
    const root = mkdtempSync(join(tmpdir(), 'perron-stage-'))
    try {
      const write = (rel: string, text: string) => {
        mkdirSync(join(root, rel, '..'), { recursive: true })
        writeFileSync(join(root, rel), text)
      }
      write('packages/perron/components.json', '[]')
      write(
        'components/chip/pipeline.yaml',
        `component: Chip\nlayer: component\ndeferred:\n  at: x\nstages:\n  brief:\n    status: done\n  build:\n    failing: 'docs failed: Chip.tsx:4 has no JSDoc'\n`,
      )
      expect(withFix({ stage: 'build', name: 'Chip' }, root)).toEqual({
        stage: 'build',
        name: 'Chip',
        fix: 'docs failed: Chip.tsx:4 has no JSDoc',
      })
      expect(withFix({ stage: 'build', name: 'Chip', fix: 'given' }, root).fix).toBe('given')
      expect(withFix({ stage: 'review', name: 'Chip' }, root).fix).toBeUndefined()

      // after begin, as the factory skill's step 4 runs it, the fix comes from the running stage
      write(
        'components/chip/pipeline.yaml',
        `component: Chip\nlayer: component\ndeferred:\n  at: x\nstages:\n  brief:\n    status: done\n  build:\n    status: running\n    started: x\n    fix: 'docs failed: Chip.tsx:4 has no JSDoc'\n`,
      )
      expect(withFix({ stage: 'build', name: 'Chip' }, root).fix).toBe(
        'docs failed: Chip.tsx:4 has no JSDoc',
      )

      // a run sent back that asked first: its rerun with the answers still gets the fix
      write(
        'components/chip/pipeline.yaml',
        `component: Chip\nlayer: component\ndeferred:\n  at: x\nstages:\n  brief:\n    status: done\n  build:\n    status: pending\n    failing: '1. Which gap? Recommended: space.100.'\n    fix: 'review round 1 found 1 P2'\n`,
      )
      expect(
        withFix({ stage: 'build', name: 'Chip', answers: '1. space.100' }, root),
      ).toMatchObject({ answers: '1. space.100', fix: 'review round 1 found 1 P2' })

      // a review round after the first gets the commit the round before read, as `since`
      write(
        'components/chip/pipeline.yaml',
        `component: Chip\nlayer: component\ndeferred:\n  at: x\nstages:\n  brief:\n    status: done\n  build:\n    status: done\n  review:\n    rounds: 1\n    sentBack: 1\n    reviewed: ${'c'.repeat(40)}\n`,
      )
      expect(withFix({ stage: 'review', name: 'Chip' }, root)).toEqual({
        stage: 'review',
        name: 'Chip',
        since: 'c'.repeat(40),
      })
      expect(withFix({ stage: 'review', name: 'Chip', since: 'given' }, root).since).toBe('given')
    } finally {
      rmSync(root, { recursive: true })
    }
  })
  it("reads an agent's reply past its fences and the backslashes JSON doesn't allow", () => {
    const review = '# Review: Chip, round 1\n\n- **P2-1.** `Chip.tsx:4` A \\ stays.'
    const valid = JSON.stringify({ review })
    expect(parseResult(`Done.\n\`\`\`json\n${valid}\n\`\`\``)).toEqual({ review })
    // the reviewer escaped each backtick, \`, which JSON refuses, and broke a line in a string
    const loose = valid.replaceAll('`', '\\`').replace('\\n\\n', '\n\n')
    expect(() => JSON.parse(loose)).toThrow(/Bad (escaped|control) character/)
    expect(parseResult(loose)).toEqual({ review })
    expect(() => parseResult('no result')).toThrow('the reply holds no JSON object')
  })

  it("writes a review round's text to review.md as Prettier formats it", async () => {
    const dir = mkdtempSync(join(tmpdir(), 'factory-stage-'))
    try {
      const file = join(dir, 'review.md')
      await writeReview({ review: '# Review: Chip, round 1\n## P1\nNone.' }, file)
      expect(readFileSync(file, 'utf8')).toBe('# Review: Chip, round 1\n\n## P1\n\nNone.\n')
      await expect(writeReview({ outcome: 'done' }, file)).rejects.toThrow('no review text')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
