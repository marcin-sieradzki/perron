'use client'
// Copies a command or a config to the clipboard: Perron's IconButton, whose label and icon turn to
// "Copied" once the text is on the clipboard, said again by a status line for screen readers. It
// turns back when focus or the pointer leaves, so nothing changes on a timer.
import { IconButton } from '@mylder/perron'
import { useState } from 'react'
import { CopiedIcon, CopyIcon } from './icons.tsx'

export interface CopyButtonProps {
  /** The text the button copies, exactly as shown beside it */
  text: string
  /** What the button copies, as its label: "Copy the command" */
  label: string
}

type Copy = 'idle' | 'copied' | 'failed'

const SAID: Record<Copy, string> = {
  idle: '',
  copied: 'Copied',
  failed: 'Not copied: the browser blocked the clipboard. Select the text instead.',
}

export function CopyButton({ text, label }: CopyButtonProps) {
  const [state, setState] = useState<Copy>('idle')
  const copy = () =>
    navigator.clipboard.writeText(text).then(
      () => setState('copied'),
      () => setState('failed'),
    )
  const reset = () => setState('idle')
  return (
    <>
      <IconButton
        label={state === 'copied' ? 'Copied' : label}
        onClick={copy}
        onBlur={reset}
        onPointerLeave={reset}
      >
        {state === 'copied' ? <CopiedIcon /> : <CopyIcon />}
      </IconButton>
      <span role="status" className="agents-visually-hidden">
        {SAID[state]}
      </span>
    </>
  )
}
