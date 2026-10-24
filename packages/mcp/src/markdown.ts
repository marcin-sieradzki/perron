// Headings in a Markdown page, skipping fenced code, where a `# comment` is not a heading.

export interface Section {
  level: number
  /** The heading text, with Markdown escapes removed */
  heading: string
  /** The section's text, from its heading line up to the next heading at its level or above */
  text: string
}

/** Every heading of the page, each with the text it governs. */
export function sections(markdown: string): Section[] {
  const lines = markdown.split('\n')
  const heads: { at: number; level: number; heading: string }[] = []
  let fence = ''
  lines.forEach((line, at) => {
    const f = /^\s*(`{3,}|~{3,})/.exec(line)?.[1]
    if (f && (!fence || f.startsWith(fence))) fence = fence ? '' : f
    else if (!fence) {
      const m = /^(#{1,6}) (.+?)\s*#*$/.exec(line)
      if (m) heads.push({ at, level: m[1].length, heading: m[2].replaceAll('\\', '') })
    }
  })
  return heads.map((h, i) => {
    const end = heads.slice(i + 1).find((n) => n.level <= h.level)?.at ?? lines.length
    return { level: h.level, heading: h.heading, text: lines.slice(h.at, end).join('\n').trim() }
  })
}
