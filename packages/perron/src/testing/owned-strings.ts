// A test helper: reads the words a render shows or announces, and fails on any that neither the
// locale's dictionary nor the caller gave it, so a component cannot hardcode an owned string.
// Not shipped: the build leaves src/testing out.
import { dictionaries } from '../locale/index.ts'
import type { Locale } from '../locale/index.ts'
import { decode } from './markup.ts'

/** The attributes whose values a person reads or hears. */
const SPOKEN =
  /\s(?:aria-label|aria-valuetext|aria-roledescription|title|alt|placeholder)="([^"]*)"/g

/**
 * An element with `role="presentation"` and Base UI's `visuallyHidden` inline style, its
 * `clip-path: inset(50%)`, holding text alone: the "x" Base UI's Meter and Progress roots append
 * after their children. No Perron component writes one, so its text is no word of theirs.
 */
const BASE_UI_HIDDEN =
  /<(\w+)\b(?=[^>]*\srole="presentation")(?=[^>]*\sstyle="[^"]*clip-path:\s*inset\(50%\))[^>]*>[^<]*<\/\1>/g

/** Every text run and spoken attribute value in an HTML render that holds a letter. */
function wordsIn(markup: string): string[] {
  const html = markup
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '<>')
    .replace(/<!--[\s\S]*?-->/g, '<>')
    .replace(BASE_UI_HIDDEN, '<>')
  const tags = html.match(/<[^>]*>/g) ?? []
  const found = [
    ...html.split(/<[^>]*>/),
    ...tags.flatMap((tag) => [...tag.matchAll(SPOKEN)].map((m) => m[1])),
  ]
  return found.map((s) => decode(s).replace(/\s+/g, ' ').trim()).filter((s) => /\p{L}/u.test(s))
}

/**
 * Throws unless every word in `markup` (text, aria-label, aria-valuetext, aria-roledescription,
 * title, alt and placeholder) is in the `locale` dictionary or in `callerStrings`, the words the test passed in as
 * children or props.
 * Words without a letter, such as "4 / 12" or "—", pass, and so does the "x" in Base UI's visually
 * hidden `span role="presentation"`.
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
