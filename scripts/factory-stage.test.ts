// The factory's stage workflow, .claude/workflows/factory-stage.js, run with stand-ins for the
// Workflow tool's globals: each stage starts one agent on the right skill or agent type, and a
// stage it has no agent for is refused.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { stageCall, withFix } from './factory-stage.ts'

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

  it('passes the answers to a stage run again after its questions', async () => {
    const { calls } = await run({ stage: 'design', name: 'Chip', answers: '1. Yes' })
    expect(calls[0].prompt).toContain('1. Yes')
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
  })

  it('refuses visual, which the factory runs without an agent, a stage the loop does not have, or no name', async () => {
    await expect(run({ stage: 'visual', name: 'Chip' })).rejects.toThrow(/stage, name/)
    await expect(run({ stage: 'ship', name: 'Chip' })).rejects.toThrow(/stage, name/)
    await expect(run({ stage: 'build' })).rejects.toThrow(/stage, name/)
  })

  it('pins every agent to its worktree and Storybook port when a batch gives them', async () => {
    const { calls } = await run({ stage: 'build', name: 'Chip', dir: '/wt/chip', port: 6011 })
    expect(calls[0].prompt).toMatch(/^Work only in the worktree \/wt\/chip: .*STORYBOOK_PORT=6011/)
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
    } finally {
      rmSync(root, { recursive: true })
    }
  })
})
