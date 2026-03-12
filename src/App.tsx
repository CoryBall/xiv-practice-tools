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
        <div className="app-header-actions">
          <a
            href="https://github.com/CoryBall/xiv-practice-tools"
            target="_blank"
            rel="noreferrer"
          >
            <img
              src="/icons/github.png"
              alt="GitHub"
              style={{ height: '60px', width: '60px' }}
            />
          </a>
          <a
            href="https://www.buymeacoffee.com/sentienthusk"
            target="_blank"
          >
            <img
              src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
              alt="Buy Me A Coffee"
              style={{ height: '60px', width: '217px' }}
            />
          </a>
        </div>
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
