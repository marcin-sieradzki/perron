import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as prettier from 'prettier'
import { describe, expect, it } from 'vitest'
import { CONTRACT } from '../checks/lib.ts'
import { readPropRules } from '../checks/props.ts'
import { parsePipeline, reviewFindings, serializePipeline, specProblems } from './pipeline.ts'

const root = join(import.meta.dirname, '../..')
const template = readFileSync(join(root, 'docs/components/TEMPLATE.md'), 'utf8')

/** A spec with every template section filled in a line. */
const filled = (name = 'Swatch', extra = '') =>
  [
    `# ${name}`,
    '',
    'A swatch shows one colour.',
    '',
    ...[...template.matchAll(/^## (.+)$/gm)].map((m) => `## ${m[1]}\n\nFilled.\n`),
    extra,
  ].join('\n')

describe('specProblems', () => {
  it('passes a spec with every template section, in order, and nothing left to fill', () => {
    expect(specProblems(filled(), template, 'Swatch')).toEqual({ pending: 0, problems: [] })
  })

  it('counts each [PENDING] question left in the spec', () => {
    const spec = filled(
      'Swatch',
      '[PENDING] Which tone is the default?\n\n[PENDING] Is it a button?',
    )
    expect(specProblems(spec, template, 'Swatch').pending).toBe(2)
  })

  it("does not count the template's own mention of [PENDING] in a code span", () => {
    const spec = filled('Swatch', 'A value no token gives is `[PENDING] needs a token for <what>`.')
    expect(specProblems(spec, template, 'Swatch')).toEqual({ pending: 0, problems: [] })
  })

  it('names an answer left as its question, or under an Answered label', () => {
    const spec = filled(
      'Swatch',
      [
        'Answered yes, the recommended answer: Does it take a `tone`? It reads the theme.',
        'Does it take a `size`? Recommended: no.',
        'Answered (recommended): it takes no `size`.',
        'It takes a `tone`, since it reads the theme.',
      ].join('\n\n'),
    )
    const lines = spec.split('\n')
    const at = (start: string) => lines.findIndex((l) => l.startsWith(start)) + 1
    expect(specProblems(spec, template, 'Swatch').problems).toEqual(
      [at('Answered yes'), at('Does it'), at('Answered (')].map((n) =>
        expect.stringMatching(new RegExp(`^has an answer left .* at line ${n};`)),
      ),
    )
  })

  it('names a missing template section', () => {
    const spec = filled().replace('## Owned strings', '## Strings')
    expect(specProblems(spec, template, 'Swatch').problems).toContain(
      'has no "## Owned strings" section',
    )
  })

  it('names a section out of the template order', () => {
    const spec = filled()
      .replace('## Anatomy', '## TEMP')
      .replace('## Props', '## Anatomy')
      .replace('## TEMP', '## Props')
    expect(specProblems(spec, template, 'Swatch').problems).toEqual([
      'has its sections out of the template order (Props before Anatomy)',
    ])
  })

  it("names a Props row for a name the contract's Names from other libraries bans", () => {
    const spec = filled().replace(
      '## Props\n\nFilled.\n',
      '## Props\n\n| Name | Type |\n| --- | --- |\n| `tone` | `string` |\n| `state` | `string` |\n',
    )
    expect(specProblems(spec, template, 'Swatch', { state: 'CSS states' }).problems).toEqual([
      'has a Props row for `state`, a name the contract\'s "Names from other libraries" bans; use CSS states',
    ])
  })

  it('names a template placeholder left unfilled', () => {
    const spec = filled('Swatch', '| `root` | `<what the root is>` |')
    expect(specProblems(spec, template, 'Swatch').problems).toEqual([
      'still has the placeholder <what the root is>',
    ])
  })

  it('names a placeholder outside a code span, or in a code span kept from the template', () => {
    const spec = filled('Swatch', 'Penpot page `Components/<Name>`, `pn-<Name>`. Holds <what>.')
    expect(specProblems(spec, template, 'Swatch').problems).toEqual([
      'still has the placeholder <Name>',
      'still has the placeholder <what>',
    ])
  })

  it('takes angle brackets in a [PENDING] question or in code as text, not a placeholder', () => {
    const spec = filled(
      'Swatch',
      [
        "[PENDING] Does `[data-delay='<value>']` need a token for <what> it shows?",
        '',
        "| `root` | rest | `color` | `[data-tone='<value>']` |",
      ].join('\n'),
    )
    expect(specProblems(spec, template, 'Swatch')).toEqual({ pending: 1, problems: [] })
  })

  it("takes prose that names a template slot in a code span, such as the contract's `<key>Label`, as text", () => {
    const spec = filled(
      'Swatch',
      [
        "`swatchLabel` is the contract's `<key>Label` for the owned string `swatch`.",
        '',
        '<!-- run notes -->',
        '',
        'The design is deferred.',
      ].join('\n'),
    )
    expect(specProblems(spec, template, 'Swatch')).toEqual({ pending: 0, problems: [] })
    const row = filled('Swatch', '| `<key>Label` | `string` |')
    expect(specProblems(row, template, 'Swatch').problems).toEqual([
      'still has the placeholder <key>',
    ])
  })

  it("names a spec still headed with the template's title", () => {
    expect(specProblems(filled('Spec template'), template, 'Swatch').problems).toEqual([
      'starts with "# Spec template", not "# Swatch"',
    ])
  })
  it('passes every spec in the repo, so a merged spec is one a brief may end on', () => {
    const banned = readPropRules(readFileSync(join(root, CONTRACT), 'utf8')).banned
    const specs = ['components', 'patterns'].flatMap((dir) =>
      readdirSync(join(root, 'docs', dir))
        .filter((f) => f.endsWith('.md') && f !== 'README.md' && f !== 'TEMPLATE.md')
        .map((f) => `docs/${dir}/${f}`),
    )
    for (const f of specs) {
      const spec = readFileSync(join(root, f), 'utf8')
      const name = /^# (.+)$/m.exec(spec)?.[1] ?? ''
      expect({ f, ...specProblems(spec, template, name, banned) }).toEqual({
        f,
        pending: 0,
        problems: [],
      })
    }
  })
})

describe('reviewFindings', () => {
  const review = (body: string, round = 1) => `# Review: Swatch, round ${round}\n\n${body}`

  it('counts findings by their P-level prefix', () => {
    const text = review(
      '## P1\n\n- **P1-1.** `a.tsx:1` Wrong.\n- **P1-2.** `a.tsx:2` Wrong.\n\n## P2\n\nNone.\n\n## P3\n\n- **P3-1.** `a.css:3` A note.\n',
    )
    expect(reviewFindings(text, 'Swatch', 1)).toEqual({ p1: 2, p2: 0, p3: 1, problems: [] })
  })

  it('names a review of another round, so a stale review.md never counts', () => {
    const text = review('## P1\n\nNone.\n\n## P2\n\nNone.\n\n## P3\n\nNone.\n', 1)
    expect(reviewFindings(text, 'Swatch', 2).problems).toEqual([
      'is headed "# Review: Swatch, round 1", not "# Review: Swatch, round 2"',
    ])
  })

  it('names a missing level, and a level that is neither findings nor None.', () => {
    const text = review('## P1\n\nNone.\n\n## P2\n\nLooks fine.\n')
    expect(reviewFindings(text, 'Swatch', 1).problems).toEqual([
      'has a "## P2" section that lists no finding and does not say None.',
      'has no "## P3" section',
    ])
  })
})

describe('serializePipeline', () => {
  const pipeline = {
    component: 'Swatch',
    layer: 'component' as const,
    approval: { readBack: 'a'.repeat(64), at: '2026-10-24T10:00:00.000Z' },
    needsHuman: { stage: 'build' as const, reason: 'npm run check failed: lint: a "quoted" thing' },
    stages: {
      design: {
        status: 'done' as const,
        started: '2026-10-24T09:00:00.000Z',
        ended: '2026-10-24T09:30:00.000Z',
      },
      build: { status: 'failed' as const, runs: 2, failing: "it's red: ".repeat(20) },
      review: { rounds: 1, sentBack: 1, findings: { p1: 1, p2: 0, p3: 2 } },
    },
  }

  it('writes YAML that reads back to the same pipeline', () => {
    expect(parsePipeline(serializePipeline(pipeline))).toEqual(pipeline)
  })

  it("writes YAML the way the repo's prettier config formats it", async () => {
    const text = serializePipeline(pipeline)
    const options = await prettier.resolveConfig(join(root, 'components/swatch/pipeline.yaml'))
    expect(await prettier.format(text, { ...options, parser: 'yaml' })).toBe(text)
  })
})
