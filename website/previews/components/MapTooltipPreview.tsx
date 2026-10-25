'use client'
// MapTooltip's preview: a stop on the map, its StationIcon, with the card closed, as the spec's
// Controlled story has it. Resting the pointer on the stop or pressing "Show the card" opens the
// card against the stop; Esc or moving away closes it. The caller's props reach MapTooltip last.
import { useRef, useState } from 'react'
import { Button, MapTooltip, StationIcon, type MapTooltipProps } from '@mylder/perron'

export function MapTooltipPreview({
  defaultOpen = false,
  ...props
}: Partial<Omit<MapTooltipProps, 'anchorEl'>>) {
  const stop = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(defaultOpen)
  return (
    <span className="preview-row preview-row-wide">
      <StationIcon
        ref={stop}
        onPointerEnter={() => setOpen(true)}
        onPointerLeave={() => setOpen(false)}
      />
      <Button variant="outline" size="small" onClick={() => setOpen(true)}>
        Show the card
      </Button>
      <MapTooltip anchorEl={stop} open={open} onClose={() => setOpen(false)} {...props}>
        Nørreport St.
      </MapTooltip>
    </span>
  )
}
