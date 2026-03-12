import './App.css'
import { Selector } from './components/Selector'
import { Arena } from './components/Arena'
import { HUD } from './components/HUD'
import { useUrlSync } from './hooks/useUrlSync'
import { useSimulator } from './store/simulator'

export function App() {
  useUrlSync()
  const status = useSimulator((s) => s.status)

  return (
    <div className="app">
      <header className="app-header">
        <h1>XIV Practice Tools</h1>
      </header>
      <main className="app-main">
        {(status === 'idle' && !import.meta.env.DEV) ? (
          <Selector />
        ) : (
          <div className="game-area">
            {import.meta.env.DEV && <Selector />}
            <Arena />
            <HUD />
          </div>
        )}
      </main>
    </div>
  )
}
