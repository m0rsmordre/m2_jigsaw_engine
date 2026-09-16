import { useEffect } from 'react'

/** F12 / Ctrl+U / DevTools kısayollarını engeller (tam koruma değildir). */
export function useBlockDevShortcuts() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      const ctrl = e.ctrlKey || e.metaKey
      if (e.key === 'F12') {
        e.preventDefault()
        e.stopPropagation()
        return
      }
      if (ctrl && key === 'u') {
        e.preventDefault()
        e.stopPropagation()
        return
      }
      if (ctrl && e.shiftKey && (key === 'i' || key === 'j' || key === 'c' || key === 'k')) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [])
}
