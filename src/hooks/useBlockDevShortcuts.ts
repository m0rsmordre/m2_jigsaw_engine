import { useEffect } from 'react'

/** F12 / sağ tık / DevTools kısayollarını engeller. Ctrl+U şimdilik serbest. */
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
      // Ctrl+U temporarily allowed (view-source)
      if (ctrl && e.shiftKey && (key === 'i' || key === 'j' || key === 'c' || key === 'k')) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('contextmenu', onContextMenu, true)
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('contextmenu', onContextMenu, true)
    }
  }, [])
}
