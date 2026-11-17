// The install strip: the import line, and what to ask the Perron MCP about the entry, its
// get_component contract.
import type { RegistryEntry } from '../../lib/registry.ts'
import { agentCalls, importLine } from '../../lib/spec.ts'
import { ScrollFrame } from '../site/ScrollFrame.tsx'

export function InstallStrip({ entry }: { entry: RegistryEntry }) {
  return (
    <section id="install" className="spec-section spec-panel glass spec-install">
      <div className="spec-install-part">
        <h2 className="spec-install-label">Use it</h2>
        <ScrollFrame as="code" className="spec-code" label="Import line">
          {importLine(entry)}
        </ScrollFrame>
      </div>
      <div className="spec-install-part">
        <h2 className="spec-install-label">Ask your agent</h2>
        {agentCalls(entry).map((call) => (
          <ScrollFrame as="code" key={call} className="spec-code" label="Agent call">
            {call}
          </ScrollFrame>
        ))}
      </div>
    </section>
  )
}
