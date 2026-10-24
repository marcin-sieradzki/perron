// The contract story's subjects: every registry entry past designing, as the barrels export it,
// with the props its own stories render it with, so a new entry is covered without editing a story.
import type { Subject } from './root.tsx'

type Args = Record<string, unknown>

/** A stories file as import.meta.glob gives it: the meta as default, then each story. */
export type StoryModule = Record<string, { args?: Args } | undefined>

interface RegistryEntry {
  name: string
  status: string
}

/**
 * Each built entry with its export from the barrels and the args of its `Default` story (or its
 * first story) over its meta's args. `stories` is keyed by path, ending `/<Name>/<Name>.stories.tsx`.
 */
export function subjects(
  entries: RegistryEntry[],
  barrels: Record<string, unknown>,
  stories: Record<string, StoryModule>,
): Subject[] {
  return entries
    .filter((e) => e.status !== 'designing')
    .map(({ name }) => {
      const Component = barrels[name]
      if (typeof Component !== 'function' && typeof Component !== 'object')
        throw new Error(
          `${name} is built in packages/perron/components.json but not exported; run npm run registry`,
        )
      const file = Object.entries(stories).find(([path]) =>
        path.endsWith(`/${name}/${name}.stories.tsx`),
      )?.[1]
      const { default: meta, ...named } = file ?? {}
      const story = named.Default ?? Object.values(named)[0]
      return {
        name,
        Component: Component as Subject['Component'],
        args: { ...meta?.args, ...story?.args },
      }
    })
}
