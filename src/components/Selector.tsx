import { useSimulator } from '../store/simulator'
import { encounters } from '../encounters'
import type { Role } from '../engine/types'

const ROLES: Role[] = ['MT', 'OT', 'H1', 'H2', 'M1', 'M2', 'R1', 'R2']

export function Selector() {
  const {
    selectedEncounterId,
    selectedMechanicId,
    selectedStrategyId,
    selectedRole,
    status,
    startAtPhase,
    selectEncounter,
    selectMechanic,
    selectStrategy,
    selectRole,
    setStartAtPhase,
    start,
  } = useSimulator()

  const selectedEncounter = encounters.find((e) => e.id === selectedEncounterId)
  const selectedMechanic = selectedEncounter?.mechanics.find((m) => m.id === selectedMechanicId)
  const selectedStrategy = selectedMechanic?.strategies.find((s) => s.id === selectedStrategyId)

  const canStart =
    selectedEncounterId !== null &&
    selectedMechanicId !== null &&
    selectedStrategyId !== null &&
    selectedRole !== null

  if (status !== 'idle') return null

  return (
    <div className="selector">
      <h2>Select Encounter</h2>

      <div className="selector-row">
        <label htmlFor="encounter-select">Encounter</label>
        <select
          id="encounter-select"
          value={selectedEncounterId ?? ''}
          onChange={(e) => selectEncounter(e.target.value)}
        >
          <option value="" disabled>
            — pick encounter —
          </option>
          {encounters.map((enc) => (
            <option key={enc.id} value={enc.id}>
              {enc.name}
            </option>
          ))}
        </select>
      </div>

      <div className="selector-row">
        <label htmlFor="mechanic-select">Mechanic</label>
        <select
          id="mechanic-select"
          value={selectedMechanicId ?? ''}
          onChange={(e) => selectMechanic(e.target.value)}
          disabled={!selectedEncounter}
        >
          <option value="" disabled>
            — pick mechanic —
          </option>
          {selectedEncounter?.mechanics.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="selector-row">
        <label htmlFor="strategy-select">Strategy</label>
        <select
          id="strategy-select"
          value={selectedStrategyId ?? ''}
          onChange={(e) => selectStrategy(e.target.value)}
          disabled={!selectedMechanic}
        >
          <option value="" disabled>
            — pick strategy —
          </option>
          {selectedMechanic?.strategies.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="selector-row">
        <label>Role</label>
        <div className="role-grid">
          {ROLES.map((role) => (
            <button
              key={role}
              className={`role-btn ${selectedRole === role ? 'active' : ''}`}
              onClick={() => selectRole(role)}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {selectedStrategy && import.meta.env.DEV && (
        <div className="selector-row">
          <label htmlFor="phase-select">Start at phase</label>
          <select
            id="phase-select"
            value={startAtPhase}
            onChange={(e) => setStartAtPhase(Number(e.target.value))}
          >
            {selectedStrategy.phases.map((phase, i) => (
              <option key={phase.id} value={i}>
                {i + 1}. {phase.prompt}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedStrategy?.url && (
        <a className="strategy-link" href={selectedStrategy.url} target="_blank" rel="noreferrer">
          Read the {selectedStrategy.name} guide
        </a>
      )}

      <button className="start-btn" disabled={!canStart} onClick={start}>
        Start
      </button>
    </div>
  )
}
