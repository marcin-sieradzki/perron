// The contract story's subjects: every registry entry past designing, as the barrels export it,
// with the props its own stories render it with, so a new entry is covered without editing a story.
import { folderOf, isBuilt, type Entry } from '../../scripts/lib/entry.ts'
import type { Subject } from './root.tsx'

type Args = Record<string, unknown>

/** A stories file as import.meta.glob gives it: the meta as default, then each story. */
export type StoryModule = Record<string, { args?: Args } | undefined>

/**
 * Each built entry with its export from the barrels and the args of its `Default` story over its
 * meta's args; with no `Default`, its alphabetically first story, as a module namespace lists its
 * exports (the file's own order doesn't reach it under Vitest). `stories` is keyed by path, ending
 * `/components/<Name>/<Name>.stories.tsx` or `/patterns/<Name>/<Name>.stories.tsx`.
 */
export function subjects(
  entries: Entry[],
  barrels: Record<string, unknown>,
  stories: Record<string, StoryModule>,
): Subject[] {
  return entries.filter(isBuilt).map(({ name, layer }) => {
    const Component = barrels[name]
    if (typeof Component !== 'function' && typeof Component !== 'object')
      throw new Error(
        `${name} is built in packages/perron/components.json but not exported; run npm run registry`,
      )
    const file = Object.entries(stories).find(([path]) =>
      path.endsWith(`/${folderOf(layer)}/${name}/${name}.stories.tsx`),
    )?.[1]
    const { default: meta, ...named } = file ?? {}
    const story = named.Default ?? named[Object.keys(named).sort()[0]]
    return {
      name,
      Component: Component as Subject['Component'],
      args: { ...meta?.args, ...story?.args },
    }
  })
}

/**
 * Every string in a story's args, through lists, objects and the props of React elements: the
 * words the caller gave, which `expectOwnedStrings` takes as its own.
 */
export function callerStrings(args: unknown): string[] {
  const words = new Set<string>()
  const seen = new Set<object>()
  const visit = (value: unknown) => {
    if (typeof value === 'string') {
      if (value.trim()) words.add(value.replace(/\s+/g, ' ').trim())
    } else if (value && typeof value === 'object' && !seen.has(value)) {
      seen.add(value)
      const element = '$$typeof' in value ? (value as { props?: unknown }).props : undefined
      for (const v of Object.values(element ?? value)) visit(v)
    }
  }
  visit(args)
  return [...words]
}
