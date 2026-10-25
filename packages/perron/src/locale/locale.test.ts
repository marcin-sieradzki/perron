// Every locale's dictionary holds every owned string the English one defines, and nothing else,
// and content design's table of data-state, delay and disruption words says what the dictionaries say.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { dictionaries } from './index.ts'
import type { Locale, OwnedStringKey } from './index.ts'

const keys = Object.keys(dictionaries.en).sort()

describe.each(Object.keys(dictionaries) as Locale[])('the %s dictionary', (locale) => {
  const dictionary: Record<string, unknown> = dictionaries[locale]

  it('has every key of the English one, and no other', () => {
    expect(Object.keys(dictionary).sort()).toEqual(keys)
  })

  it('gives each key a written string', () => {
    const unwritten = keys.filter(
      (key) => typeof dictionary[key] !== 'string' || !(dictionary[key] as string).trim(),
    )
    expect(unwritten).toEqual([])
  })
})

describe("content design's data-state, delay and disruption words", () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), '../../../..')
  const page = readFileSync(join(root, 'docs/content-design.md'), 'utf8')
  const [header, , ...rows] = page
    .split('\n')
    .filter((line) => line.startsWith('|'))
    .map((line) =>
      line
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim()),
    )
  const LANGUAGES: Record<string, Locale> = {
    English: 'en',
    Danish: 'da',
    Swedish: 'sv',
    'Norwegian Bokmål': 'nb',
  }
  const byEnglish = (word: string) =>
    (Object.keys(dictionaries.en) as OwnedStringKey[]).find((k) => dictionaries.en[k] === word)

  it('name a column for each locale', () => {
    expect(header?.map((language) => LANGUAGES[language])).toEqual(['en', 'da', 'sv', 'nb'])
  })

  it('list every data-state, delay and disruption word', () => {
    expect(rows.map(([english]) => english)).toEqual([
      'Live',
      'Ageing',
      'Estimated',
      'Timetable only',
      'No signal',
      'Delays',
      'Diversions',
      'Planned works',
      'Data feed problems',
      'Service notice',
      'Running normally',
      'Show on map',
      'On time',
      'Delay unknown',
      'Cancelled',
    ])
  })

  it('give each word as the dictionaries do', () => {
    for (const row of rows) {
      const key = byEnglish(row[0])
      expect({ word: row[0], key }).toEqual({ word: row[0], key: expect.any(String) })
      expect(row).toEqual(header.map((language) => dictionaries[LANGUAGES[language]][key!]))
    }
  })
})
