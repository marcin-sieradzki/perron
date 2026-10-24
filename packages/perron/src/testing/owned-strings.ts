// A test helper: reads the words a render shows or announces, and fails on any that neither the
// locale's dictionary nor the caller gave it, so a component cannot hardcode an owned string.
// Not shipped: the build leaves src/testing out.
import { dictionaries } from '../locale/index.ts'
import type { Locale } from '../locale/index.ts'

/** The attributes whose values a person reads or hears. */
const SPOKEN = /\s(?:aria-label|title|alt|placeholder)="([^"]*)"/g

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

const decode = (s: string) =>
  s.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (entity, name: string) =>
    name[0] === '#'
      ? String.fromCodePoint(
          Number(name[1].toLowerCase() === 'x' ? `0${name.slice(1)}` : name.slice(1)),
        )
      : (ENTITIES[name] ?? entity),
  )

/** Every text run and spoken attribute value in an HTML render that holds a letter. */
function wordsIn(markup: string): string[] {
  const html = markup
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '<>')
    .replace(/<!--[\s\S]*?-->/g, '<>')
  const tags = html.match(/<[^>]*>/g) ?? []
  const found = [
    ...html.split(/<[^>]*>/),
    ...tags.flatMap((tag) => [...tag.matchAll(SPOKEN)].map((m) => m[1])),
  ]
  return found.map((s) => decode(s).replace(/\s+/g, ' ').trim()).filter((s) => /\p{L}/u.test(s))
}

/**
 * Throws unless every word in `markup` (text, aria-label, title, alt and placeholder) is in the
 * `locale` dictionary or in `callerStrings`, the words the test passed in as children or props.
 * Words without a letter, such as "4 / 12" or "—", pass.
 *
 * @example expectOwnedStrings(renderToStaticMarkup(<Pager>Departures</Pager>), 'en', ['Departures'])
 */
export function expectOwnedStrings(markup: string, locale: Locale, callerStrings: string[] = []) {
  const known = new Set([...Object.values(dictionaries[locale]), ...callerStrings])
  const strays = [...new Set(wordsIn(markup).filter((word) => !known.has(word)))]
  if (strays.length)
    throw new Error(
      `Not in the ${locale} dictionary, and not passed by the caller: ${strays.map((s) => `"${s}"`).join(', ')}`,
    )
}
