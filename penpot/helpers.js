// Perron's Penpot helpers. At the start of every Penpot session, pass this whole file as the code
// of the MCP's execute_code: it installs storage.bind, storage.readBack and storage.sha256, which
// later calls use (penpot/README.md, "Session start"). It runs as a function body with `penpot`,
// `penpotUtils` and `storage` in scope.

/** Shorthands for the Penpot token properties that move together. */
const GROUPS = {
  padding: ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'],
  radius: [
    'borderRadiusTopLeft',
    'borderRadiusTopRight',
    'borderRadiusBottomRight',
    'borderRadiusBottomLeft',
  ],
  gap: ['rowGap', 'columnGap'],
}

/**
 * Binds the token `tokenName` to `property` of `shape`: a Penpot token property such as `fill`,
 * `strokeColor` or `paddingLeft`, or `padding`, `radius` or `gap` for all sides at once. Throws on
 * a token that doesn't exist, so a design can never bind a value outside Perron's tokens. Binding
 * is asynchronous: read `shape.tokens` after a short wait.
 */
storage.bind = (shape, property, tokenName) => {
  const token = penpotUtils.findTokenByName(tokenName)
  if (!token) throw new Error(`No token named ${tokenName}; Perron's tokens are the only values`)
  shape.applyToken(token, GROUPS[property] ?? [property])
  return token
}

/** SHA-256 of a byte array, as hex. The plugin sandbox has no crypto, so this is plain JS. */
storage.sha256 = (bytes) => {
  const k = []
  const h = []
  const frac = (x) => ((x - Math.floor(x)) * 2 ** 32) >>> 0
  for (let n = 2, found = 0; found < 64; n++) {
    let prime = true
    for (let d = 2; d * d <= n; d++) if (n % d === 0) prime = false
    if (!prime) continue
    if (found < 8) h[found] = frac(Math.sqrt(n))
    k[found++] = frac(Math.cbrt(n))
  }
  const length = bytes.length
  const padded = new Uint8Array(((length + 9 + 63) >> 6) << 6)
  padded.set(bytes)
  padded[length] = 0x80
  const view = new DataView(padded.buffer)
  view.setUint32(padded.length - 8, Math.floor(length / 2 ** 29))
  view.setUint32(padded.length - 4, (length << 3) >>> 0)
  const w = new Uint32Array(64)
  const rotr = (x, n) => (x >>> n) | (x << (32 - n))
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4)
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3)
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10)
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0
    }
    let [a, b, c, d, e, f, g, hh] = h
    for (let i = 0; i < 64; i++) {
      const t1 =
        (hh + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + k[i] + w[i]) >>> 0
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0
      hh = g
      g = f
      f = e
      e = (d + t1) >>> 0
      d = c
      c = b
      b = a
      a = (t1 + t2) >>> 0
    }
    ;[a, b, c, d, e, f, g, hh].forEach((x, i) => (h[i] = (h[i] + x) >>> 0))
  }
  return h.map((x) => x.toString(16).padStart(8, '0')).join('')
}

/**
 * A solid colour as `#rrggbb`, or `#rrggbbaa` when it is translucent: Penpot keeps a token's alpha
 * in the fill's or stroke's opacity, not in its colour. A gradient or image is `null`.
 */
const colour = (hex, opacity) => {
  if (!hex) return null
  if (opacity === undefined || opacity === null || opacity >= 1) return hex.toLowerCase()
  return (
    hex.toLowerCase() +
    Math.round(opacity * 255)
      .toString(16)
      .padStart(2, '0')
  )
}

/** One layer and its descendants, in the read-back format of scripts/checks/penpot.ts. */
const layer = (shape, name) => {
  const out = {
    name,
    type: shape.type,
    id: shape.id,
    size: { width: shape.width, height: shape.height },
  }
  if (shape.hidden) out.hidden = true
  const parentLayout = shape.parent && (shape.parent.flex || shape.parent.grid)
  if (parentLayout && shape.layoutChild && !shape.layoutChild.absolute) {
    out.size.horizontal = shape.layoutChild.horizontalSizing
    out.size.vertical = shape.layoutChild.verticalSizing
  }
  const lay = shape.flex || shape.grid
  if (lay)
    out.layout = {
      type: shape.flex ? 'flex' : 'grid',
      dir: lay.dir,
      ...(shape.flex ? { wrap: lay.wrap } : {}),
      alignItems: lay.alignItems,
      justifyContent: lay.justifyContent,
      rowGap: lay.rowGap,
      columnGap: lay.columnGap,
      padding: [lay.topPadding, lay.rightPadding, lay.bottomPadding, lay.leftPadding],
      horizontal: lay.horizontalSizing,
      vertical: lay.verticalSizing,
    }
  out.fills = Array.isArray(shape.fills)
    ? shape.fills.map((f) => colour(f.fillColor, f.fillOpacity))
    : []
  out.strokes = (shape.strokes ?? []).map((s) => ({
    color: colour(s.strokeColor, s.strokeOpacity),
    width: s.strokeWidth ?? 0,
  }))
  if (shape.borderRadiusTopLeft !== undefined)
    out.radius = [
      shape.borderRadiusTopLeft,
      shape.borderRadiusTopRight,
      shape.borderRadiusBottomRight,
      shape.borderRadiusBottomLeft,
    ].map((r) => r ?? 0)
  out.tokens = { ...shape.tokens }
  if (shape.type === 'text') out.text = shape.characters
  if (shape.children?.length) out.children = shape.children.map((c) => layer(c, c.name))
  return out
}

/** A board's PNG and SVG exports, hashed. */
const exportsOf = async (shape) => ({
  png: storage.sha256(await shape.export({ type: 'png', scale: 1 })),
  svg: storage.sha256(await shape.export({ type: 'svg' })),
})

/**
 * Reads a component back into the format of `penpot/<name>.json`: `container` is its variant
 * container, or the main instance of a component without variants. Each variant's top layer is
 * written as `root`, since Penpot names a main instance after its component. Write the result to
 * the repo with JSON.stringify(result, null, 2).
 */
storage.readBack = async (container) => {
  const isVariants = container.isVariantContainer?.()
  const components = isVariants ? container.variants.variantComponents() : [container.component()]
  const names = isVariants ? container.variants.properties : []
  const properties = Object.fromEntries(names.map((p) => [p, []]))
  const variants = []
  for (const component of components) {
    const props = isVariants ? { ...component.variantProps } : {}
    for (const p of names) if (!properties[p].includes(props[p])) properties[p].push(props[p])
    const main = component.mainInstance()
    variants.push({
      componentId: component.id,
      props,
      exports: await exportsOf(main),
      root: layer(main, 'root'),
    })
  }
  return {
    component: container.name,
    page: penpot.currentPage.name,
    fileId: penpot.currentFile.id,
    containerId: container.id,
    properties,
    variants,
  }
}
