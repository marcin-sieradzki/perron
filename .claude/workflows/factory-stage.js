// One stage of the component loop, run in a fresh context. The `factory` skill starts it with
// `{ stage, name }`, plus `round` for review (and `since`, the commit the round before reviewed), `answers` for a rerun after the stage's questions, and
// `fix` for a rerun after a send-back or a failed run (the `fix` that `npm run factory -- next`
// gives: the reason, with a review's P1 and P2 findings word for word), then records the outcome with `npm run factory -- end`, the only writer of the pipeline file.
// Each stage reads its own skill, or for review runs as the component-reviewer agent, so it never
// sees another stage's reasoning. The visual stage is one command, which the factory skill runs
// itself. A batch that runs components side by side passes `dir`, the component's worktree, and
// `port`, its Storybook port, so parallel runs never share files or a Storybook.
export const meta = {
  name: 'factory-stage',
  description:
    'Run one stage of the component loop (design, brief, build, review or docs) for one component',
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
    direction: {
      type: 'array',
      items: { type: 'string' },
      description:
        "Every Direction finding of the run that the pipeline file's notes don't already hold, one line each, for the PR; whatever the outcome",
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

const { stage, name, round, since, answers, fix, dir, port } = args ?? {}
const answered = answers
  ? ` Answers to your last run's questions (the maintainer's, or in an unattended run their recommended answers): ${answers}`
  : ''
const rerun = fix
  ? ` This run is a rerun, and its first work is what the factory names here, each at the file and line it gives, before the skill's other steps:\n${fix}\n`
  : ''
if (dir && !port) throw new Error(`factory-stage needs a port with dir ${dir}`)
const worktreeNote = dir
  ? `Work only in the worktree ${dir}: run every command from it, with STORYBOOK_PORT=${port} exported in each shell, and read and write files only under it; give the Perron MCP's tools \`dir: '${dir}'\`, since the server reads the main checkout otherwise. Every repo path below is relative to it. `
  : ''
if (!name || !(stage in SKILLS || stage === 'review'))
  throw new Error(`factory-stage needs { stage, name }; got ${JSON.stringify(args)}`)
const kebab = name
  .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
  .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
  .toLowerCase()

phase('Stage')
const label = `${stage}:${name}`

if (stage === 'review') {
  const result = await agent(
    `${worktreeNote}Review ${name}, round ${round ?? 1}.` +
      (since
        ? ` The round before reviewed commit ${since}: in this round a P1 or P2 sits on a line \`git diff ${since}\` changes in the branch's own files, is a regression that change causes, is a finding of that round still unfixed, or is a red gate; any other gap in code that round already read is a P3 (the "Later rounds" section of your instructions).`
        : '') +
      ` Return review.md's whole text as \`review\`.`,
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

return await agent(
  `${worktreeNote}Read .claude/skills/${SKILLS[stage]}/SKILL.md and follow it for ${name}, to its Returns section. ` +
    'You run in a fresh context that the factory started: nobody answers questions mid-run, so return them. ' +
    `Your outcome is recorded by the factory in components/${kebab}/pipeline.yaml, which it alone writes. ` +
    'Its `notes` hold the Direction findings earlier runs returned: return in `direction` only the findings they do not already say.' +
    rerun +
    answered,
  { label, phase: 'Stage', schema: OUTCOME },
)
