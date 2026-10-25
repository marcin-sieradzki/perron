// The parts of the Foundations index around its tiles, each read from the Contents page or the
// token data: the token count beside the title, the brand's three values, and "Using the tokens"
// with an example written in real custom property names.
import { Markdown } from '@/components/site/Markdown.tsx'
import { PACKAGES, readPackage, readRepoJson } from '@/lib/repo.ts'
import { cssVar, readResolvedTokens, readToken, tokenCount } from '@/lib/tokens.ts'
import { brandValues, CONTENTS, usingTheTokens } from './data.ts'
import { Rich } from './Rich.tsx'

/** The resolver that names the format the tokens follow. */
const RESOLVER = 'packages/perron/tokens/perron.resolver.json'

/** The format version, the token count and the themes, beside the index's title. */
export function TokenMeta() {
  const { version } = readRepoJson<{ version: string }>(RESOLVER)
  const themes = Object.keys(readResolvedTokens().themes)
  return (
    <span className="fd-meta">
      <span className="fd-meta-format">DTCG {version}</span>
      {tokenCount()} tokens, {themes.join(' and ')}
    </span>
  )
}

/** The brand's values, from the Contents page's "The brand". */
export function BrandValues() {
  return (
    <section aria-label="The brand" className="fd-brand">
      {brandValues().map((v) => (
        <div key={v.name} className="fd-brand-value glass">
          <p className="fd-brand-name">{v.name}</p>
          <p className="fd-brand-text">
            <Rich text={v.text} />
          </p>
        </div>
      ))}
    </section>
  )
}

/** A token's custom property, checked against the token data so a rename shows at build time. */
function property(name: string) {
  if (!readToken(name)) throw new Error(`No token ${name} for the example`)
  return cssVar(name)
}

/** The Contents page's "Using the tokens", with a stylesheet that uses three of them. */
export function UsingTheTokens() {
  const { name } = readPackage(PACKAGES.perron)
  return (
    <section aria-labelledby="fd-using" className="fd-using glass">
      <div className="fd-using-text">
        <h2 id="fd-using" className="fd-section-title">
          Using the tokens
        </h2>
        <Markdown source={usingTheTokens()} path={CONTENTS} />
      </div>
      <pre className="fd-code" tabIndex={0} aria-label="Example stylesheet">
        <code>
          <span className="fd-code-quiet">{'/* once, at the app root */'}</span>
          {`\nimport '${name}/perron.css'\n\n`}
          <span className="fd-code-strong">.departure</span>
          {` {\n  color: ${property('color.text.primary')};\n  padding: ${property('space.300')};\n  font: ${property('typography.body')};\n}`}
        </code>
      </pre>
    </section>
  )
}
