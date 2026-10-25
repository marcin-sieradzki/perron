// "Use a pattern": patterns have their own entry point, @mylder/perron/patterns (ADR 0007), and
// take Mylder's data. The example is the DisruptionCard the map screen shows, from the same sample.
import { DISRUPTION } from '@/previews/patterns/samples.ts'

/** The entry point, as the package's exports name it. */
const ENTRY = '@mylder/perron/patterns'

const Keyword = ({ children }: { children: string }) => (
  <span className="patterns-code-keyword">{children}</span>
)

export function UsePattern() {
  const lines = DISRUPTION.lines.map((l) => `{ line: '${l.line}', name: '${l.name}' }`).join(', ')
  return (
    <section aria-labelledby="use" className="patterns-use">
      <div className="patterns-use-text">
        <h2 id="use" className="patterns-heading">
          Use a pattern
        </h2>
        <p className="patterns-use-lead">
          Patterns have their own entry point. Pass Mylder&apos;s data; the pattern brings the words
          for the kind of disruption from the reader&apos;s language.
        </p>
      </div>
      {/* a Tab stop, so the example scrolls sideways from the keyboard on a narrow screen */}
      <pre className="patterns-code" tabIndex={0}>
        <Keyword>import</Keyword> {'{ DisruptionCard }'} <Keyword>from</Keyword> &apos;{ENTRY}&apos;
        {'\n\n<'}
        <Keyword>DisruptionCard</Keyword>
        {`\n  severity="${DISRUPTION.severity}"`}
        {`\n  lines={[${lines}]}`}
        {`\n  title="${DISRUPTION.title}"`}
        {`\n>\n  ${DISRUPTION.children}\n</`}
        <Keyword>DisruptionCard</Keyword>
        {'>'}
      </pre>
    </section>
  )
}
