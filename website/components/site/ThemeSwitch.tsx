'use client'
// The theme switch: Perron's IconButton, labelled with the theme it switches to. The inline script
// in the root layout has already applied a stored choice, so the icon shown follows <html> in CSS
// and only the label waits for hydration.
import { IconButton } from '@mylder/perron'
import { useSyncExternalStore } from 'react'
import { MoonIcon, SunIcon } from './icons.tsx'
import { applyTheme, currentTheme, DEFAULT_THEME, type Theme } from './theme.ts'

/** Calls back whenever data-theme on <html> changes, from this switch or any other. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}

const LABEL: Record<Theme, string> = {
  dark: 'Switch to the light theme',
  light: 'Switch to the dark theme',
}

export function ThemeSwitch() {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => DEFAULT_THEME)
  return (
    <IconButton
      label={LABEL[theme]}
      onClick={() => applyTheme(theme === 'dark' ? 'light' : 'dark')}
      className="site-theme-switch"
    >
      <MoonIcon className="perron-icon site-theme-dark" />
      <SunIcon className="perron-icon site-theme-light" />
    </IconButton>
  )
}
