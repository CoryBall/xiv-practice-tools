import './App.css'
import { Selector } from './components/Selector'
import { Arena } from './components/Arena'
import { HUD } from './components/HUD'
import { useUrlSync } from './hooks/useUrlSync'

export function App() {
  useUrlSync()

  return (
    <div className="app">
      <header className="app-header">
        <h1>XIV Practice Tools</h1>
      </header>
      <main className="app-main">
        <Selector />
        <div className="game-area">
          <Arena />
          <HUD />
        </div>
      </main>
    </div>
  )
}
