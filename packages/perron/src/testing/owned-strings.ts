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
 * The dictionary's templates, the owned strings with `{name}` placeholders, each as its literal
 * parts in order, cut at each placeholder: "Affects {stops}" gives "Affects " and "", "{stops} and
 * {count} more" gives "", " and " and " more". A template whose parts hold no letter fills with
 * anything and says nothing of its own, so it is left out.
 */
const templatesIn = (strings: string[]) =>
  strings
    .filter((s) => /\{\w+\}/.test(s))
    .map((s) => s.replace(/\s+/g, ' ').split(/\{\w+\}/))
    .filter((parts) => parts.some((part) => LETTER.test(part)))

/**
 * Whether a text run is one template filled, as `interpolate` fills it: it reads, from start to
 * end, as one template's literal parts in their order, with each placeholder between them holding
 * something. A placeholder holds the caller's strings, each standing whole, another template
 * filled, and characters that are no letter (digits, spaces, punctuation), with at least one that
 * is no space. So "Affects Nørreport and 3 more" passes when the caller gave "Nørreport", while
 * "to 3", a template with a placeholder left empty, "more Nørreport Affects", its words out of
 * order, and "and" from another locale fail.
 */
function filled(run: string, templates: string[][], callerStrings: string[]) {
  const callers = [...new Set(callerStrings.filter((s) => LETTER.test(s)))]
  const whole = (at: number, end: number) =>
    !LETTER.test(run[at - 1] ?? '') && !LETTER.test(run[end] ?? '')
  // memo of each range: whether it is a template filled, and whether it is a placeholder's
  // value; a range is marked false before it is worked out, so a loop finds no match
  const isTemplate = new Map<string, boolean>()
  const isValue = new Map<string, boolean>()
  const isPieces = new Map<string, boolean>()
  const remembered = (memo: Map<string, boolean>, at: number, end: number, work: () => boolean) => {
    const key = `${at}:${end}`
    const known = memo.get(key)
    if (known !== undefined) return known
    memo.set(key, false)
    const result = work()
    memo.set(key, result)
    return result
  }
  // run[at, end) reads as parts[k], a placeholder's value, parts[k + 1], and so on to the last
  const fits = (parts: string[], k: number, at: number, end: number): boolean => {
    const part = parts[k]
    if (at + part.length > end || !run.startsWith(part, at)) return false
    const after = at + part.length
    if (k === parts.length - 1) return after === end
    for (let next = after + 1; next <= end; next++)
      if (value(after, next) && fits(parts, k + 1, next, end)) return true
    return false
  }
  const template = (at: number, end: number): boolean =>
    remembered(
      isTemplate,
      at,
      end,
      () => whole(at, end) && templates.some((parts) => fits(parts, 0, at, end)),
    )
  // run[at, end) is pieces, each a character that is no letter, a caller's string or a template
  const pieces = (at: number, end: number): boolean =>
    at === end ||
    remembered(isPieces, at, end, () => {
      if (!LETTER.test(run[at]) && pieces(at + 1, end)) return true
      for (const caller of callers) {
        const stop = at + caller.length
        if (stop <= end && run.startsWith(caller, at) && whole(at, stop) && pieces(stop, end))
          return true
      }
      for (let stop = end; stop > at; stop--)
        if (template(at, stop) && pieces(stop, end)) return true
      return false
    })
  const value = (at: number, end: number): boolean =>
    remembered(isValue, at, end, () => run.slice(at, end).trim() !== '' && pieces(at, end))
  return template(0, run.length)
}

/**
 * Throws unless every word in `markup` (text, aria-label, aria-valuetext, aria-roledescription,
 * title, alt and placeholder) is in the `locale` dictionary or in `callerStrings`, the words the test passed in as
 * children or props.
 * Words without a letter, such as "4 / 12" or "—", pass, and so does the "x" in Base UI's visually
 * hidden `span role="presentation"`. An owned string with `{name}` placeholders passes filled with
 * the caller's strings, figures and other templates, as `interpolate` fills it, each of its own
 * words in its own order and each placeholder holding something.
 *
 * @example expectOwnedStrings(renderToStaticMarkup(<Pager>Departures</Pager>), 'en', ['Departures'])
 */
export function expectOwnedStrings(markup: string, locale: Locale, callerStrings: string[] = []) {
  const strings = Object.values(dictionaries[locale])
  const known = new Set([...strings, ...callerStrings])
  const templates = templatesIn(strings)
  const strays = [
    ...new Set(
      wordsIn(markup).filter((word) => !known.has(word) && !filled(word, templates, callerStrings)),
    ),
  ]
  if (strays.length)
    throw new Error(
      `Not in the ${locale} dictionary, and not passed by the caller: ${strays.map((s) => `"${s}"`).join(', ')}`,
    )
}
