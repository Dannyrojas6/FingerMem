import { Routes, Route, useLocation } from 'react-router-dom'
import SceneList from './pages/SceneList'
import SceneDetail from './pages/SceneDetail'
import Practice from './pages/Practice'
import ErrorBoundary from './components/ErrorBoundary'
import AppBrand from './components/AppBrand'

function AppRoutes() {
  const location = useLocation()
  const isPractice = location.pathname.startsWith('/practice/')

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {!isPractice && (
        <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm">
          <div
            className={
              location.pathname === '/'
                ? 'mx-auto flex h-14 max-w-7xl items-center px-6 md:px-10'
                : 'mx-auto flex h-14 max-w-lg items-center px-5'
            }
          >
            <AppBrand />
          </div>
        </header>
      )}

      <main
        className={
          isPractice
            ? ''
            : location.pathname === '/'
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