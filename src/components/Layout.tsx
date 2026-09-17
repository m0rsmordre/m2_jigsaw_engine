import { NavLink, Outlet } from 'react-router-dom'
import { FlagEn, FlagTr } from './Flags'
import { useBlockDevShortcuts } from '../hooks/useBlockDevShortcuts'
import { useLang } from '../hooks/useLang'

const ext =
  'rounded-full px-3 py-1.5 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white border border-transparent'

export function Layout() {
  useBlockDevShortcuts()
  const { lang, setLang, d } = useLang()
  const link =
    'rounded-full px-3 py-1.5 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white'
  const active = 'bg-sky-400/15 text-sky-200 border border-sky-400/30'

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-5">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h1 className="bg-gradient-to-r from-sky-300 to-violet-300 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
            {d.appTitle}
          </h1>
        </div>
        <nav className="flex flex-wrap items-center gap-1.5">
          <NavLink to="/" end className={({ isActive }) => `${link} ${isActive ? active : 'border border-transparent'}`}>
            {d.navPlay}
          </NavLink>
          {/* Full-page static HTML for crawlers / AdSense */}
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
            <button
              type="button"
              aria-label="Türkçe"
              title="Türkçe"
              className={`flex items-center px-2.5 py-1.5 ${lang === 'tr' ? 'bg-white/15' : 'opacity-55 hover:opacity-90'}`}
              onClick={() => setLang('tr')}
            >
              <FlagTr className="h-3.5 w-[1.35rem] overflow-hidden rounded-[2px] shadow-sm" />
            </button>
            <button
              type="button"
              aria-label="English"
              title="English"
              className={`flex items-center px-2.5 py-1.5 ${lang === 'en' ? 'bg-white/15' : 'opacity-55 hover:opacity-90'}`}
              onClick={() => setLang('en')}
            >
              <FlagEn className="h-3.5 w-[1.35rem] overflow-hidden rounded-[2px] shadow-sm" />
            </button>
          </div>
        </nav>
      </header>
      <Outlet />
      <footer className="mt-auto border-t border-white/10 pt-4 text-center text-xs text-slate-500">
        <nav className="mb-2 flex flex-wrap justify-center gap-3">
          <a className="hover:text-sky-300" href="/terms/">
            Terms
          </a>
          <a className="hover:text-sky-300" href="/privacy/">
            Privacy
          </a>
          <a className="hover:text-sky-300" href="/cookie-policy/">
            Cookie Policy
          </a>
          <a className="hover:text-sky-300" href="/contact/">
            Contact
          </a>
          <a className="hover:text-sky-300" href="/calendar/">
            Calendar
          </a>
        </nav>
        <p>{d.disclaimer}</p>
      </footer>
    </div>
  )
}
