// One tool of the MCP server, as the server lists it: its name, title, description and inputs, and
// beside them the example call and the server's answer, cut for the page with a note saying how
// much. A tool with no example yet shows its input schema instead.
import { Markdown } from '@/components/site/Markdown.tsx'
import { excerpt, type Tool } from '../../lib/mcp.ts'
import './agents.css'

/** Where the server's descriptions are written, which a relative link in one starts from. */
const SERVER = 'packages/mcp/src/server.ts'

/** A tool's anchor on the page: `list-tokens` for `list_tokens`. */
export const toolAnchor = (name: string) => name.replaceAll('_', '-')

const count = (n: number) => n.toLocaleString('en-GB')
const plural = (n: number, one: string, many: string) => `${count(n)} ${n === 1 ? one : many}`

function Answer({ text, isError }: { text: string; isError: boolean }) {
  const cut = excerpt(text)
  return (
    <div className="agents-tool-call-body">
      {isError ? <p className="agents-tool-error">The server answers with an error:</p> : null}
      <pre className="agents-tool-answer">{cut.text}</pre>
      {cut.cutChars ? (
        <p className="agents-tool-cut">
          Cut for this page: {plural(cut.cutLines, 'more line', 'more lines')},{' '}
          {plural(cut.cutChars, 'character', 'characters')}. The agent reads the whole answer.
        </p>
      ) : null}
    </div>
  )
}

export function ToolCard({ tool }: { tool: Tool }) {
  const { name, title, description, inputs, example, schema } = tool
  return (
    <article
      id={toolAnchor(name)}
      className="agents-tool"
      aria-labelledby={`${toolAnchor(name)}-h`}
    >
      <div className="agents-tool-about">
        <h3 id={`${toolAnchor(name)}-h`} className="agents-tool-name">
          <code>{name}</code>
        </h3>
        {title ? <p className="agents-tool-title">{title}</p> : null}
        <p className="agents-tool-description agents-prose">
          <Markdown source={description} path={SERVER} inline />
        </p>
        {inputs.length ? (
          <>
            <h4 className="agents-tool-inputs-title agents-overline">Inputs</h4>
            <dl className="agents-tool-inputs">
              {inputs.map((input) => (
                <div key={input.name} className="agents-tool-input">
                  <dt>
                    <code className="agents-tool-input-name">{input.name}</code>
                    <span className="agents-tool-input-type">{input.type}</span>
                    <span className="agents-tool-input-need">
                      {input.required ? 'required' : 'optional'}
                    </span>
                  </dt>
                  {input.description ? (
                    <dd>
                      <Markdown source={input.description} path={SERVER} inline />
                    </dd>
                  ) : null}
                </div>
              ))}
            </dl>
          </>
        ) : null}
      </div>
      <figure className="agents-tool-call">
        {example ? (
          <>
            <figcaption className="agents-tool-call-head">
              <code>{example.shown}</code>
            </figcaption>
            <Answer text={example.text} isError={example.isError} />
          </>
        ) : (
          <>
            <figcaption className="agents-tool-call-head">
              No example call yet. Its input schema, as the server lists it:
            </figcaption>
            <div className="agents-tool-call-body">
              <pre className="agents-tool-answer">{JSON.stringify(schema, null, 2)}</pre>
            </div>
          </>
        )}
      </figure>
    </article>
  )
}
