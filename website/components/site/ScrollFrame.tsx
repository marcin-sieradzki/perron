'use client'
// A box that scrolls sideways: a wide table's frame, or a long line of code. While its content
// overflows, it joins the tab order as a named group, so keyboard users can scroll it with the
// arrow keys (WCAG 2.1.1); when everything fits it adds no tab stop. A group, not a region, so a
// page of tables doesn't fill the landmark list.
import { useEffect, useRef, useState, type ReactNode } from 'react'

export function ScrollFrame({
  as: Tag = 'div',
  label,
  className,
  children,
}: {
  as?: 'div' | 'code'
  label: string
  className: string
  children: ReactNode
}) {
  const ref = useRef<HTMLElement>(null)
  const [overflows, setOverflows] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setOverflows(el.scrollWidth > el.clientWidth + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    if (el.firstElementChild) observer.observe(el.firstElementChild)
    return () => observer.disconnect()
  }, [])
  return (
    <Tag
      ref={ref as never}
      className={className}
      {...(overflows ? { role: 'group', 'aria-label': label, tabIndex: 0 } : {})}
    >
      {children}
    </Tag>
  )
}
