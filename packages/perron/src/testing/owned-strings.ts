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

/** Whether a character is a letter, in any script. */
const LETTER = /\p{L}/u

/**
 * The words of the dictionary's templates, the owned strings with `{name}` placeholders, cut at
 * each placeholder and trimmed: "Affects {stops}" gives "Affects", "{stops} and {count} more" gives
 * "and" and "more".
 */
const templateWords = (strings: string[]) =>
  strings
    .filter((s) => /\{\w+\}/.test(s))
    .flatMap((s) => s.split(/\{\w+\}/))
    .map((s) => s.trim())
    .filter((s) => LETTER.test(s))

/**
 * Whether a text run is a filled template: it reads, from start to end, as the dictionary's
 * template words, the caller's strings and characters that are no letter (digits, spaces,
 * punctuation), each word standing whole, with at least one template word among them. So
 * "Affects Nørreport and 3 more" passes when the caller gave "Nørreport", and "and" from another
 * locale fails.
 */
function filled(run: string, words: string[], callerStrings: string[]) {
  const pieces = [...new Set([...words, ...callerStrings.filter((s) => LETTER.test(s))])]
  const isWord = new Set(words)
  const whole = (at: number, end: number) =>
    !LETTER.test(run[at - 1] ?? '') && !LETTER.test(run[end] ?? '')
  // reached[i]: 0 not reached, 1 reached, 2 reached with a template word on the way
  const reached = new Array<number>(run.length + 1).fill(0)
  reached[0] = 1
  for (let at = 0; at < run.length; at++) {
    if (!reached[at]) continue
    if (!LETTER.test(run[at])) reached[at + 1] = Math.max(reached[at + 1], reached[at])
    for (const piece of pieces) {
      const end = at + piece.length
      if (run.startsWith(piece, at) && whole(at, end))
        reached[end] = Math.max(reached[end], isWord.has(piece) ? 2 : reached[at])
    }
  }
  return reached[run.length] === 2
}

/**
 * Throws unless every word in `markup` (text, aria-label, aria-valuetext, aria-roledescription,
 * title, alt and placeholder) is in the `locale` dictionary or in `callerStrings`, the words the test passed in as
 * children or props.
 * Words without a letter, such as "4 / 12" or "—", pass, and so does the "x" in Base UI's visually
 * hidden `span role="presentation"`. An owned string with `{name}` placeholders passes filled with
 * the caller's strings and figures, as `interpolate` fills it.
 *
 * @example expectOwnedStrings(renderToStaticMarkup(<Pager>Departures</Pager>), 'en', ['Departures'])
 */
export function expectOwnedStrings(markup: string, locale: Locale, callerStrings: string[] = []) {
  const strings = Object.values(dictionaries[locale])
  const known = new Set([...strings, ...callerStrings])
  const words = templateWords(strings)
  const strays = [
    ...new Set(
      wordsIn(markup).filter((word) => !known.has(word) && !filled(word, words, callerStrings)),
    ),
  ]
  if (strays.length)
    throw new Error(
      `Not in the ${locale} dictionary, and not passed by the caller: ${strays.map((s) => `"${s}"`).join(', ')}`,
    )
}
