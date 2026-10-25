// "On this page": a spec page's sections, as links in the column beside it.

export interface TocItem {
  /** The section's id */
  id: string
  label: string
}

export function SpecToc({ items }: { items: TocItem[] }) {
  return (
    <nav aria-label="On this page" className="spec-toc">
      <span className="spec-overline">On this page</span>
      {items.map((item) => (
        <a key={item.id} href={`#${item.id}`} className="spec-toc-link hover">
          {item.label}
        </a>
      ))}
    </nav>
  )
}
