// The tokens, two ways: the list `@mylder/perron` ships in data/tokens.json (every token with its
// value in each theme, the list the MCP server's list_tokens reads), and the resolved token
// sources the foundation pages' table rows are built from (scripts/lib/tokens.ts).
import { cssVarName, loadTokens, type ResolvedTokens } from '../../scripts/lib/tokens.ts'
import { readSources } from '../../scripts/lib/token-sources.ts'
import type { TokenRow } from '../../scripts/lib/pages.ts'
import { once, readRepoJson, repoRoot } from './repo.ts'

export type { ResolvedTokens }

/** One token as data/tokens.json lists it. */
export type TokenData = Pick<TokenRow, 'name' | 'type' | 'cssVar' | 'description' | 'values'> &
  Partial<Pick<TokenRow, 'overrides' | 'typography'>>

/** The shipped token list, by path from the repo root. */
export const TOKEN_DATA = 'packages/perron/data/tokens.json'

/** Every token, in the shipped list's order. */
export const readTokenData = once(() => readRepoJson<TokenData[]>(TOKEN_DATA))

/** How many tokens Perron ships. */
export const tokenCount = () => readTokenData().length

/** One token by its dot name, such as `color.text.primary`, or undefined. */
export const readToken = (name: string) => readTokenData().find((t) => t.name === name)

/** The tokens whose names start with `prefix`, such as `color.map.`. */
export const tokensUnder = (prefix: string) =>
  readTokenData().filter((t) => t.name.startsWith(prefix))

/** The resolved token sources, for `pageOf` and the other readers in scripts/lib. */
export const readResolvedTokens = once(() => loadTokens(readSources(repoRoot())))

/** A token's custom property as a CSS value: `var(--perron-color-text-primary)`. */
export const cssVar = (name: string) => `var(${cssVarName(name)})`

/**
 * A dimension, duration or number token's value as a number, in px or ms, from its value in the
 * first theme listed: for drawing at build time where CSS can't reach, such as an SVG attribute.
 * Throws for an unknown token or one that is not a single number.
 */
export function tokenNumber(name: string) {
  const token = readToken(name)
  if (!token) throw new Error(`No token ${name}`)
  const css = Object.values(token.values)[0].css
  const n = Number.parseFloat(css)
  if (!/^-?[\d.]+(px|ms)?$/.test(css) || Number.isNaN(n))
    throw new Error(`${name} is ${css}, not a single number`)
  return n
}
