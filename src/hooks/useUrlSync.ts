import { useEffect } from 'react'
import { useSimulator } from '../store/simulator'

/**
 * Keeps URL query params in sync with the current selection state.
 * Initial population from URL is handled in the store initializer (simulator.ts).
 *
 * Params: e=encounterId  m=mechanicId  s=strategyId  r=role
 */
export function useUrlSync() {
  const { selectedEncounterId, selectedMechanicId, selectedStrategyId, selectedRole } =
    useSimulator()

  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedEncounterId) params.set('e', selectedEncounterId)
    if (selectedMechanicId) params.set('m', selectedMechanicId)
    if (selectedStrategyId) params.set('s', selectedStrategyId)
    if (selectedRole) params.set('r', selectedRole)

    const newUrl = `${window.location.pathname}${params.size > 0 ? `?${params.toString()}` : ''}`
    if (newUrl !== window.location.pathname + window.location.search) {
      history.replaceState(null, '', newUrl)
    }
  }, [selectedEncounterId, selectedMechanicId, selectedStrategyId, selectedRole])
}
