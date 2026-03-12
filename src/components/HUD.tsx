import { useSimulator } from '../store/simulator'
import { encounters } from '../encounters'

export function HUD() {
  const {
    status,
    phaseIndex,
    wasCorrect,
    variant,
    selectedEncounterId,
    selectedMechanicId,
    selectedStrategyId,
    nextPhase,
    reset,
    showHints,
    toggleHints,
  } = useSimulator()

  if (status === 'idle') return null

  const strategy = (() => {
    if (!selectedEncounterId || !selectedMechanicId || !selectedStrategyId) return null
    const enc = encounters.find((e) => e.id === selectedEncounterId)
    const mech = enc?.mechanics.find((m) => m.id === selectedMechanicId)
    return mech?.strategies.find((s) => s.id === selectedStrategyId) ?? null
  })()

  const currentPhase = strategy?.phases[phaseIndex]
  const totalPhases = strategy?.phases.length ?? 1
  const isLastPhase = phaseIndex >= totalPhases - 1

  return (
    <div className="hud">
      {variant && (
        <div className="hud-variant">Variant: {variant.label}</div>
      )}

      {currentPhase && (
        <div className="hud-prompt">{currentPhase.prompt}</div>
      )}

      <div className="hud-phase-counter">
        Phase {phaseIndex + 1} / {totalPhases}
      </div>

      {status === 'showing-result' && (
        <div className={`hud-result ${wasCorrect ? 'correct' : 'wrong'}`}>
          {wasCorrect ? '✓ Correct!' : '✗ Wrong — see green ring for correct position'}
        </div>
      )}

      <div className="hud-actions">
        <button className="hud-btn" onClick={reset}>
          Try Again
        </button>
        {currentPhase?.getHints && (
          <button className="hud-btn hud-btn-hint" onClick={toggleHints}>
            {showHints ? 'Hide Hints' : 'Show Hints'}
          </button>
        )}
        {strategy?.url && (
          <a className="strategy-link" href={strategy.url} target="_blank" rel="noreferrer">
            Strategy guide
          </a>
        )}
        {status === 'showing-result' && !isLastPhase && (
          <button className="hud-btn" onClick={nextPhase}>
            Next Phase
          </button>
        )}
        {status === 'showing-result' && isLastPhase && wasCorrect && (
          <button className="hud-btn" onClick={nextPhase}>
            Finish
          </button>
        )}
        {status === 'complete' && (
          <button className="hud-btn" onClick={reset}>
            Play Again
          </button>
        )}
      </div>

      {status === 'complete' && (
        <div className="hud-complete">All phases complete!</div>
      )}
    </div>
  )
}
