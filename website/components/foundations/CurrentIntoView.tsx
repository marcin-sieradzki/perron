'use client'
// Scrolls the sidebar sideways to its current link once, when the sidebar is a row that scrolls,
// as it is under breakpoint.phone, so the page's own link shows. It moves only the row, never the
// page, and draws nothing.
import { useEffect, useRef } from 'react'

export function CurrentIntoView() {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const row = ref.current?.parentElement
    const current = row?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!row || !current || row.scrollWidth <= row.clientWidth) return
    const offset = current.getBoundingClientRect().left - row.getBoundingClientRect().left
    row.scrollLeft += offset - (row.clientWidth - current.offsetWidth) / 2
  }, [])
  return <span ref={ref} hidden />
}
