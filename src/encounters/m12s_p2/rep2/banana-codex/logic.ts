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
