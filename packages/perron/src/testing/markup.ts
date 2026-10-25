// Helpers for the unit tests, which run in node with no DOM and read a component's server-rendered
// markup (docs/components/README.md, "Shared helpers"). A story, which has the DOM, uses
// stories.ts instead. Not shipped: the build leaves src/testing out.

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

/** Markup's text with its character references, `&amp;` and `&#x27;` alike, read back. */
export const decode = (s: string) =>
  s.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (entity, name: string) =>
    name[0] === '#'
      ? String.fromCodePoint(
          Number(name[1].toLowerCase() === 'x' ? `0${name.slice(1)}` : name.slice(1)),
        )
      : (ENTITIES[name] ?? entity),
  )

/**
 * The value of one attribute in the first tag of server-rendered markup, its character references
 * read back, or undefined when the tag has no such attribute.
 *
 * @example attribute('<svg viewBox="0 0 24 24" width="24">', 'viewBox') // '0 0 24 24'
 */
export function attribute(markup: string, name: string) {
  const value = markup.match(/<[^>]*>/)?.[0].match(new RegExp(`\\s${name}="([^"]*)"`))?.[1]
  return value === undefined ? undefined : decode(value)
}

/** The elements React writes with no closing tag. */
const VOID = /^(?:area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i

/**
 * What a screen reader reads of server-rendered markup, as `heard` reads an element in a story:
 * its text outside every `aria-hidden="true"` element, white space collapsed.
 *
 * @example heardMarkup(renderToStaticMarkup(<NormalService />)) // 'Running normally'
 */
export function heardMarkup(markup: string) {
  /** One entry per open element: whether it, or one around it, is hidden. */
  const open: boolean[] = []
  let text = ''
  for (const [, close, name, attrs, selfClosing, run] of markup.matchAll(
    /<(\/?)([\w-]+)([^>]*?)(\/?)>|([^<]+)/g,
  )) {
    const hidden = open.at(-1) ?? false
    if (run !== undefined) text += hidden ? '' : run
    else if (close) open.pop()
    else if (!selfClosing && !VOID.test(name))
      open.push(hidden || /\saria-hidden="true"/.test(attrs))
  }
  return decode(text).replace(/\s+/g, ' ').trim()
}
