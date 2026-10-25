'use client'
// DataStatePanel's preview: a vehicle list that could not be loaded, with "Try again", which brings
// the list in, as a data view's retry would. A page picks another status with `status`.
import { useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@mylder/perron'
import { DataStatePanel } from '@mylder/perron/patterns'
import type { DataStatePanelProps } from '@mylder/perron/patterns'
import { DATA_ERROR, DATA_RETRY, DEPARTURES } from './samples.ts'
import './previews.css'

export type DataStatePanelPreviewProps = DataStatePanelProps & {
  /** The icon the error status shows, a package icon the server read */
  errorIcon?: ReactNode
}

export function DataStatePanelPreview({ errorIcon, ...props }: DataStatePanelPreviewProps) {
  const [status, setStatus] = useState(props.status ?? DATA_ERROR.status)
  const children = props.children ?? (
    <ul className="preview-list">
      {DEPARTURES.map((departure) => (
        <li key={departure}>{departure}</li>
      ))}
    </ul>
  )

  return (
    <DataStatePanel
      {...DATA_ERROR}
      action={
        <Button variant="outline" size="small" onClick={() => setStatus('ready')}>
          {DATA_RETRY}
        </Button>
      }
      slotProps={status === 'error' && errorIcon ? { emptyState: { icon: errorIcon } } : undefined}
      {...props}
      status={status}
    >
      {children}
    </DataStatePanel>
  )
}
