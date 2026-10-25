// The props of every released component and pattern, from packages/perron/api.json: the file the
// api-compatibility check holds against the last release, so a spec page's props table shows what
// the package promises.
import type { Api, ComponentApi, Prop } from '../../scripts/lib/api.ts'
import { once, readRepoJson } from './repo.ts'

export type { Api, ComponentApi, Prop }

/** The file, by path from the repo root. */
export const API_FILE = 'packages/perron/api.json'

/** Every released entry's props, by its PascalCase name. */
export const readApi = once(() => readRepoJson<Api>(API_FILE))

/** One entry's props type, or undefined for an entry not yet released. */
export const readComponentApi = (name: string): ComponentApi | undefined => readApi()[name]
