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

/** A positioner's defaults in pixels, read from the tokens' custom properties. */
export interface PositionerOffsets {
  sideOffset?: number
  collisionPadding?: number
}

/** Read once a token stylesheet has given both, and kept, so every render passes the same numbers. */
let offsets: PositionerOffsets | undefined

/**
 * `space.200` and `size.panel-gap` as pixel lengths, from `--perron-space-200` and
 * `--perron-size-panel-gap` in the document root's computed style: the gap a popup keeps from what
 * opened it and from the screen's edge, for a positioner's `sideOffset` and `collisionPadding`.
 * With no document, as on a server, or no token stylesheet yet, each is left out, and Base UI's own
 * default holds until they can be read.
 */
export function positionerOffsets(): PositionerOffsets {
  if (offsets === undefined) {
    const px = (property: `--perron-${string}`) => {
      const value = tokenValue(property)
      return value?.endsWith('px') ? Number.parseFloat(value) : Number.NaN
    }
    const read = {
      sideOffset: px('--perron-space-200'),
      collisionPadding: px('--perron-size-panel-gap'),
    }
    if (!Number.isNaN(read.sideOffset) && !Number.isNaN(read.collisionPadding)) offsets = read
  }
  return offsets ?? {}
}
