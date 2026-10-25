'use client'
// AlertDialog's preview: its trigger, closed, with the spec's question. An alert dialog's actions
// close it only through `open`, so the preview holds `open` and each action sets it back to false.
// The caller's props reach AlertDialog last.
import { useState } from 'react'
import { AlertDialog, Button, type AlertDialogProps } from '@mylder/perron'

export function AlertDialogPreview({ defaultOpen = false, ...props }: Partial<AlertDialogProps>) {
  const [open, setOpen] = useState(defaultOpen)
  const close = () => setOpen(false)
  return (
    <AlertDialog
      trigger={<Button>Clear all filters</Button>}
      title="Clear all filters?"
      description="The map shows every line again."
      actions={
        <>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button color="brand" onClick={close}>
            Clear filters
          </Button>
        </>
      }
      open={open}
      onOpen={() => setOpen(true)}
      onClose={close}
      {...props}
    />
  )
}
