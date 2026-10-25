// One tool of the MCP server, as the server lists it: its name, title, description and inputs, and
// beside them the example call and the server's answer, set to read and cut for the page with a
// note saying how much, its raw text behind "Show the raw answer". A tool with no example yet
// shows its input schema instead.
import { Markdown } from '@/components/site/Markdown.tsx'
import {
  answerMarkdown,
  answerTokens,
  excerpt,
  type AnswerToken,
  type Tool,
} from '../../lib/mcp.ts'
import './agents.css'

/** Where the server's descriptions are written, which a relative link in one starts from. */
const SERVER = 'packages/mcp/src/server.ts'

/** A tool's anchor on the page: `list-tokens` for `list_tokens`. */
export const toolAnchor = (name: string) => name.replaceAll('_', '-')

const count = (n: number) => n.toLocaleString('en-GB')
const plural = (n: number, one: string, many: string) => `${count(n)} ${n === 1 ? one : many}`

/** `list_tokens`' answer as a table: each token with its value in each theme, a colour painted. */
function TokenTable({ tokens }: { tokens: AnswerToken[] }) {
  const themes = [...new Set(tokens.flatMap((t) => Object.keys(t.values)))]
  const themed = themes.length > 1
  return (
    <div className="scroll-x">
      <table className="agents-tokens">
        <thead>
          <tr>
            <th scope="col">Token</th>
            {themes.map((theme) => (
              <th key={theme} scope="col">
                {themed ? theme.charAt(0).toUpperCase() + theme.slice(1) : 'Value'}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tokens.map((t) => (
            <tr key={t.name}>
              <th scope="row">{t.name}</th>
              {themes.map((theme) => {
                const value = t.values[theme]
                return (
                  <td key={theme}>
                    {value ? (
                      <span className="agents-token-value">
                        {t.type === 'color' ? (
                          <span
                            className="agents-swatch"
                            {...(themed ? { 'data-theme': theme } : {})}
                            style={{ background: `var(${t.cssVar})` }}
                          />
                        ) : null}
                        {value.alias ? value.alias.replace(/^palette\./, '') : value.css}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * The server's answer, set to read: a token table or the markdown it is, with the exact text the
 * agent receives one click away.
 */
function Answer({ text, isError }: { text: string; isError: boolean }) {
  const cut = excerpt(text)
  const tokens = isError ? undefined : answerTokens(cut.text)
  return (
    <div className="agents-tool-call-body">
      {isError ? <p className="agents-tool-error">The server answers with an error:</p> : null}
      {tokens ? (
        <TokenTable tokens={tokens} />
      ) : (
        <div className="agents-tool-reading">
          <Markdown source={answerMarkdown(cut.text)} path={SERVER} />
        </div>
      )}
      <details className="agents-tool-raw">
        <summary>Show the raw answer</summary>
        <pre className="agents-tool-answer">{cut.text}</pre>
      </details>
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
