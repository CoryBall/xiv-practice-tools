import { create } from 'zustand'
import type { Role, Vec2, Variant } from '../engine/types'
import { encounters } from '../encounters'
import { distance } from '../utils/geometry'

// Read URL params once at module load time, before React renders anything.
// Params: e=encounterId  m=mechanicId  s=strategyId  r=role
const ALL_ROLE_SET = new Set<Role>(['MT', 'OT', 'H1', 'H2', 'M1', 'M2', 'R1', 'R2'])

function selectionsFromUrl(): {
  selectedEncounterId: string | null
  selectedMechanicId: string | null
  selectedStrategyId: string | null
  selectedRole: Role | null
} {
  const none = { selectedEncounterId: null, selectedMechanicId: null, selectedStrategyId: null, selectedRole: null }
  try {
    const p = new URLSearchParams(window.location.search)
    const encounter = encounters.find((e) => e.id === p.get('e'))
    if (!encounter) return none
    const mechanic = encounter.mechanics.find((m) => m.id === p.get('m'))
    const strategy = mechanic?.strategies.find((s) => s.id === p.get('s'))
    const r = p.get('r') as Role | null
    return {
      selectedEncounterId: encounter.id,
      selectedMechanicId: mechanic?.id ?? null,
      selectedStrategyId: strategy?.id ?? null,
      selectedRole: r && ALL_ROLE_SET.has(r) ? r : null,
    }
  } catch {
    return none
  }
}

type Status = 'idle' | 'awaiting-click' | 'showing-result' | 'complete'

interface SimulatorStore {
  // Selection
  selectedEncounterId: string | null
  selectedMechanicId: string | null
  selectedStrategyId: string | null
  selectedRole: Role | null

  // Game state
  status: Status
  phaseIndex: number
  variant: Variant | null       // current phase's variant
  variantHistory: Variant[]     // all rolled variants, index = phase index
  state: unknown                // mechanic-level state, evolves per phase via updateState
  userClick: Vec2 | null
  solution: Vec2 | null
  wasCorrect: boolean | null
  npcPositions: Partial<Record<Role, Vec2>>

  // Actions
  selectEncounter: (id: string) => void
  selectMechanic: (id: string) => void
  selectStrategy: (id: string) => void
  selectRole: (role: Role) => void
  startAtPhase: number
  setStartAtPhase: (n: number) => void
  start: () => void
  handleClick: (pos: Vec2) => void
  nextPhase: () => void
  reset: () => void
  showHints: boolean
  toggleHints: () => void
}

const ALL_ROLES: Role[] = ['MT', 'OT', 'H1', 'H2', 'M1', 'M2', 'R1', 'R2']

function computeNpcPositions(
  variant: Variant | null,
  state: unknown,
  userRole: Role,
  strategyId: string,
  mechanicId: string,
  encounterId: string,
  phaseIndex: number,
): Partial<Record<Role, Vec2>> {
  const encounter = encounters.find((e) => e.id === encounterId)
  const mechanic = encounter?.mechanics.find((m) => m.id === mechanicId)
  const strategy = mechanic?.strategies.find((s) => s.id === strategyId)
  if (!strategy) return {}

  const phase = strategy.phases[phaseIndex]
  if (!phase) return {}

  if (phase.setPlayerPositions) {
    const positions: Partial<Record<Role, Vec2>> = {}
    for (const { role, pos } of phase.setPlayerPositions(variant, state)) {
      positions[role] = pos
    }
    return positions
  }

  const positions: Partial<Record<Role, Vec2>> = {}
  for (const role of ALL_ROLES) {
    if (role !== userRole) {
      positions[role] = phase.getSolution(variant, role, state)
    }
  }
  return positions
}

export const useSimulator = create<SimulatorStore>((set, get) => ({
  // Selection — pre-populated from URL params if present
  ...selectionsFromUrl(),

  // Game state
  status: 'idle',
  phaseIndex: 0,
  variant: null,
  variantHistory: [],
  state: null,
  userClick: null,
  solution: null,
  wasCorrect: null,
  npcPositions: {},

  startAtPhase: 0,

  // Actions
  selectEncounter: (id) =>
    set({
      selectedEncounterId: id,
      selectedMechanicId: null,
      selectedStrategyId: null,
    }),

  selectMechanic: (id) =>
    set({
      selectedMechanicId: id,
      selectedStrategyId: null,
    }),

  selectStrategy: (id) => set({ selectedStrategyId: id, startAtPhase: 0 }),

  selectRole: (role) => set({ selectedRole: role }),

  setStartAtPhase: (n) => set({ startAtPhase: n }),

  start: () => {
    const { selectedEncounterId, selectedMechanicId, selectedStrategyId, selectedRole, startAtPhase } = get()
    if (!selectedEncounterId || !selectedMechanicId || !selectedStrategyId || !selectedRole) return

    const encounter = encounters.find((e) => e.id === selectedEncounterId)
    const mechanic = encounter?.mechanics.find((m) => m.id === selectedMechanicId)
    const strategy = mechanic?.strategies.find((s) => s.id === selectedStrategyId)
    if (!strategy) return

    const targetIndex = Math.min(startAtPhase, strategy.phases.length - 1)

    // Roll initial state then fast-forward through skipped phases using solution positions
    let state = strategy.rollState ? strategy.rollState() : (strategy.initialState ?? null)
    const variantHistory: Variant[] = []
    for (let i = 0; i < targetIndex; i++) {
      const phase = strategy.phases[i]!
      const v = phase.rollVariant ? phase.rollVariant(variantHistory) : null
      if (v) variantHistory.push(v)
      const sol = phase.getSolution(v, selectedRole, state)
      if (phase.updateState) {
        state = phase.updateState(state, v, selectedRole, sol, true)
      }
    }

    const targetPhase = strategy.phases[targetIndex]!
    const variant = targetPhase.rollVariant ? targetPhase.rollVariant(variantHistory) : null
    if (variant) variantHistory.push(variant)

    const npcPositions = computeNpcPositions(
      variant,
      state,
      selectedRole,
      selectedStrategyId,
      selectedMechanicId,
      selectedEncounterId,
      targetIndex,
    )

    set({
      status: 'awaiting-click',
      phaseIndex: targetIndex,
      variant,
      variantHistory,
      state,
      userClick: null,
      solution: null,
      wasCorrect: null,
      npcPositions,
      showHints: strategy.hintsDefault ?? false,
    })
  },

  handleClick: (pos) => {
    const {
      status,
      variant,
      state,
      selectedEncounterId,
      selectedMechanicId,
      selectedStrategyId,
      selectedRole,
      phaseIndex,
    } = get()
    if (status !== 'awaiting-click') return
    if (!selectedEncounterId || !selectedMechanicId || !selectedStrategyId || !selectedRole) return

    const encounter = encounters.find((e) => e.id === selectedEncounterId)
    const mechanic = encounter?.mechanics.find((m) => m.id === selectedMechanicId)
    const strategy = mechanic?.strategies.find((s) => s.id === selectedStrategyId)
    if (!strategy) return

    const phase = strategy.phases[phaseIndex]
    if (!phase) return

    const sol = phase.getSolution(variant, selectedRole, state)
    const correct = phase.isCorrect
      ? phase.isCorrect(pos, variant, selectedRole, state)
      : distance(pos, sol) <= (phase.tolerance ?? 0.1)

    set({
      userClick: pos,
      solution: sol,
      wasCorrect: correct,
      status: 'showing-result',
    })

    if (correct && phase.autoAdvance) {
      setTimeout(() => get().nextPhase(), 800)
    }
  },

  nextPhase: () => {
    const {
      variantHistory,
      variant,
      state,
      userClick,
      wasCorrect,
      selectedEncounterId,
      selectedMechanicId,
      selectedStrategyId,
      selectedRole,
      phaseIndex,
    } = get()
    if (!selectedEncounterId || !selectedMechanicId || !selectedStrategyId || !selectedRole) return

    const encounter = encounters.find((e) => e.id === selectedEncounterId)
    const mechanic = encounter?.mechanics.find((m) => m.id === selectedMechanicId)
    const strategy = mechanic?.strategies.find((s) => s.id === selectedStrategyId)
    if (!strategy) return

    const nextIndex = phaseIndex + 1
    if (nextIndex >= strategy.phases.length) {
      set({ status: 'complete' })
      return
    }

    // Let the current phase transform the state before the next phase loads
    const currentPhase = strategy.phases[phaseIndex]!
    const nextState = currentPhase.updateState ? currentPhase.updateState(state, variant, selectedRole, userClick, wasCorrect ?? false) : state

    const nextPhase = strategy.phases[nextIndex]!
    const nextVariant = nextPhase.rollVariant ? nextPhase.rollVariant(variantHistory) : null
    const npcPositions = computeNpcPositions(
      nextVariant,
      nextState,
      selectedRole,
      selectedStrategyId,
      selectedMechanicId,
      selectedEncounterId,
      nextIndex,
    )

    set({
      phaseIndex: nextIndex,
      variant: nextVariant,
      variantHistory: nextVariant ? [...variantHistory, nextVariant] : variantHistory,
      state: nextState,
      userClick: null,
      solution: null,
      wasCorrect: null,
      status: 'awaiting-click',
      npcPositions,
    })
  },

  reset: () =>
    set({
      status: 'idle',
      phaseIndex: 0,
      variant: null,
      variantHistory: [],
      state: null,
      userClick: null,
      solution: null,
      wasCorrect: null,
      npcPositions: {},
      showHints: false,
    }),

  showHints: false,
  toggleHints: () => set((s) => ({ showHints: !s.showHints })),
}))
