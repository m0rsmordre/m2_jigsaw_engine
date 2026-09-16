import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { LangProvider } from './hooks/useLang'
import { AboutPage, HowToPage, RulesPage } from './pages/InfoPages'
import { PlayPage } from './pages/PlayPage'

export default function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<PlayPage />} />
            <Route path="rules" element={<RulesPage />} />
            <Route path="how-to" element={<HowToPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LangProvider>
  )
}
