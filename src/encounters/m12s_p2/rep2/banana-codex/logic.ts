import type { Role, Vec2 } from "../../../../engine/types";
import type { BossCloneMechanic, Replication2State } from "./types";
import {
  ALL_ROLES,
  BOSS_CENTER,
  BOSS_CLONE_POSITIONS,
  CLONE_POSITIONS,
  CLONE_RULES,
  CW_ORDER,
  CCW_ORDER,
  PHASE3_POSITIONS,
  PHASE4_POSITIONS,
  PHASE5_POSITIONS,
} from "./constants";

export function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function computePhase2(
  cloneAssignments: Record<Role, Vec2>,
  bossCloneMechanics: BossCloneMechanic[],
): {
  assignments: Record<Role, Vec2>
  hintPositions: Partial<Record<Role, Vec2[]>>
} {
  const assignments: Partial<Record<Role, Vec2>> = {}
  const hintPositions: Partial<Record<Role, Vec2[]>> = {}

  for (const role of ALL_ROLES) {
    const startPos = cloneAssignments[role]
    const slotIdx = CLONE_POSITIONS.findIndex(p => p.x === startPos.x && p.y === startPos.y)
    const rule = CLONE_RULES[slotIdx]

    if (!rule || rule.kind === 'stay') {
      assignments[role] = startPos
      hintPositions[role] = [startPos]
    } else if (rule.kind === 'center') {
      assignments[role] = BOSS_CENTER
      hintPositions[role] = [BOSS_CENTER]
    } else {
      hintPositions[role] = bossCloneMechanics
        .map((m, i) => m.type === rule.mechType ? BOSS_CLONE_POSITIONS[i] : null)
        .filter((p): p is Vec2 => p !== null)

      const order = rule.direction === 'CW' ? CW_ORDER : CCW_ORDER
      const assignedIdx = order.find(i => bossCloneMechanics[i].type === rule.mechType)
      assignments[role] = assignedIdx !== undefined
        ? BOSS_CLONE_POSITIONS[assignedIdx]
        : hintPositions[role][0]
    }
  }

  return {
    assignments: assignments as Record<Role, Vec2>,
    hintPositions,
  }
}

export function computeGroups(playerPositions: Replication2State['playerPositions']): {
  group1Players: Role[]
  group2Players: Role[]
} {
  const group1Players: Role[] = []
  const group2Players: Role[] = []

  for (const { role, pos } of playerPositions) {
    const slotIdx = CLONE_POSITIONS.findIndex(p => p.x === pos.x && p.y === pos.y)
    const rule = CLONE_RULES[slotIdx]
    if (!rule || rule.kind === 'stay' || (rule.kind === 'mechanic' && rule.direction === 'CCW')) {
      group1Players.push(role)
    } else {
      group2Players.push(role)
    }
  }

  return { group1Players, group2Players }
}

export function computePhase3(
  cloneAssignments: Record<Role, Vec2>,
  group1Players: Role[],
): Record<Role, Vec2> {
  const assignments: Partial<Record<Role, Vec2>> = {}

  for (const role of ALL_ROLES) {
    const slotIdx = CLONE_POSITIONS.findIndex(p => p.x === cloneAssignments[role].x && p.y === cloneAssignments[role].y)
    const rule = CLONE_RULES[slotIdx]
    const isGroup1 = group1Players.includes(role)

    if (!rule || rule.kind === 'stay') {
      assignments[role] = PHASE3_POSITIONS.S
    } else if (rule.kind === 'center') {
      assignments[role] = PHASE3_POSITIONS.N
    } else {
      const key = `${rule.mechType}_${isGroup1 ? 'g1' : 'g2'}` as keyof typeof PHASE3_POSITIONS
      assignments[role] = PHASE3_POSITIONS[key]
    }
  }

  return assignments as Record<Role, Vec2>
}

export function getPhase4Target(
  role: Role,
  cloneAssignments: Record<Role, Vec2>,
  group1Players: Role[],
): Vec2 {
  const slotIdx = CLONE_POSITIONS.findIndex(p => p.x === cloneAssignments[role].x && p.y === cloneAssignments[role].y)
  const rule = CLONE_RULES[slotIdx]
  const isCone = rule?.kind === 'mechanic' && rule.mechType === 'cone'
  const isGroup1 = group1Players.includes(role)

  if (isCone) {
    return isGroup1 ? PHASE4_POSITIONS.cone_group1 : PHASE4_POSITIONS.cone_group2
  }
  return isGroup1 ? PHASE4_POSITIONS.group1 : PHASE4_POSITIONS.group2
}

export function getPhase5Target(
  role: Role,
  cloneAssignments: Record<Role, Vec2>,
  group1Players: Role[],
): Vec2 {
  const slotIdx = CLONE_POSITIONS.findIndex(p => p.x === cloneAssignments[role].x && p.y === cloneAssignments[role].y)
  const rule = CLONE_RULES[slotIdx]
  const isGroup1 = group1Players.includes(role)

  if (rule?.kind === 'mechanic') {
    if (rule.mechType === 'cone')  return isGroup1 ? PHASE5_POSITIONS.cone_g1  : PHASE5_POSITIONS.cone_g2
    if (rule.mechType === 'stack') return isGroup1 ? PHASE5_POSITIONS.stack_g1 : PHASE5_POSITIONS.stack_g2
  }
  return PHASE5_POSITIONS.stack_rest
}

export function buildInitialPlayerPositions(): Replication2State['playerPositions'] {
  return [
    { role: 'MT', pos: { x: 0.5,  y: 0.4   } },
    { role: 'OT', pos: { x: 0.5,  y: 0.6   } },
    { role: 'M1', pos: { x: 0.40, y: 0.575 } },
    { role: 'M2', pos: { x: 0.60, y: 0.575 } },
    { role: 'H1', pos: { x: 0.325, y: 0.575 } },
    { role: 'H2', pos: { x: 0.625, y: 0.375 } },
    { role: 'R1', pos: { x: 0.325, y: 0.35  } },
    { role: 'R2', pos: { x: 0.75, y: 0.625 } },
  ]
}
