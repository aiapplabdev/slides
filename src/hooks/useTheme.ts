import { useEffect, useState } from 'react'

const THEME_STORAGE_KEY = 'magtech-theme'

function resolveInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => resolveInitialTheme())

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.dataset.theme = theme
    }
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  return { theme, toggleTheme }
}
