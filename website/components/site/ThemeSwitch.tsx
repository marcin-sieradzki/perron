'use client'
// The theme switch: Perron's IconButton, labelled with the theme it switches to. The inline script
// in the root layout has already applied a stored choice, so the icon shown follows <html> in CSS
// and only the label waits for hydration.
import { IconButton } from '@mylder/perron'
import { useSyncExternalStore } from 'react'
import { MoonIcon, SunIcon } from './icons.tsx'
import { applyTheme, currentTheme, DEFAULT_THEME, subscribeTheme, type Theme } from './theme.ts'

const LABEL: Record<Theme, string> = {
  dark: 'Switch to the light theme',
  light: 'Switch to the dark theme',
}

export function ThemeSwitch() {
  const theme = useSyncExternalStore(subscribeTheme, currentTheme, () => DEFAULT_THEME)
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
