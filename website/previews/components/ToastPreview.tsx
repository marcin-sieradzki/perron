'use client'
// Toast's preview: its trigger, closed, a small outline neutral Button, as the spec's stories set
// it. Pressing it shows the toast in the region the layout's PerronProvider holds, with the words
// its spec's story gives that intent; the close button, Esc or the action closes it again. The
// caller's props reach Toast last.
import { useState } from 'react'
import { Button, Toast, type ToastProps } from '@mylder/perron'

type Color = NonNullable<ToastProps['color']>

/** Each intent's story: its trigger's words, the toast's title and sentence, and its action. */
const STORIES: Record<
  Color,
  { trigger: string; title?: string; sentence?: string; action?: string }
> = {
  neutral: {
    trigger: 'Clear filters',
    title: 'Filters cleared',
    sentence: 'The map shows every line again.',
    action: 'Undo',
  },
  success: { trigger: 'Copy link', title: 'Link copied' },
  warning: {
    trigger: 'Show delays',
    title: 'Live positions are delayed',
    sentence: 'Positions are up to 2 min old.',
  },
  danger: {
    trigger: 'Copy link',
    title: 'Could not copy the link',
    sentence: 'Copy it from the address bar instead.',
    action: 'Try again',
  },
  info: { trigger: 'Show night buses', sentence: 'Night buses run from 01:00.' },
}

export function ToastPreview({
  color = 'success',
  defaultOpen = false,
  ...props
}: Partial<Omit<ToastProps, 'open'>>) {
  const [open, setOpen] = useState(defaultOpen)
  const story = STORIES[color]
  const close = () => setOpen(false)
  return (
    <>
      <Button size="small" variant="outline" color="neutral" onClick={() => setOpen(true)}>
        {story.trigger}
      </Button>
      <Toast
        color={color}
        title={story.title}
        children={story.sentence}
        action={
          story.action ? (
            <Button size="small" variant="outline" color="neutral" onClick={close}>
              {story.action}
            </Button>
          ) : undefined
        }
        open={open}
        onClose={close}
        {...props}
      />
    </>
  )
}
