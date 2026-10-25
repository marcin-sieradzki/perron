'use client'
// A duration, played on request: a dot crosses its track over the duration with its easing, and
// back again on the next press. It moves only when asked, and under reduced motion it jumps.
import { Button } from '@mylder/perron'
import { useState, type CSSProperties } from 'react'

export interface MotionDemoProps {
  /** The token's name, for the button's accessible name */
  name: string
  /** The duration's custom property, `var(--perron-duration-sheet)` */
  duration: string
  /** The easing it plays with, as a custom property */
  easing: string
}

export function MotionDemo({ name, duration, easing }: MotionDemoProps) {
  const [atEnd, setAtEnd] = useState(false)
  const style = { '--fd-duration': duration, '--fd-easing': easing } as CSSProperties
  return (
    <span className="fd-demo" style={style}>
      <span className="fd-demo-track" data-end={atEnd || undefined}>
        <span className="fd-demo-dot" />
      </span>
      <Button
        size="small"
        variant="outline"
        color="neutral"
        aria-label={`Play ${name}`}
        onClick={() => setAtEnd((end) => !end)}
      >
        Play
      </Button>
    </span>
  )
}
