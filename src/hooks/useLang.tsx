import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { t, type Dict, type Lang } from '../i18n'

type Ctx = {
  lang: Lang
  setLang: (l: Lang) => void
  d: Dict
}

const LangContext = createContext<Ctx | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem('fj-lang')
    return saved === 'en' || saved === 'tr' ? saved : 'tr'
  })
  const value = useMemo(() => {
    const wrapped = (l: Lang) => {
      localStorage.setItem('fj-lang', l)
      setLang(l)
    }
    return { lang, setLang: wrapped, d: t(lang) }
  }, [lang])
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('LangProvider missing')
  return ctx
}
