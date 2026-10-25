'use client'
// PerronProvider sets the locale for the components inside it, useOwnedStrings gives a component
// its owned strings in that locale, with any *Label props laid over them, and useLocale gives it the
// locale itself, such as for formatting a number. It also holds the one Tooltip.Provider of the app,
// so every Perron tooltip inside shares Base UI's delay group (docs/components/tooltip.md, CR-1),
// and the one list of toasts with the region that shows them (docs/components/toast.md, CR-2).
import { Tooltip } from '@base-ui/react/tooltip'
import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { ToastHost } from './components/Toast/ToastRegion.tsx'
import { dictionaries } from './locale/index.ts'
import type { Locale, OwnedStrings } from './locale/index.ts'

const LocaleContext = createContext<Locale>('en')

export interface PerronProviderProps {
  /**
   * The language of every owned string inside, such as a dialog's close label. It also sets how
   * numbers are written, such as a meter's "82 %" in Danish.
   */
  locale?: Locale
  /**
   * Overrides "Notifications", the name of the region that holds the toasts
   * @default The locale's
   */
  notificationsLabel?: string
  children?: ReactNode
}

/**
 * Sets the locale of the Perron components inside it, groups their tooltips, so once one is open
 * the next opens at once, and renders the one region at the bottom of the screen where their
 * toasts stack. Without a provider, they speak English, each tooltip waits its full delay and each
 * toast brings a region of its own.
 */
export function PerronProvider({
  locale = 'en',
  notificationsLabel,
  children,
}: PerronProviderProps) {
  return (
    <LocaleContext.Provider value={locale}>
      <Tooltip.Provider>
        <ToastHost notificationsLabel={notificationsLabel}>{children}</ToastHost>
      </Tooltip.Provider>
    </LocaleContext.Provider>
  )
}

/**
 * The owned strings in the nearest PerronProvider's locale. Pass a component's `*Label` props as
 * `overrides` to replace one string on one instance; an undefined override keeps the dictionary's.
 *
 * @example const strings = useOwnedStrings({ close: closeLabel })
 */
export function useOwnedStrings(overrides: Partial<OwnedStrings> = {}): OwnedStrings {
  const strings = { ...dictionaries[useContext(LocaleContext)] }
  const given = Object.entries(overrides) as [keyof OwnedStrings, string | undefined][]
  for (const [key, value] of given) if (value !== undefined) strings[key] = value
  return strings
}

/**
 * The nearest PerronProvider's locale, `'en'` without one: a tag `Intl.NumberFormat` takes, for a
 * component that formats a number in the language of its words.
 */
export function useLocale(): Locale {
  return useContext(LocaleContext)
}
