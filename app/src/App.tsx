import { Routes, Route } from 'react-router-dom'
import SceneList from './pages/SceneList'
import SceneDetail from './pages/SceneDetail'
import Practice from './pages/Practice'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">基础英语 850 · 打字练习</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
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
