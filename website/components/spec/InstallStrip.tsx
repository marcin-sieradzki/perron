// The install strip: the import line, and what to ask the Perron MCP about the entry, its Base UI
// reference or, with no Base UI part, its docs.
import type { RegistryEntry } from '../../lib/registry.ts'
import { agentCalls, importLine } from '../../lib/spec.ts'

export function InstallStrip({ entry }: { entry: RegistryEntry }) {
  return (
    <section id="install" className="spec-section spec-panel glass spec-install">
      <div className="spec-install-part">
        <h2 className="spec-install-label">Use it</h2>
        <code className="spec-code">{importLine(entry)}</code>
      </div>
      <div className="spec-install-part">
        <h2 className="spec-install-label">Ask your agent</h2>
        {agentCalls(entry).map((call) => (
          <code key={call} className="spec-code">
            {call}
          </code>
        ))}
      </div>
    </section>
  )
}
