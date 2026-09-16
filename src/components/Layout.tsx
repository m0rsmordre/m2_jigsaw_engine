import { NavLink, Outlet } from 'react-router-dom'
import { FlagEn, FlagTr } from './Flags'
import { useBlockDevShortcuts } from '../hooks/useBlockDevShortcuts'
import { useLang } from '../hooks/useLang'

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
          <h1 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-violet-300">
            {d.appTitle}
          </h1>
        </div>
        <nav className="flex flex-wrap items-center gap-1.5">
          <NavLink to="/" end className={({ isActive }) => `${link} ${isActive ? active : 'border border-transparent'}`}>
            {d.navPlay}
          </NavLink>
          <NavLink to="/rules" className={({ isActive }) => `${link} ${isActive ? active : 'border border-transparent'}`}>
            {d.navRules}
          </NavLink>
          <NavLink to="/how-to" className={({ isActive }) => `${link} ${isActive ? active : 'border border-transparent'}`}>
            {d.navHowTo}
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => `${link} ${isActive ? active : 'border border-transparent'}`}>
            {d.navAbout}
          </NavLink>
          <div className="ml-2 flex overflow-hidden rounded-full border border-white/15">
            <button
              type="button"
              aria-label="Türkçe"
              title="Türkçe"
              className={`flex items-center px-2.5 py-1.5 ${lang === 'tr' ? 'bg-white/15' : 'opacity-55 hover:opacity-90'}`}
              onClick={() => setLang('tr')}
            >
              <FlagTr className="h-4 w-6 rounded-[2px] shadow-sm" />
            </button>
            <button
              type="button"
              aria-label="English"
              title="English"
              className={`flex items-center px-2.5 py-1.5 ${lang === 'en' ? 'bg-white/15' : 'opacity-55 hover:opacity-90'}`}
              onClick={() => setLang('en')}
            >
              <FlagEn className="h-4 w-6 rounded-[2px] shadow-sm" />
            </button>
          </div>
        </nav>
      </header>
      <Outlet />
      <footer className="mt-auto border-t border-white/10 pt-4 text-center text-xs text-slate-500">
        {d.disclaimer}
      </footer>
    </div>
  )
}
