'use client'
// "On this page" on a phone, Phone-Button.dc.html's select: choosing a section scrolls to it.
import { Select } from '@mylder/perron'
import type { TocItem } from './SpecToc.tsx'

export function TocSelect({ items }: { items: TocItem[] }) {
  return (
    <div className="spec-toc-select">
      <Select
        label="On this page"
        placeholder="Choose a section"
        items={items.map((i) => ({ value: i.id, label: i.label }))}
        onChange={(_, id) => {
          if (!id) return
          document.getElementById(id)?.scrollIntoView()
          history.replaceState(null, '', `#${id}`)
        }}
      />
    </div>
  )
}
