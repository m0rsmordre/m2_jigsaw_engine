import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { LangProvider } from './hooks/useLang'
import { PlayPage } from './pages/PlayPage'

/**
 * Interactive puzzle lives in the SPA.
 * Content pages (how-to, rules, about, calendar, legal, contact) are static HTML
 * under public page folders so Googlebot/AdSense can read them without JS.
 */
export default function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<PlayPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LangProvider>
  )
}
