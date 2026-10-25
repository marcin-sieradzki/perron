'use client'
// A command in the data family with Perron's IconButton to copy it. The result shows beside the
// button in a status region, so screen readers hear it too, and clears after a few seconds.
import { IconButton } from '@mylder/perron'
import { useEffect, useState, type ReactNode } from 'react'

type Result = 'idle' | 'copied' | 'failed'

const STATUS: Record<Result, string> = {
  idle: '',
  copied: 'Copied',
  failed: 'Could not copy: select the command instead',
}

/** How long the result stays before the status clears, in ms: long enough to read it. */
const SHOWN_FOR = 4000

export interface CopyCommandProps {
  command: string
  /** The icon at rest and the icon once copied, each from the server */
  copyIcon: ReactNode
  doneIcon: ReactNode
}

export function CopyCommand({ command, copyIcon, doneIcon }: CopyCommandProps) {
  const [result, setResult] = useState<Result>('idle')

  useEffect(() => {
    if (result === 'idle') return
    const timer = setTimeout(() => setResult('idle'), SHOWN_FOR)
    return () => clearTimeout(timer)
  }, [result])

  const copy = () => {
    // the clipboard is there only in a secure context
    if (!navigator.clipboard) return setResult('failed')
    navigator.clipboard.writeText(command).then(
      () => setResult('copied'),
      () => setResult('failed'),
    )
  }

  return (
    <span className="home-command">
      <code className="home-command-text">{command}</code>
      <IconButton label="Copy the command" onClick={copy} className="home-command-copy">
        {result === 'copied' ? doneIcon : copyIcon}
      </IconButton>
      <span role="status" className="home-command-status">
        {STATUS[result]}
      </span>
    </span>
  )
}
