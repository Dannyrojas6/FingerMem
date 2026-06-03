import { Routes, Route, useLocation } from 'react-router-dom'
import SceneList from './pages/SceneList'
import SceneDetail from './pages/SceneDetail'
import Practice from './pages/Practice'
import ErrorBoundary from './components/ErrorBoundary'
import AppBrand from './components/AppBrand'

function AppRoutes() {
  const location = useLocation()
  const isPractice = location.pathname.startsWith('/practice/')
  const isHome = location.pathname === '/'
  const wideShell = isHome || isPractice

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <header className="shrink-0 border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div
          className={
            wideShell
              ? 'mx-auto flex h-14 max-w-7xl items-center px-6 md:px-10'
              : 'mx-auto flex h-14 max-w-lg items-center px-5'
            }
          >
            <AppBrand />
          </div>
        </header>

      <main
        className={
          isPractice
            ? 'flex min-h-0 flex-1 flex-col'
            : isHome
              ? 'mx-auto w-full max-w-7xl px-6 md:px-10'
              : 'mx-auto w-full max-w-lg px-5'
        }
      >
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<SceneList />} />
            <Route path="/scene/:sceneId" element={<SceneDetail />} />
            <Route path="/practice/:sceneId/:index" element={<Practice />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  )
}

function App() {
  return <AppRoutes />
}

export default App