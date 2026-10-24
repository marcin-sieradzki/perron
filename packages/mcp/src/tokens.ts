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
}

/** The tokens whose name or description holds every word of `query`, and of `type` if given. */
export function listTokens(tokens: TokenEntry[], query = '', type?: string) {
  const words = query
    .toLowerCase()
    .split(/[\s.]+/)
    .filter(Boolean)
  return tokens.filter((t) => {
    if (type && t.type !== type) return false
    const text = `${t.name} ${t.description ?? ''}`.toLowerCase()
    return words.every((w) => text.includes(w))
  })
}
