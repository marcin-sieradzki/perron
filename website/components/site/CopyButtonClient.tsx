'use client'
// The copy button's client part: Perron's IconButton, whose icon turns to the tick once the text is
// on the clipboard, said by a status line too: heard and not seen when copied, seen and heard when
// the browser refuses. The result clears after a few seconds, and a fresh press says it again.
import { IconButton } from '@mylder/perron'
import { useEffect, useState, type ReactNode } from 'react'

type Copy = 'idle' | 'copied' | 'failed'

const SAID: Record<Copy, string> = {
  idle: '',
  copied: 'Copied',
  failed: 'Not copied: the browser blocked the clipboard. Select the text instead.',
}

/** How long a result stays before it clears, in ms: long enough to read it. */
const SHOWN_FOR = 4000

export interface CopyButtonClientProps {
  /** The text the button copies, exactly as shown beside it */
  text: string
  /** What the button copies, as its label: "Copy the command" */
  label: string
  /** The icon at rest and the icon once copied, each rendered on the server */
  copyIcon: ReactNode
  copiedIcon: ReactNode
  className?: string
}

export function CopyButtonClient({
  text,
  label,
  copyIcon,
  copiedIcon,
  className,
}: CopyButtonClientProps) {
  const [state, setState] = useState<Copy>('idle')

  useEffect(() => {
    if (state === 'idle') return
    const timer = setTimeout(() => setState('idle'), SHOWN_FOR)
    return () => clearTimeout(timer)
  }, [state])

  const copy = () => {
    // the clipboard is there only in a secure context
    if (!navigator.clipboard) return setState('failed')
    // idle first, so a second copy in a row is said again
    setState('idle')
    navigator.clipboard.writeText(text).then(
      () => setState('copied'),
      () => setState('failed'),
    )
  }

  return (
    <>
      <IconButton label={label} onClick={copy} className={className}>
        {state === 'copied' ? copiedIcon : copyIcon}
      </IconButton>
      <span
        role="status"
        className={state === 'failed' ? 'site-copy-failed' : 'site-visually-hidden'}
      >
        {SAID[state]}
      </span>
    </>
  )
}
