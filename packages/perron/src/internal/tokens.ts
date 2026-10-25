// A token's value in script, for the props Base UI takes as a number or a string rather than CSS
// (docs/components/README.md, "CSS" and "Shared helpers"). Internal: no barrel exports it. A
// component never imports tokens/generated/tokens.ts, which sits outside the package build's
// rootDir; it reads the custom property the token stylesheet gives the document root.

/**
 * A token's value, such as `--perron-size-sheet-peek`, as the document root's computed style gives
 * it, trimmed: `'320px'`. Nothing with no document, as on a server, or before a token stylesheet
 * gives it, so the caller keeps Base UI's own default until it can be read.
 */
export function tokenValue(property: `--perron-${string}`): string | undefined {
  if (typeof document === 'undefined') return undefined
  return getComputedStyle(document.documentElement).getPropertyValue(property).trim() || undefined
}
