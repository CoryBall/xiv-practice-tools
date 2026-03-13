import type { Vec2 } from "../../../../engine/types";
import type { BossCloneMechanic } from "./types";

export const ALL_ROLES = ['MT', 'OT', 'H1', 'H2', 'M1', 'M2', 'R1', 'R2'] as const

export const CLONE_RADIUS = 0.07
export const PHASE3_RADIUS = 0.015
export const BOSS_CENTER: Vec2 = { x: 0.5, y: 0.5 }

// Phase 3 destination positions by role/mechanic
export const PHASE3_POSITIONS = {
  S:           { x: 0.5,   y: 0.9   },
  N:           { x: 0.5,   y: 0.265 },
  prox_g1:     { x: 0.125, y: 0.575 },
  prox_g2:     { x: 0.875, y: 0.575 },
  stack_g1:    { x: 0.46, y: 0.1   },
  stack_g2:    { x: 0.54, y: 0.1   },
  cone_g1:     { x: 0.375, y: 0.12  },
  cone_g2:     { x: 0.625, y: 0.12  },
} as const

// Player clone positions (outer ring), indexed 0–7
export const CLONE_POSITIONS: Vec2[] = [
  { x: 0.5, y: 0.2 },    // 0: N
  { x: 0.725, y: 0.275 }, // 1: NE
  { x: 0.815, y: 0.5 },  // 2: E
  { x: 0.725, y: 0.725 }, // 3: SE
  { x: 0.5, y: 0.8 },    // 4: S
  { x: 0.275, y: 0.725 }, // 5: SW
  { x: 0.185, y: 0.5 },  // 6: W
  { x: 0.275, y: 0.275 }, // 7: NW
]
export const CLONE_ROTATIONS = [0, 45, 90, 135, 180, 225, 270, 315]
export const CLONE_HAZARDS = CLONE_POSITIONS.map((pos, i) => ({
  id: `clone-${i + 1}`,
  shape: { type: 'boss' as const, pos, rotation: CLONE_ROTATIONS[i], scale: 0.75 },
}))

// Inner hexagon boss clones, indexed 0–5
export const BOSS_CLONE_POSITIONS: Vec2[] = [
  { x: 0.615, y: 0.3 },  // 0: NE, rotation 30
  { x: 0.715, y: 0.5 },  // 1: E,  rotation 90
  { x: 0.615, y: 0.7 },  // 2: SE, rotation 150
  { x: 0.385, y: 0.7 },  // 3: SW, rotation 210
  { x: 0.285, y: 0.5 },  // 4: W,  rotation 270
  { x: 0.385, y: 0.3 },  // 5: NW, rotation 330
]
export const BOSS_CLONE_ROTATIONS = [30, 90, 150, 210, 270, 330]
export const BOSS_CLONE_MECHANICS: BossCloneMechanic[] = [
  { type: 'prox',  url: '/assets/hazards/m12_p2_prox.png' },
  { type: 'prox',  url: '/assets/hazards/m12_p2_prox.png' },
  { type: 'stack', url: '/assets/hazards/m12_p2_stack.png' },
  { type: 'stack', url: '/assets/hazards/m12_p2_stack.png' },
  { type: 'cone' },
  { type: 'cone' },
]
export const BOSS_CLONE_HAZARDS = BOSS_CLONE_POSITIONS.map((pos, i) => ({
  id: `boss-clone-${i + 1}`,
  shape: { type: 'boss' as const, pos, rotation: BOSS_CLONE_ROTATIONS[i], scale: 1 },
}))

// Phase 2 priority rules, indexed parallel to CLONE_POSITIONS
export type CloneRule =
  | { kind: 'stay' }
  | { kind: 'center' }
  | { kind: 'mechanic'; mechType: string; direction: 'CW' | 'CCW' }

export const CLONE_RULES: CloneRule[] = [
  { kind: 'center' },                                         // 0: N  → stand at boss center
  { kind: 'mechanic', mechType: 'stack', direction: 'CW' },  // 1: NE → stack, CW
  { kind: 'mechanic', mechType: 'cone',  direction: 'CW' },  // 2: E  → cone, CW
  { kind: 'mechanic', mechType: 'prox',  direction: 'CW' },  // 3: SE → prox, CW
  { kind: 'stay' },                                          // 4: S  → stay
  { kind: 'mechanic', mechType: 'prox',  direction: 'CCW' }, // 5: SW → prox, CCW
  { kind: 'mechanic', mechType: 'cone',  direction: 'CCW' }, // 6: W  → cone, CCW
  { kind: 'mechanic', mechType: 'stack', direction: 'CCW' }, // 7: NW → stack, CCW
]

// Full scan order from N — group 2 goes CW, group 1 goes CCW
// Scanning all 6 ensures correct priority even when two same-mechanic clones land on the same side
export const CW_ORDER  = [0, 1, 2, 3, 4, 5] // NE → E → SE → SW → W → NW
export const CCW_ORDER = [5, 4, 3, 2, 1, 0] // NW → W → SW → SE → E → NE
