import { NavLink, Outlet } from 'react-router-dom'
import type { ReactNode } from 'react'
import { FlagDe, FlagEn, FlagTr } from './Flags'
import { useBlockDevShortcuts } from '../hooks/useBlockDevShortcuts'
import { useLang } from '../hooks/useLang'
import type { Lang } from '../i18n'

const ext =
  'rounded-full px-3 py-1.5 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white border border-transparent'

function LangBtn({
  code,
  active,
  onClick,
  label,
  children,
}: {
  code: Lang
  active: boolean
  onClick: () => void
  label: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`flex items-center px-2.5 py-1.5 ${active ? 'bg-white/15' : 'opacity-55 hover:opacity-90'}`}
      onClick={onClick}
      data-lang={code}
    >
      {children}
    </button>
  )
}

export function Layout() {
  useBlockDevShortcuts()
  const { lang, setLang, d } = useLang()
  const link =
    'rounded-full px-3 py-1.5 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white'
  const active = 'bg-sky-400/15 text-sky-200 border border-sky-400/30'
  const flagCls = 'h-3.5 w-[1.35rem] overflow-hidden rounded-[2px] shadow-sm'

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-5">
      <header className="mb-5 flex flex-col gap-3 border-b border-white/10 pb-4">
        <div>
          <h1 className="bg-gradient-to-r from-sky-300 to-violet-300 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
            {d.appTitle}
          </h1>
        </div>
        <nav className="flex flex-wrap items-center gap-1.5">
          <NavLink to="/" end className={({ isActive }) => `${link} ${isActive ? active : 'border border-transparent'}`}>
            {d.navPlay}
          </NavLink>
          <a className={ext} href="/how-to/">
            {d.navHowTo}
          </a>
          <a className={ext} href="/rules/">
            {d.navRules}
          </a>
          <a className={ext} href="/calendar/">
            {d.navCalendar}
          </a>
          <a className={ext} href="/about/">
            {d.navAbout}
          </a>
          <a className={ext} href="/contact/">
            {d.navContact}
          </a>
          <div className="ml-2 flex overflow-hidden rounded-full border border-white/15">
            <LangBtn code="tr" active={lang === 'tr'} label="Türkçe" onClick={() => setLang('tr')}>
              <FlagTr className={flagCls} />
            </LangBtn>
            <LangBtn code="en" active={lang === 'en'} label="English" onClick={() => setLang('en')}>
              <FlagEn className={flagCls} />
            </LangBtn>
            <LangBtn code="de" active={lang === 'de'} label="Deutsch" onClick={() => setLang('de')}>
              <FlagDe className={flagCls} />
            </LangBtn>
          </div>
        </nav>
      </header>
      <Outlet />
      <footer className="mt-auto border-t border-white/10 pt-4 text-center text-xs text-slate-500">
        <nav className="mb-2 flex flex-wrap justify-center gap-3">
          <a className="hover:text-sky-300" href="/terms/">
            {d.footerTerms}
          </a>
          <a className="hover:text-sky-300" href="/privacy/">
            {d.footerPrivacy}
          </a>
          <a className="hover:text-sky-300" href="/cookie-policy/">
            {d.footerCookies}
          </a>
          <a className="hover:text-sky-300" href="/contact/">
            {d.footerContact}
          </a>
          <a className="hover:text-sky-300" href="/calendar/">
            {d.footerCalendar}
          </a>
        </nav>
        <p>{d.disclaimer}</p>
      </footer>
    </div>
  )
}
