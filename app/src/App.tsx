import { Routes, Route, Link } from 'react-router-dom'
import SceneList from './pages/SceneList'
import SceneDetail from './pages/SceneDetail'
import Practice from './pages/Practice'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <div className="min-h-screen bg-[#111111] text-[#F4F4F5]">
      <header className="border-b border-white/8">
        <div className="px-6 py-5">
          <Link 
            to="/" 
            className="flex items-baseline gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="text-[13px] font-medium tracking-[1.5px]">FINGERMEM</div>
            <div className="text-[10px] text-white/40 tracking-[1px] font-mono">INSTRUMENT</div>
          </Link>
        </div>
      </header>

      <main className="max-w-[720px] mx-auto px-6 py-10">
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

export default App
