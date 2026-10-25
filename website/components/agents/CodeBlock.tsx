// A command or a config to copy: the code in the data role on an inset box, wrapped rather than
// scrolled, with a copy button that copies exactly what is shown.
import { CopyButton } from './CopyButton.tsx'
import './agents.css'

export interface CodeBlockProps {
  code: string
  /** The copy button's label, naming what it copies: "Copy the command" */
  copyLabel: string
}

export function CodeBlock({ code, copyLabel }: CodeBlockProps) {
  return (
    <div className="agents-code">
      <pre>
        <code>{code}</code>
      </pre>
      <CopyButton text={code} label={copyLabel} />
    </div>
  )
}
