// The factory's stage workflow, .claude/workflows/factory-stage.js, run with stand-ins for the
// Workflow tool's globals: each stage starts one agent on the right skill or agent type, and a
// stage it has no agent for is refused.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

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
})
