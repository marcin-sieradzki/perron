'use client'
// DetailPanel's preview: the panel open on an M1 train, its stops in a StopTimeline, or on a
// station with `variant: 'stop'`. The panel is a Sheet, which portals out of the page, so the
// preview holds it in a frame of its own (previews.css) and portals into that; closing it leaves
// the button that opens it again, as picking the vehicle on the map would.
import { useEffect, useRef, useState } from 'react'
import { Button, Text } from '@mylder/perron'
import { DetailPanel, StopTimeline } from '@mylder/perron/patterns'
import type { DetailPanelProps } from '@mylder/perron/patterns'
import {
  METRO_HEADER,
  METRO_TRIGGER,
  METRO_TRIP,
  STATION_DEPARTURES,
  STATION_HEADER,
} from './samples.ts'
import './previews.css'

export type DetailPanelPreviewProps = Partial<DetailPanelProps> & {
  /** Joined after the frame's own class, so a screen can place the frame */
  frameClassName?: string
}

export function DetailPanelPreview({ frameClassName, ...props }: DetailPanelPreviewProps) {
  const [frame, setFrame] = useState<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(props.defaultOpen ?? true)
  // open from the start, the panel leaves focus where the page has it; opened by its trigger, it
  // takes focus as the Sheet does. The prop reaches the Sheet's popup, Base UI's Drawer.Popup.
  const pressed = useRef(false)
  const initialFocus = { initialFocus: () => pressed.current }
  const station = props.variant === 'stop'
  const sample = station
    ? { ...STATION_HEADER, children: <Text>{STATION_DEPARTURES}</Text> }
    : { ...METRO_HEADER, children: <StopTimeline {...METRO_TRIP} /> }
  const label = station ? `Show ${STATION_HEADER.title}` : METRO_TRIGGER

  // Base UI's focus guards, aria-hidden spans that take Tab and pass it on, keep a real app's
  // focus going round a panel; in a preview set into a docs page they are hidden tab stops
  // (axe's aria-hidden-focus, WCAG 4.1.2), so the frame takes them out of the tab order and Tab
  // follows the page.
  useEffect(() => {
    if (!frame) return
    const untab = () =>
      frame.querySelectorAll<HTMLElement>('[data-base-ui-focus-guard]').forEach((guard) => {
        if (guard.tabIndex !== -1) guard.tabIndex = -1
      })
    untab()
    const observer = new MutationObserver(untab)
    observer.observe(frame, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['tabindex'],
    })
    return () => observer.disconnect()
  }, [frame])

  return (
    <div
      ref={setFrame}
      className={frameClassName ? `preview-frame ${frameClassName}` : 'preview-frame'}
    >
      {/* the portal needs its frame in the document first, or it would open over the page */}
      {frame ? (
        <DetailPanel
          {...sample}
          trigger={
            <Button className="preview-frame-trigger" size="small" variant="outline">
              {label}
            </Button>
          }
          {...initialFocus}
          {...props}
          open={props.open ?? open}
          onOpen={(...args) => {
            pressed.current = true
            setOpen(true)
            props.onOpen?.(...args)
          }}
          onClose={(...args) => {
            setOpen(false)
            props.onClose?.(...args)
          }}
          slotProps={{
            ...props.slotProps,
            portal: { ...props.slotProps?.portal, container: frame },
          }}
        />
      ) : null}
    </div>
  )
}
