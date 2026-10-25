// A command in the data family with the site's copy button beside it, which says the result too.
import { CopyButton } from '@/components/site/CopyButton.tsx'

export interface CopyCommandProps {
  command: string
}

export function CopyCommand({ command }: CopyCommandProps) {
  return (
    <span className="home-command">
      <code className="home-command-text">{command}</code>
      <CopyButton text={command} label="Copy the command" className="home-command-copy" />
    </span>
  )
}
