// One stage of the component loop, run in a fresh context. The `factory` skill starts it with
// `{ stage, name }`, plus `round` for review and `answers` for a rerun after the stage's questions,
// then records the outcome with `npm run factory -- end`: it alone writes the pipeline file. Each
// stage reads its own skill, or for review runs as the component-reviewer agent, so it never sees
// another stage's reasoning.
export const meta = {
  name: 'factory-stage',
  description:
    'Run one stage of the component loop (design, brief, build, review, docs or visual) for one component',
  whenToUse: 'Started by the factory skill, one stage at a time; not run by hand',
  phases: [{ title: 'Stage' }],
}

const SKILLS = {
  design: 'component-design',
  brief: 'component-brief',
  build: 'component-build',
  docs: 'component-docs',
}

const OUTCOME = {
  type: 'object',
  properties: {
    outcome: { type: 'string', enum: ['done', 'failed', 'pending'] },
    summary: { type: 'string', description: 'What the run did, in a few sentences' },
    questions: {
      type: 'array',
      items: { type: 'string' },
      description: 'With pending: each question, numbered, with its recommended answer',
    },
    failing: {
      type: 'string',
      description: 'With failed: the check or input that stopped it, and why',
    },
  },
  required: ['outcome', 'summary'],
}

const REVIEW = {
  type: 'object',
  properties: {
    review: {
      type: 'string',
      description: "review.md's whole text, in the format the agent gives",
    },
  },
  required: ['review'],
}

const { stage, name, round, answers } = args ?? {}
const answered = answers ? ` The maintainer answered your last run's questions: ${answers}` : ''
if (!name || !(stage in SKILLS || stage === 'review' || stage === 'visual'))
  throw new Error(`factory-stage needs { stage, name }; got ${JSON.stringify(args)}`)

phase('Stage')
const label = `${stage}:${name}`

if (stage === 'review') {
  const result = await agent(
    `Review ${name}, round ${round ?? 1}. Return review.md's whole text as \`review\`.`,
    { label, phase: 'Stage', agentType: 'component-reviewer', schema: REVIEW },
  )
  return (
    result && {
      outcome: 'done',
      summary: `Review round ${round ?? 1} written`,
      review: result.review,
    }
  )
}

if (stage === 'visual') {
  return await agent(
    `Run \`npm run visual -- ${name}\` in the repo root and read the report it writes under components/. ` +
      'Return `done` when the report passes, `failed` with the parts off by more than 1 px or off their tokens when it fails, and `failed` with the error when the script cannot run. Change no file.',
    { label, phase: 'Stage', schema: OUTCOME },
  )
}

return await agent(
  `Read .claude/skills/${SKILLS[stage]}/SKILL.md and follow it for ${name}, to its Returns section. ` +
    'You run in a fresh context that the factory started: nobody answers questions mid-run, so return them. ' +
    'Leave components/<name>/pipeline.yaml alone; the factory writes it.' +
    answered,
  { label, phase: 'Stage', schema: OUTCOME },
)
