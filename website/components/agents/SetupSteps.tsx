// The MCP server's setup from its readme, as numbered cards: each step's words from the readme
// above its command or config, which the reader copies with one button.
import { Markdown } from '@/components/site/Markdown.tsx'
import { MCP_README, type Segment } from '../../lib/mcp.ts'
import { CodeBlock } from './CodeBlock.tsx'
import './agents.css'

/** The copy button's label for a fence's language: what the reader copies. */
export function copyLabel(lang: string) {
  if (['sh', 'bash', 'shell', 'console'].includes(lang)) return 'Copy the command'
  if (lang === 'json') return 'Copy the config'
  return 'Copy the code'
}

/**
 * A JSON config laid out on several lines, as a reader pastes it, with a list of plain values kept
 * on one line; any other code as it is.
 */
function shown({ lang, text }: { lang: string; text: string }) {
  if (lang !== 'json') return text
  try {
    return JSON.stringify(JSON.parse(text), null, 2).replace(
      /\[\s+([^[\]{}]*?)\s+\]/g,
      (_, items: string) => `[${items.replace(/,\s+/g, ', ')}]`,
    )
  } catch {
    return text
  }
}

export interface SetupStepsProps {
  steps: Segment[]
  /** Each card's heading, in order; a step past the last is called by its number */
  headings: string[]
  /** The file the steps come from, which their links start from */
  path?: string
}

export function SetupSteps({ steps, headings, path = MCP_README }: SetupStepsProps) {
  return (
    <ol className="agents-cards" role="list">
      {steps.map((step, i) => (
        <li key={i} className="agents-card">
          <h3 className="agents-step">
            <span className="agents-step-number" aria-hidden="true">
              {i + 1}
            </span>
            {headings[i] ?? `Step ${i + 1}`}
          </h3>
          {step.prose ? (
            <p className="agents-note">
              <Markdown source={step.prose} path={path} inline />
            </p>
          ) : null}
          {step.code ? (
            <CodeBlock code={shown(step.code)} copyLabel={copyLabel(step.code.lang)} />
          ) : null}
        </li>
      ))}
    </ol>
  )
}
