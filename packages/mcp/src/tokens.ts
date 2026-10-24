// list_tokens: Perron's tokens from the data @mylder/perron ships, filtered by words and type.

export interface TokenEntry {
  name: string
  type: string
  cssVar: string
  description?: string
  /** CSS text per theme, and the token it points at, if any */
  values: Record<string, { css: string; alias?: string }>
  /** The value under a context that changes it, such as reduced motion */
  overrides?: Record<string, string>
  /** For a typography role: its CSS class, tracking and capitals */
  typography?: Record<string, string | number>
}

/**
 * The tokens whose name, CSS custom property or description holds every word of `query`, and
 * whose type is `type`, if given. `--perron-color-surface-warning` finds its token too.
 */
export function listTokens(tokens: TokenEntry[], query = '', type?: string) {
  const words = query
    .toLowerCase()
    .replace(/^--perron-/, '')
    .split(/[\s.-]+/)
    .filter(Boolean)
  const kind = type?.toLowerCase().replace(/[\s_-]/g, '')
  return tokens.filter((t) => {
    if (kind && t.type.toLowerCase() !== kind) return false
    const text = `${t.name} ${t.cssVar} ${t.description ?? ''}`.toLowerCase()
    return words.every((w) => text.includes(w))
  })
}
