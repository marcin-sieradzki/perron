// Get started: install @mylder/perron and load its stylesheet (the package's readme), use a first
// component, use the tokens (the "Using the tokens" section of the foundations' Contents page),
// and add the MCP server (its readme's setup). The words are the files', through Markdown; the
// page adds only the numbered frame around them, in the Agents page's layout.
import type { Metadata } from 'next'
import NextLink from 'next/link'
import { Fragment, type ReactNode } from 'react'
import { CodeBlock } from '@/components/agents/CodeBlock.tsx'
import { DocLayout } from '@/components/agents/DocLayout.tsx'
import { copyLabel, SetupSteps } from '@/components/agents/SetupSteps.tsx'
import { Button, Link } from '@/components/perron'
import { Markdown } from '@/components/site/Markdown.tsx'
import { PageHeader } from '@/components/site/PageHeader.tsx'
import { readDoc, stripTitle } from '../../lib/markdown.ts'
import { MCP_README, readSetup, sectionText, segments } from '../../lib/mcp.ts'
import { readRepoFile } from '../../lib/repo.ts'
import { siteHref } from '../../lib/routes.ts'

export const metadata: Metadata = { title: 'Get started' }

const README = 'packages/perron/README.md'
const CONTENTS = 'docs/foundations/README.md'

/** The first component in the step's code: the one the Button spec's own examples name. */
const FIRST = `import { Button } from '@mylder/perron'

export function StopActions() {
  return <Button>Show departures</Button>
}`

const STEPS = [
  { id: 'install', label: 'Install and load Perron' },
  { id: 'component', label: 'Use a first component' },
  { id: 'tokens', label: 'Use the tokens' },
  { id: 'mcp', label: 'Add the MCP server' },
] as const

function Step({ n, children }: { n: number; children: ReactNode }) {
  const { id, label } = STEPS[n]
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="agents-section">
      <h2 id={`${id}-h`} className="agents-step-title">
        <span className="agents-step-number" aria-hidden="true">
          {n + 1}
        </span>
        {label}
      </h2>
      {children}
    </section>
  )
}

export default function GetStartedPage() {
  const readme = readDoc(README)
  // the readme's first paragraph is the page's lead, so the step starts after it
  const install = stripTitle(readme.markdown).replace(/^[\s\S]*?\n\s*\n/, '')
  const tokens = sectionText(readRepoFile(CONTENTS), 'Using the tokens', CONTENTS)
  const setup = readSetup()

  return (
    <DocLayout
      route="/get-started"
      name="Get started"
      nav={[{ links: STEPS.map((s) => ({ label: s.label, href: `#${s.id}` })) }]}
    >
      <PageHeader
        title="Get started"
        lead={<Markdown source={readme.intro} path={README} inline />}
      />

      <Step n={0}>
        <div className="agents-card">
          {segments(install).map((s, i) => (
            <Fragment key={i}>
              {s.prose ? <Markdown source={s.prose} path={README} /> : null}
              {s.code ? <CodeBlock code={s.code.text} copyLabel={copyLabel(s.code.lang)} /> : null}
            </Fragment>
          ))}
        </div>
      </Step>

      <Step n={1}>
        <p className="agents-note">
          Inside the provider, import a component and use it. Its page lists its props, variants and
          states.
        </p>
        <div className="agents-card">
          <CodeBlock code={FIRST} copyLabel="Copy the code" />
          <div className="agents-preview">
            <Button>Show departures</Button>
          </div>
          <p className="agents-note">
            <Link render={<NextLink href={siteHref('/docs/components/button.md', README)} />}>
              Button
            </Link>{' '}
            and every other component are under{' '}
            <Link render={<NextLink href="/components" />}>Components</Link>.
          </p>
        </div>
      </Step>

      <Step n={2}>
        <div className="agents-card">
          <Markdown source={tokens} path={CONTENTS} />
        </div>
      </Step>

      <Step n={3}>
        <p className="agents-note">
          <Markdown source={setup.intro} path={MCP_README} inline />
        </p>
        <SetupSteps
          steps={setup.steps}
          headings={['Run the server', "Or add it to the project's .mcp.json"]}
        />
        <p className="agents-note">
          Every tool, with a real call and its answer, is on{' '}
          <Link render={<NextLink href="/agents" />}>Agents</Link>.
        </p>
      </Step>
    </DocLayout>
  )
}
