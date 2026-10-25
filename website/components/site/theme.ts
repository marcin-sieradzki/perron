// The site's theme: dark by default, the visitor's choice kept in localStorage, and set as
// data-theme on <html> by an inline script in <head> before the first paint, so a reload never
// flashes the other theme. Shared by the root layout, the theme switch and the menu.

export type Theme = 'light' | 'dark'

/** The theme before a visitor chooses one, also server-rendered on <html>. */
export const DEFAULT_THEME: Theme = 'dark'

/** Where the choice is kept. */
export const THEME_KEY = 'perron-site-theme'

/** Runs in <head> before the body paints: applies a stored choice, if storage allows one. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`

/** The theme <html> shows now. */
export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

/**
 * Calls back whenever data-theme on <html> changes, from any switch: `useSyncExternalStore`'s
 * subscribe, with `currentTheme` as its snapshot.
 */
export function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}

/** Shows `theme` and keeps it for the next visit, when storage allows. */
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // storage blocked: the choice lasts until the page is left
  }
}
