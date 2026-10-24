// The four locales Perron speaks and their dictionaries of owned strings.
import { da } from './da.ts'
import { en } from './en.ts'
import { nb } from './nb.ts'
import { sv } from './sv.ts'
import type { OwnedStrings } from './en.ts'

export type { OwnedStringKey, OwnedStrings } from './en.ts'

/** Every locale's dictionary, by locale. */
export const dictionaries = { en, da, sv, nb } satisfies Record<string, OwnedStrings>

/** A locale Perron speaks: English, Danish, Swedish or Norwegian Bokmål. */
export type Locale = keyof typeof dictionaries
