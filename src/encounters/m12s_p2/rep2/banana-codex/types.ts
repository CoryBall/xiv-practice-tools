import type { Role, Vec2 } from "../../../../engine/types";

export type BossCloneMechanic = { type: string; url?: string }

export interface Replication2State {
  group1Players: Role[];
  group2Players: Role[];
  playerPositions: { role: Role, pos: Vec2 }[];
  cloneAssignments: Record<Role, Vec2>;
  /** Shuffled mechanics, indexed parallel to BOSS_CLONE_POSITIONS */
  bossCloneMechanics: BossCloneMechanic[];
  /** Correct destination for each role in phase 2 */
  phase2Assignments: Record<Role, Vec2>;
  /** All valid hint positions for each role in phase 2 */
  phase2HintPositions: Partial<Record<Role, Vec2[]>>;
}
